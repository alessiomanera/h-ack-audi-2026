-- Audi with you: initial schema.
-- Dates are ISO 8601 strings in UTC (sortable as text); sessions.expires_at is epoch milliseconds.
-- The "max 5 secondary users per vehicle" rule is enforced in the Worker.

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  -- "pbkdf2$<iterations>$<saltB64>$<hashB64>", NULL for simulated family members that cannot log in.
  pin_hash TEXT,
  birth_year INTEGER,
  persona_id TEXT UNIQUE,
  created_at TEXT NOT NULL
);

CREATE TABLE sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  expires_at INTEGER NOT NULL
);
CREATE INDEX idx_sessions_user ON sessions(user_id);

CREATE TABLE vehicles (
  id TEXT PRIMARY KEY,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE memberships (
  user_id TEXT NOT NULL REFERENCES users(id),
  vehicle_id TEXT NOT NULL REFERENCES vehicles(id),
  role TEXT NOT NULL CHECK (role IN ('key', 'secondary')),
  created_at TEXT NOT NULL,
  PRIMARY KEY (user_id, vehicle_id)
);
CREATE INDEX idx_memberships_vehicle ON memberships(vehicle_id);

CREATE TABLE invites (
  code TEXT PRIMARY KEY,
  vehicle_id TEXT NOT NULL REFERENCES vehicles(id),
  inviter_id TEXT NOT NULL REFERENCES users(id),
  email TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'revoked')),
  invitee_id TEXT REFERENCES users(id),
  created_at TEXT NOT NULL
);
CREATE INDEX idx_invites_vehicle ON invites(vehicle_id, status);

CREATE TABLE ledger (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  action TEXT NOT NULL CHECK (action IN ('join', 'invite', 'service', 'session', 'event', 'charging')),
  points INTEGER NOT NULL,
  -- JSON object with string, number or boolean values.
  meta TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL
);
CREATE INDEX idx_ledger_user_created ON ledger(user_id, created_at);
-- Welcome points at most once per user.
CREATE UNIQUE INDEX idx_ledger_join_once ON ledger(user_id) WHERE action = 'join';
