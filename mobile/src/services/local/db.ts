import * as SQLite from 'expo-sqlite';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS videos (
  videoId TEXT PRIMARY KEY NOT NULL,
  userId TEXT NOT NULL,
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  thumbnail TEXT NOT NULL DEFAULT '',
  platform TEXT NOT NULL,
  streamUrl TEXT,
  embedUrl TEXT,
  durationSec INTEGER,
  createdAt TEXT NOT NULL,
  folderId TEXT
);
CREATE INDEX IF NOT EXISTS videos_user_created_idx ON videos (userId, createdAt DESC);
CREATE INDEX IF NOT EXISTS videos_folder_idx ON videos (folderId, createdAt DESC);

CREATE TABLE IF NOT EXISTS playlists (
  playlistId TEXT PRIMARY KEY NOT NULL,
  userId TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  cover TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS playlists_user_idx ON playlists (userId, createdAt DESC);

CREATE TABLE IF NOT EXISTS playlist_items (
  itemId TEXT PRIMARY KEY NOT NULL,
  playlistId TEXT NOT NULL,
  videoId TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  addedAt TEXT NOT NULL,
  UNIQUE (playlistId, videoId)
);
CREATE INDEX IF NOT EXISTS playlist_items_idx ON playlist_items (playlistId, position);

CREATE TABLE IF NOT EXISTS watch_progress (
  userId TEXT NOT NULL,
  videoId TEXT NOT NULL,
  progress REAL NOT NULL DEFAULT 0,
  duration REAL,
  updatedAt TEXT NOT NULL,
  PRIMARY KEY (userId, videoId)
);
CREATE INDEX IF NOT EXISTS watch_progress_idx ON watch_progress (userId, updatedAt DESC);
`;

const migrate = async (db: SQLite.SQLiteDatabase): Promise<void> => {
  // SQLite lacks ADD COLUMN IF NOT EXISTS. Probe pragma_table_info first.
  const cols = await db.getAllAsync<{ name: string }>("PRAGMA table_info(videos)");
  if (!cols.some((c) => c.name === 'folderId')) {
    await db.execAsync('ALTER TABLE videos ADD COLUMN folderId TEXT');
    await db.execAsync('CREATE INDEX IF NOT EXISTS videos_folder_idx ON videos (folderId, createdAt DESC)');
  }
};

export const getDb = async (): Promise<SQLite.SQLiteDatabase> => {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync('everest.db');
      await db.execAsync('PRAGMA foreign_keys = ON;');
      await db.execAsync(SCHEMA);
      await migrate(db);
      return db;
    })();
  }
  return dbPromise;
};

// Small UUID v4 generator. Not cryptographically strong — fine for record ids on device.
export const uuid = (): string =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
