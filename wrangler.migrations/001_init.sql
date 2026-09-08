-- D1 Migration v1
-- Run with: wrangler d1 execute nova-site-db --remote --file=migrations/001_init.sql

CREATE TABLE IF NOT EXISTS products (
  id          TEXT PRIMARY KEY,
  slug        TEXT UNIQUE NOT NULL,
  tag_en      TEXT NOT NULL DEFAULT '',
  tag_zh      TEXT NOT NULL DEFAULT '',
  name_en     TEXT NOT NULL DEFAULT '',
  name_zh     TEXT NOT NULL DEFAULT '',
  short_en    TEXT NOT NULL DEFAULT '',
  short_zh    TEXT NOT NULL DEFAULT '',
  description_en TEXT NOT NULL DEFAULT '',
  description_zh TEXT NOT NULL DEFAULT '',
  highlights_en TEXT NOT NULL DEFAULT '[]',
  highlights_zh TEXT NOT NULL DEFAULT '[]',
  image_url   TEXT NOT NULL DEFAULT '',
  position    INTEGER NOT NULL DEFAULT 0,
  active      INTEGER NOT NULL DEFAULT 1,
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  updated_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE TABLE IF NOT EXISTS admin_users (
  id         TEXT PRIMARY KEY,
  username   TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
