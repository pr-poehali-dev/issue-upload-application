CREATE TABLE IF NOT EXISTS t_p22151428_issue_upload_applica.users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  login TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'worker',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS t_p22151428_issue_upload_applica.faults (
  id SERIAL PRIMARY KEY,
  turbine_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  severity TEXT NOT NULL DEFAULT 'warning',
  status TEXT NOT NULL DEFAULT 'open',
  created_by INTEGER REFERENCES t_p22151428_issue_upload_applica.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS t_p22151428_issue_upload_applica.fault_photos (
  id SERIAL PRIMARY KEY,
  fault_id INTEGER NOT NULL REFERENCES t_p22151428_issue_upload_applica.faults(id),
  url TEXT NOT NULL,
  filename TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO t_p22151428_issue_upload_applica.users (name, login, password_hash, role)
SELECT 'Администратор', 'admin', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'admin'
WHERE NOT EXISTS (SELECT 1 FROM t_p22151428_issue_upload_applica.users WHERE login = 'admin');

INSERT INTO t_p22151428_issue_upload_applica.users (name, login, password_hash, role)
SELECT 'Иванов Иван', 'ivanov', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'worker'
WHERE NOT EXISTS (SELECT 1 FROM t_p22151428_issue_upload_applica.users WHERE login = 'ivanov');

INSERT INTO t_p22151428_issue_upload_applica.users (name, login, password_hash, role)
SELECT 'Петров Пётр', 'petrov', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'worker'
WHERE NOT EXISTS (SELECT 1 FROM t_p22151428_issue_upload_applica.users WHERE login = 'petrov')
