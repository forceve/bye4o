CREATE TABLE IF NOT EXISTS embers (
  id TEXT PRIMARY KEY,
  anon_user_id TEXT NOT NULL,
  display_name TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_embers_created_at_id
  ON embers (created_at DESC, id DESC);
