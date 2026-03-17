"""CRUD для неисправностей ВЭУ: создание, список, детали, обновление статуса, статистика, экспорт CSV."""
import json
import os
import csv
import io
import base64
import psycopg2
from psycopg2.extras import RealDictCursor

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 't_p22151428_issue_upload_applica')
CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
}


def get_db():
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    conn.autocommit = True
    return conn


def get_user_from_token(event):
    """Получить пользователя из токена через заголовок."""
    token = event.get('headers', {}).get('X-Auth-Token', '')
    if not token:
        return None
    conn = get_db()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    # Простая проверка существования пользователя через joined sessions не работает без Redis.
    # Используем упрощённый подход: декодируем user_id из токена запроса.
    # Токен передаётся фронтендом, бэкенд auth хранит сессии в памяти той же функции.
    # Поскольку функции независимы — передаём user_id через кастомный заголовок X-User-Id.
    user_id = event.get('headers', {}).get('X-User-Id', '')
    if not user_id:
        conn.close()
        return None
    cur.execute(f"SELECT id, name, login, role FROM {SCHEMA}.users WHERE id = %s", (user_id,))
    user = cur.fetchone()
    conn.close()
    return user


def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    path = event.get('path', '/')
    method = event.get('httpMethod', 'GET')
    params = event.get('queryStringParameters') or {}

    user_id = event.get('headers', {}).get('X-User-Id', '')

    # GET /stats — статистика
    if method == 'GET' and path.endswith('/stats'):
        conn = get_db()
        cur = conn.cursor(cursor_factory=RealDictCursor)

        cur.execute(f"""
            SELECT
                COUNT(*) AS total,
                COUNT(*) FILTER (WHERE severity = 'critical') AS critical,
                COUNT(*) FILTER (WHERE severity = 'warning') AS warning,
                COUNT(*) FILTER (WHERE severity = 'info') AS info,
                COUNT(*) FILTER (WHERE status = 'open') AS open,
                COUNT(*) FILTER (WHERE status = 'in_progress') AS in_progress,
                COUNT(*) FILTER (WHERE status = 'resolved') AS resolved
            FROM {SCHEMA}.faults
        """)
        totals = dict(cur.fetchone())

        cur.execute(f"""
            SELECT turbine_id,
                   COUNT(*) AS total,
                   COUNT(*) FILTER (WHERE severity = 'critical') AS critical,
                   COUNT(*) FILTER (WHERE status = 'resolved') AS resolved
            FROM {SCHEMA}.faults
            GROUP BY turbine_id
            ORDER BY total DESC
        """)
        by_turbine = [dict(r) for r in cur.fetchall()]

        cur.execute(f"""
            SELECT DATE(created_at) AS day, COUNT(*) AS count
            FROM {SCHEMA}.faults
            GROUP BY day
            ORDER BY day DESC
            LIMIT 30
        """)
        by_day = [{'day': str(r['day']), 'count': r['count']} for r in cur.fetchall()]

        conn.close()
        return {
            'statusCode': 200,
            'headers': CORS,
            'body': json.dumps({'totals': totals, 'by_turbine': by_turbine, 'by_day': by_day})
        }

    # GET /export — CSV выгрузка
    if method == 'GET' and path.endswith('/export'):
        conn = get_db()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        turbine = params.get('turbine_id')
        where = f"WHERE f.turbine_id = {int(turbine)}" if turbine else ""
        cur.execute(f"""
            SELECT f.id, f.turbine_id, f.title, f.description, f.severity, f.status,
                   u.name AS author, f.created_at,
                   STRING_AGG(fp.url, ', ') AS photos
            FROM {SCHEMA}.faults f
            LEFT JOIN {SCHEMA}.users u ON u.id = f.created_by
            LEFT JOIN {SCHEMA}.fault_photos fp ON fp.fault_id = f.id
            {where}
            GROUP BY f.id, u.name
            ORDER BY f.created_at DESC
        """)
        rows = cur.fetchall()
        conn.close()

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(['ID', 'Турбина', 'Заголовок', 'Описание', 'Серьёзность', 'Статус', 'Автор', 'Дата', 'Фото'])
        for r in rows:
            sev_map = {'critical': 'Критическая', 'warning': 'Предупреждение', 'info': 'Информация'}
            st_map = {'open': 'Открыта', 'in_progress': 'В работе', 'resolved': 'Устранена'}
            writer.writerow([
                r['id'], f"ВЭУ-{str(r['turbine_id']).zfill(2)}",
                r['title'], r['description'] or '',
                sev_map.get(r['severity'], r['severity']),
                st_map.get(r['status'], r['status']),
                r['author'] or '',
                str(r['created_at'])[:16],
                r['photos'] or ''
            ])
        csv_bytes = output.getvalue().encode('utf-8-sig')
        return {
            'statusCode': 200,
            'headers': {**CORS, 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="faults.csv"'},
            'body': base64.b64encode(csv_bytes).decode(),
            'isBase64Encoded': True
        }

    # GET / — список неисправностей
    if method == 'GET':
        conn = get_db()
        cur = conn.cursor(cursor_factory=RealDictCursor)

        conditions = []
        if params.get('turbine_id'):
            conditions.append(f"f.turbine_id = {int(params['turbine_id'])}")
        if params.get('severity'):
            conditions.append(f"f.severity = '{params['severity']}'")
        if params.get('status'):
            conditions.append(f"f.status = '{params['status']}'")

        where = ('WHERE ' + ' AND '.join(conditions)) if conditions else ''
        limit = min(int(params.get('limit', 50)), 200)
        offset = int(params.get('offset', 0))

        cur.execute(f"""
            SELECT f.id, f.turbine_id, f.title, f.description, f.severity, f.status,
                   f.created_at, f.updated_at,
                   u.name AS author_name,
                   COUNT(fp.id) AS photo_count
            FROM {SCHEMA}.faults f
            LEFT JOIN {SCHEMA}.users u ON u.id = f.created_by
            LEFT JOIN {SCHEMA}.fault_photos fp ON fp.fault_id = f.id
            {where}
            GROUP BY f.id, u.name
            ORDER BY f.created_at DESC
            LIMIT {limit} OFFSET {offset}
        """)
        faults = []
        for r in cur.fetchall():
            d = dict(r)
            d['created_at'] = str(d['created_at'])
            d['updated_at'] = str(d['updated_at'])
            faults.append(d)

        cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.faults f {where}")
        total = cur.fetchone()['count']
        conn.close()

        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'faults': faults, 'total': total})}

    # POST / — создать неисправность
    if method == 'POST':
        if not user_id:
            return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'Не авторизован'})}

        body = json.loads(event.get('body') or '{}')
        turbine_id = int(body.get('turbine_id', 0))
        title = body.get('title', '').strip()
        description = body.get('description', '').strip()
        severity = body.get('severity', 'warning')

        if not turbine_id or not title:
            return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Укажите турбину и заголовок'})}
        if turbine_id < 1 or turbine_id > 57:
            return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Турбина должна быть от 1 до 57'})}
        if severity not in ('critical', 'warning', 'info'):
            severity = 'warning'

        conn = get_db()
        cur = conn.cursor()
        cur.execute(
            f"INSERT INTO {SCHEMA}.faults (turbine_id, title, description, severity, created_by) VALUES (%s, %s, %s, %s, %s) RETURNING id",
            (turbine_id, title, description, severity, user_id)
        )
        fault_id = cur.fetchone()[0]
        conn.close()

        return {'statusCode': 201, 'headers': CORS, 'body': json.dumps({'id': fault_id})}

    # PUT /{id}/status — обновить статус
    if method == 'PUT':
        parts = path.rstrip('/').split('/')
        if len(parts) >= 2:
            try:
                fault_id = int(parts[-2])
            except ValueError:
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Invalid id'})}
            body = json.loads(event.get('body') or '{}')
            new_status = body.get('status')
            if new_status not in ('open', 'in_progress', 'resolved'):
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Invalid status'})}
            conn = get_db()
            cur = conn.cursor()
            cur.execute(f"UPDATE {SCHEMA}.faults SET status = %s, updated_at = NOW() WHERE id = %s", (new_status, fault_id))
            conn.close()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True})}

    return {'statusCode': 404, 'headers': CORS, 'body': json.dumps({'error': 'Not found'})}
