import * as SQLite from 'expo-sqlite';

import type { DownloadRecord, DownloadType } from '@/types';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

const getDb = async (): Promise<SQLite.SQLiteDatabase> => {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync('everest-downloads.db');
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS downloads (
          video_id TEXT PRIMARY KEY NOT NULL,
          local_path TEXT NOT NULL,
          type TEXT NOT NULL,
          size_bytes INTEGER NOT NULL DEFAULT 0,
          downloaded_at TEXT NOT NULL
        );
      `);
      return db;
    })();
  }
  return dbPromise;
};

const rowToRecord = (r: {
  video_id: string;
  local_path: string;
  type: string;
  size_bytes: number;
  downloaded_at: string;
}): DownloadRecord => ({
  videoId: r.video_id,
  localPath: r.local_path,
  type: r.type as DownloadType,
  sizeBytes: r.size_bytes,
  downloadedAt: r.downloaded_at,
});

export const downloadsRegistry = {
  async list(): Promise<DownloadRecord[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<{
      video_id: string;
      local_path: string;
      type: string;
      size_bytes: number;
      downloaded_at: string;
    }>('SELECT * FROM downloads ORDER BY downloaded_at DESC');
    return rows.map(rowToRecord);
  },

  async get(videoId: string): Promise<DownloadRecord | null> {
    const db = await getDb();
    const row = await db.getFirstAsync<{
      video_id: string;
      local_path: string;
      type: string;
      size_bytes: number;
      downloaded_at: string;
    }>('SELECT * FROM downloads WHERE video_id = ?', [videoId]);
    return row ? rowToRecord(row) : null;
  },

  async upsert(record: DownloadRecord): Promise<void> {
    const db = await getDb();
    await db.runAsync(
      `INSERT INTO downloads (video_id, local_path, type, size_bytes, downloaded_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(video_id) DO UPDATE SET
         local_path = excluded.local_path,
         type = excluded.type,
         size_bytes = excluded.size_bytes,
         downloaded_at = excluded.downloaded_at`,
      [record.videoId, record.localPath, record.type, record.sizeBytes, record.downloadedAt],
    );
  },

  async remove(videoId: string): Promise<void> {
    const db = await getDb();
    await db.runAsync('DELETE FROM downloads WHERE video_id = ?', [videoId]);
  },
};
