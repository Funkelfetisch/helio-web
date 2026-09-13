CREATE TABLE IF NOT EXISTS enquiries (
  id TEXT PRIMARY KEY,
  reference TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL,
  intent TEXT NOT NULL CHECK (intent IN ('sphere', 'event', 'support')),
  location TEXT NOT NULL,
  target_date TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL,
  preferred_size TEXT NOT NULL DEFAULT '',
  quantity TEXT NOT NULL DEFAULT '',
  budget TEXT NOT NULL DEFAULT '',
  mounting TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'reviewed', 'qualified', 'closed'))
);
CREATE INDEX IF NOT EXISTS enquiries_created_at_idx ON enquiries(created_at);
CREATE INDEX IF NOT EXISTS enquiries_status_idx ON enquiries(status, created_at);
CREATE TABLE IF NOT EXISTS rate_limits (
  fingerprint TEXT NOT NULL,
  window_start TEXT NOT NULL,
  request_count INTEGER NOT NULL,
  PRIMARY KEY (fingerprint, window_start)
);
