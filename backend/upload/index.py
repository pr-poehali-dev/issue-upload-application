"""Загрузка фотографий неисправностей в S3 и сохранение ссылок в БД."""
import json
import os
import base64
import uuid
import psycopg2
import boto3

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 't_p22151428_issue_upload_applica')
CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token, X-User-Id',
}


def get_db():
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    conn.autocommit = True
    return conn


def get_s3():
    return boto3.client(
        's3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
    )


def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    path = event.get('path', '/')
    method = event.get('httpMethod', 'GET')

    user_id = event.get('headers', {}).get('X-User-Id', '')

    # POST /upload/{fault_id} — загрузить фото к неисправности
    if method == 'POST':
        if not user_id:
            return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'Не авторизован'})}

        parts = path.rstrip('/').split('/')
        try:
            fault_id = int(parts[-1])
        except (ValueError, IndexError):
            return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Укажите fault_id в пути'})}

        body = json.loads(event.get('body') or '{}')
        photos = body.get('photos', [])

        if not photos:
            return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Нет фотографий'})}

        s3 = get_s3()
        access_key = os.environ['AWS_ACCESS_KEY_ID']
        uploaded_urls = []

        for photo in photos:
            data_str = photo.get('data', '')
            filename = photo.get('filename', 'photo.jpg')
            content_type = photo.get('content_type', 'image/jpeg')

            if ',' in data_str:
                data_str = data_str.split(',', 1)[1]

            img_bytes = base64.b64decode(data_str)
            ext = filename.rsplit('.', 1)[-1] if '.' in filename else 'jpg'
            key = f"faults/{fault_id}/{uuid.uuid4().hex}.{ext}"

            s3.put_object(
                Bucket='files',
                Key=key,
                Body=img_bytes,
                ContentType=content_type,
            )

            cdn_url = f"https://cdn.poehali.dev/projects/{access_key}/bucket/{key}"
            uploaded_urls.append({'url': cdn_url, 'filename': filename})

        conn = get_db()
        cur = conn.cursor()
        for item in uploaded_urls:
            cur.execute(
                f"INSERT INTO {SCHEMA}.fault_photos (fault_id, url, filename) VALUES (%s, %s, %s)",
                (fault_id, item['url'], item['filename'])
            )
        conn.close()

        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'urls': uploaded_urls})}

    # GET /photos/{fault_id} — получить фото по неисправности
    if method == 'GET':
        parts = path.rstrip('/').split('/')
        try:
            fault_id = int(parts[-1])
        except (ValueError, IndexError):
            return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Укажите fault_id'})}

        conn = get_db()
        cur = conn.cursor()
        cur.execute(
            f"SELECT id, url, filename, uploaded_at FROM {SCHEMA}.fault_photos WHERE fault_id = %s ORDER BY uploaded_at",
            (fault_id,)
        )
        photos = [{'id': r[0], 'url': r[1], 'filename': r[2], 'uploaded_at': str(r[3])} for r in cur.fetchall()]
        conn.close()

        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'photos': photos})}

    return {'statusCode': 404, 'headers': CORS, 'body': json.dumps({'error': 'Not found'})}
