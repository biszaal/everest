import { getDb } from '@/services/local/db';
import { getCurrentUserId } from '@/services/local/auth';
import type { WatchProgress } from '@/types';

interface ProgressRow {
  userId: string;
  videoId: string;
  progress: number;
  duration: number | null;
  updatedAt: string;
}

const rowToProgress = (r: ProgressRow): WatchProgress => ({
  userId: r.userId,
  videoId: r.videoId,
  progress: r.progress,
  duration: r.duration ?? undefined,
  updatedAt: r.updatedAt,
});

export const progressService = {
  async upsert(videoId: string, progress: number, duration?: number): Promise<void> {
    const userId = await getCurrentUserId();
    const db = await getDb();
    await db.runAsync(
      `INSERT INTO watch_progress (userId, videoId, progress, duration, updatedAt)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(userId, videoId) DO UPDATE SET
         progress = excluded.progress,
         duration = excluded.duration,
         updatedAt = excluded.updatedAt`,
      [userId, videoId, progress, duration ?? null, new Date().toISOString()],
    );
  },

  async list(limit = 20): Promise<WatchProgress[]> {
    const userId = await getCurrentUserId();
    const db = await getDb();
    const rows = await db.getAllAsync<ProgressRow>(
      `SELECT * FROM watch_progress
       WHERE userId = ?
       ORDER BY updatedAt DESC
       LIMIT ?`,
      [userId, limit],
    );
    return rows.map(rowToProgress);
  },
};
