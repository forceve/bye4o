CREATE TABLE IF NOT EXISTS embers (
  id TEXT PRIMARY KEY,
  anon_user_id TEXT NOT NULL,
  display_name TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- Ensure this migration is safe on fresh installs where `traces` never existed.
CREATE TABLE IF NOT EXISTS traces (
  id TEXT PRIMARY KEY,
  anon_user_id TEXT NOT NULL,
  display_name TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TEXT NOT NULL
);

INSERT OR IGNORE INTO embers (id, anon_user_id, display_name, message, created_at)
SELECT id, anon_user_id, display_name, message, created_at
FROM traces;

DROP TABLE IF EXISTS traces;
DROP INDEX IF EXISTS idx_traces_created_at_id;

CREATE INDEX IF NOT EXISTS idx_embers_created_at_id
  ON embers (created_at DESC, id DESC);
