CREATE TABLE IF NOT EXISTS unburnt_entries (
  id TEXT PRIMARY KEY,
  anon_user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  raw_text TEXT NOT NULL,
  messages_json TEXT NOT NULL,
  visibility TEXT NOT NULL DEFAULT 'private',
  tags_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_unburnt_entries_user_created_id
  ON unburnt_entries (anon_user_id, created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_unburnt_entries_visibility_created_id
  ON unburnt_entries (visibility, created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_unburnt_entries_deleted_at
  ON unburnt_entries (deleted_at);

CREATE TABLE IF NOT EXISTS unburnt_drafts (
  anon_user_id TEXT PRIMARY KEY,
  payload_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
