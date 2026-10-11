-- Audi with you: three more ledger actions (accessory, merch, trade_in).
-- SQLite cannot alter a CHECK constraint, so the ledger table is rebuilt with the same columns,
-- constraints and indexes. No table references ledger. D1 wraps each migration in a transaction.

CREATE TABLE ledger_new (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  action TEXT NOT NULL CHECK (
    action IN ('join', 'invite', 'service', 'accessory', 'merch', 'trade_in', 'session', 'event', 'charging')
  ),
  points INTEGER NOT NULL,
  -- JSON object with string, number or boolean values.
  meta TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL
);

-- Keep rowid order so "ORDER BY created_at DESC, rowid DESC" stays stable for existing rows.
INSERT INTO ledger_new (rowid, id, user_id, action, points, meta, created_at)
  SELECT rowid, id, user_id, action, points, meta, created_at FROM ledger;

DROP TABLE ledger;
ALTER TABLE ledger_new RENAME TO ledger;

CREATE INDEX idx_ledger_user_created ON ledger(user_id, created_at);
-- Welcome points at most once per user.
CREATE UNIQUE INDEX idx_ledger_join_once ON ledger(user_id) WHERE action = 'join';
