-- D1 Migration v2
-- Schema kept in sync with functions/_utils.js (ensureTables) — the runtime
-- auto-creates/upgrades these tables on first request, so this file is the
-- canonical manual-migration reference only.

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
  category_en TEXT NOT NULL DEFAULT '',
  category_zh TEXT NOT NULL DEFAULT '',
  price       TEXT NOT NULL DEFAULT '',
  buy_url     TEXT NOT NULL DEFAULT '',
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

CREATE TABLE IF NOT EXISTS messages (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL DEFAULT '',
  email      TEXT NOT NULL DEFAULT '',
  phone      TEXT NOT NULL DEFAULT '',
  company    TEXT NOT NULL DEFAULT '',
  message    TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE TABLE IF NOT EXISTS rate_limits (
  bucket TEXT NOT NULL,
  ip     TEXT NOT NULL,
  ts     INTEGER NOT NULL
);
