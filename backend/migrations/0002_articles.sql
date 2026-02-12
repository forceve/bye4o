CREATE TABLE IF NOT EXISTS articles (
  id TEXT NOT NULL,
  locale TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  published_at TEXT NOT NULL,
  updated_at TEXT,
  read_minutes INTEGER NOT NULL DEFAULT 1,
  category TEXT NOT NULL DEFAULT 'Archive',
  tags_json TEXT NOT NULL DEFAULT '[]',
  author_name TEXT NOT NULL DEFAULT 'Unknown',
  author_role TEXT NOT NULL DEFAULT '',
  author_profile_url TEXT,
  links_json TEXT NOT NULL DEFAULT '[]',
  sections_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (id, locale)
);

CREATE INDEX IF NOT EXISTS idx_articles_locale_published_id
  ON articles (locale, published_at DESC, id ASC);
