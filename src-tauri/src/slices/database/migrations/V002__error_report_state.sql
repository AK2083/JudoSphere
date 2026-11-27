-- Structured offline error/report state for crash & feedback prep (Feature #78).
-- No cloud sync: SQLite is the local source of truth for these rows.

CREATE TABLE IF NOT EXISTS error_events (
  id TEXT PRIMARY KEY NOT NULL,
  fingerprint TEXT NOT NULL,
  source TEXT NOT NULL,
  message TEXT NOT NULL,
  context_json TEXT,
  occurred_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_error_events_fingerprint
  ON error_events (fingerprint);

CREATE INDEX IF NOT EXISTS idx_error_events_occurred_at
  ON error_events (occurred_at);

CREATE TABLE IF NOT EXISTS error_fingerprint_gates (
  fingerprint TEXT PRIMARY KEY NOT NULL,
  occurrence_count INTEGER NOT NULL DEFAULT 0 CHECK (occurrence_count >= 0),
  first_seen_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_seen_at TEXT NOT NULL DEFAULT (datetime('now')),
  cooldown_until TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS known_fingerprints (
  fingerprint TEXT PRIMARY KEY NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('new', 'known', 'in_progress')),
  remote_ref TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS feedback_drafts (
  id TEXT PRIMARY KEY NOT NULL,
  fingerprint TEXT,
  notes TEXT NOT NULL DEFAULT '',
  log_excerpt_json TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'ready', 'discarded')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_feedback_drafts_status
  ON feedback_drafts (status);
