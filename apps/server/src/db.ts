import Database from 'better-sqlite3';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import fs from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

const dbDir = join(__dirname, '../../data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new Database(join(dbDir, 'server.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS videos (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    duration_s REAL NOT NULL,
    created_at TEXT NOT NULL,
    path TEXT,
    thumbnail_path TEXT,
    transcript_path TEXT,
    ai_summary TEXT,
    share_url TEXT,
    share_mode TEXT
  );

  CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY,
    video_id TEXT NOT NULL,
    timestamp REAL NOT NULL,
    text TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS reactions (
    id TEXT PRIMARY KEY,
    video_id TEXT NOT NULL,
    timestamp REAL NOT NULL,
    emoji TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS video_passwords (
    video_id TEXT PRIMARY KEY,
    password_hash TEXT NOT NULL,
    FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS video_expiry (
    video_id TEXT PRIMARY KEY,
    expires_at TEXT NOT NULL,
    FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS analytics_events (
    id TEXT PRIMARY KEY,
    video_id TEXT NOT NULL,
    type TEXT NOT NULL,
    data TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS branding (
    id TEXT PRIMARY KEY,
    logo_url TEXT,
    primary_color TEXT,
    custom_css TEXT
  );
`);
