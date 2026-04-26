import * as SQLite from 'expo-sqlite';

const DB_NAME = 'everest.db';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

const SCHEMA = `
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS videos (
    video_id     TEXT PRIMARY KEY NOT NULL,
    url          TEXT NOT NULL,
    title        TEXT NOT NULL,
    thumbnail    TEXT,
    platform     TEXT NOT NULL,
    stream_url   TEXT,
    embed_url    TEXT,
    duration_sec INTEGER,
    created_at   TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS videos_created_at_idx ON videos (created_at DESC);

  CREATE TABLE IF NOT EXISTS playlists (
    playlist_id TEXT PRIMARY KEY NOT NULL,
    name        TEXT NOT NULL,
    description TEXT,
    cover       TEXT,
    created_at  TEXT NOT NULL,
    updated_at  TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS playlists_created_at_idx ON playlists (created_at DESC);

  CREATE TABLE IF NOT EXISTS playlist_items (
    item_id     TEXT PRIMARY KEY NOT NULL,
    playlist_id TEXT NOT NULL,
    video_id    TEXT NOT NULL,
    position    INTEGER NOT NULL,
    added_at    TEXT NOT NULL,
    FOREIGN KEY (playlist_id) REFERENCES playlists(playlist_id) ON DELETE CASCADE,
    FOREIGN KEY (video_id)    REFERENCES videos(video_id) ON DELETE CASCADE,
    UNIQUE (playlist_id, video_id)
  );
  CREATE INDEX IF NOT EXISTS playlist_items_order_idx ON playlist_items (playlist_id, position);

  CREATE TABLE IF NOT EXISTS watch_progress (
    video_id     TEXT PRIMARY KEY NOT NULL,
    progress_sec REAL NOT NULL,
    duration_sec REAL,
    updated_at   TEXT NOT NULL,
    FOREIGN KEY (video_id) REFERENCES videos(video_id) ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS watch_progress_updated_idx ON watch_progress (updated_at DESC);

  CREATE TABLE IF NOT EXISTS downloads (
    video_id      TEXT PRIMARY KEY NOT NULL,
    local_path    TEXT NOT NULL,
    type          TEXT NOT NULL,
    size_bytes    INTEGER NOT NULL DEFAULT 0,
    downloaded_at TEXT NOT NULL,
    FOREIGN KEY (video_id) REFERENCES videos(video_id) ON DELETE CASCADE
  );
`;

export const getDb = (): Promise<SQLite.SQLiteDatabase> => {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync(DB_NAME);
      await db.execAsync(SCHEMA);
      return db;
    })();
  }
  return dbPromise;
};

export const uuid = (): string => {
  // RFC4122 v4 via Math.random — sufficient for local identifiers.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};
