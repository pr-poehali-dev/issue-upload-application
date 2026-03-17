"""Авторизация пользователей: вход и получение текущего пользователя по токену."""
import json
import os
import hashlib
import secrets
import psycopg2

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 't_p22151428_issue_upload_applica')
CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
}

# Простое хранилище сессий в памяти (достаточно для MVP)
# В продакшене заменить на Redis/DB
_sessions: dict = {}


def get_db():
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    conn.autocommit = True
    return conn


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    path = event.get('path', '/')
    method = event.get('httpMethod', 'GET')

    # POST /login
    if method == 'POST' and path.endswith('/login'):
        body = json.loads(event.get('body') or '{}')
        login = body.get('login', '').strip()
        password = body.get('password', '')

        if not login or not password:
            return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Введите логин и пароль'})}

        pw_hash = hash_password(password)
        conn = get_db()
        cur = conn.cursor()
        cur.execute(
            f"SELECT id, name, login, role FROM {SCHEMA}.users WHERE login = %s AND password_hash = %s",
            (login, pw_hash)
        )
        row = cur.fetchone()
        conn.close()

        if not row:
            return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'Неверный логин или пароль'})}

        token = secrets.token_hex(32)
        _sessions[token] = {'id': row[0], 'name': row[1], 'login': row[2], 'role': row[3]}

        return {
            'statusCode': 200,
            'headers': CORS,
            'body': json.dumps({'token': token, 'user': _sessions[token]})
        }

    # GET /me — получить текущего пользователя
    if method == 'GET' and path.endswith('/me'):
        token = event.get('headers', {}).get('X-Auth-Token', '')
        user = _sessions.get(token)
        if not user:
            return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'Не авторизован'})}
        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'user': user})}

    # POST /logout
    if method == 'POST' and path.endswith('/logout'):
        token = event.get('headers', {}).get('X-Auth-Token', '')
        _sessions.pop(token, None)
        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True})}

    return {'statusCode': 404, 'headers': CORS, 'body': json.dumps({'error': 'Not found'})}
