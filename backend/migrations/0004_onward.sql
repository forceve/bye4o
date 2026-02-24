CREATE TABLE IF NOT EXISTS onward_entries (
  id TEXT PRIMARY KEY,
  anon_user_id TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_onward_entries_active_created_id
  ON onward_entries (anon_user_id, created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_onward_entries_deleted_id
  ON onward_entries (anon_user_id, deleted_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_onward_entries_deleted_at
  ON onward_entries (deleted_at);
