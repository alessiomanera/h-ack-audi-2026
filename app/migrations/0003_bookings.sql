-- Audi with you: two more ledger actions (first_audi, anniversary) and reward bookings.
-- Points are never spent: a booking only reserves a pickup or a seat.
-- SQLite cannot alter a CHECK constraint, so the ledger table is rebuilt with the same columns,
-- constraints and indexes (same approach as 0002). No table references ledger.
-- D1 wraps each migration in a transaction: no BEGIN/COMMIT here.

CREATE TABLE ledger_new (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  action TEXT NOT NULL CHECK (
    action IN (
      'join', 'invite', 'service', 'accessory', 'merch', 'trade_in',
      'session', 'event', 'charging', 'first_audi', 'anniversary'
    )
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

-- One booking per reward per user. Limited seats are counted per (reward_id, first_choice) in the Worker,
-- with a conditional insert so two concurrent bookings cannot oversell the last seat.
CREATE TABLE bookings (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  reward_id TEXT NOT NULL,
  -- Level that unlocks the reward, from program.it.json at booking time.
  level_id TEXT NOT NULL,
  -- JSON object: option id -> chosen value.
  choices TEXT NOT NULL DEFAULT '{}',
  -- Value of the reward's first option, the one limited seats are counted on.
  first_choice TEXT NOT NULL DEFAULT '',
  -- Shown to the user and to the dealer, e.g. "AWY-7K2Q".
  code TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  UNIQUE (user_id, reward_id)
);
CREATE INDEX idx_bookings_reward_choice ON bookings(reward_id, first_choice);
