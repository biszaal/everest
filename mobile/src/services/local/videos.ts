import { getDb, uuid } from '@/services/local/db';
import { getCurrentUserId } from '@/services/local/auth';
import { resolveMetadata } from '@/services/metadata';
import type { Video, VideoPlatform } from '@/types';

interface VideoRow {
  videoId: string;
  userId: string;
  url: string;
  title: string;
  thumbnail: string;
  platform: string;
  streamUrl: string | null;
  embedUrl: string | null;
  durationSec: number | null;
  createdAt: string;
  folderId: string | null;
}

const rowToVideo = (r: VideoRow): Video => ({
  videoId: r.videoId,
  userId: r.userId,
  url: r.url,
  title: r.title,
  thumbnail: r.thumbnail ?? '',
  platform: r.platform as VideoPlatform,
  streamUrl: r.streamUrl,
  embedUrl: r.embedUrl,
  durationSec: r.durationSec ?? undefined,
  createdAt: r.createdAt,
  folderId: r.folderId,
});

/** folderId semantics:
 *   undefined → all videos (every folder + loose)
 *   null      → only loose videos (not in any folder)
 *   string    → only that folder's videos
 */
export const videosService = {
  async list(folderId?: string | null): Promise<Video[]> {
    const userId = await getCurrentUserId();
    const db = await getDb();
    let rows: VideoRow[];
    if (folderId === undefined) {
      rows = await db.getAllAsync<VideoRow>(
        'SELECT * FROM videos WHERE userId = ? ORDER BY createdAt DESC',
        [userId],
      );
    } else if (folderId === null) {
      rows = await db.getAllAsync<VideoRow>(
        'SELECT * FROM videos WHERE userId = ? AND folderId IS NULL ORDER BY createdAt DESC',
        [userId],
      );
    } else {
      rows = await db.getAllAsync<VideoRow>(
        'SELECT * FROM videos WHERE userId = ? AND folderId = ? ORDER BY createdAt DESC',
        [userId, folderId],
      );
    }
    return rows.map(rowToVideo);
  },

  async get(videoId: string): Promise<Video> {
    const db = await getDb();
    const row = await db.getFirstAsync<VideoRow>('SELECT * FROM videos WHERE videoId = ?', [videoId]);
    if (!row) throw new Error('Video not found');
    return rowToVideo(row);
  },

  async add(url: string, folderId?: string | null): Promise<Video> {
    const userId = await getCurrentUserId();
    const meta = await resolveMetadata(url);
    const video: Video = {
      videoId: uuid(),
      userId,
      url,
      title: meta.title,
      thumbnail: meta.thumbnail,
      platform: meta.platform,
      streamUrl: meta.streamUrl,
      embedUrl: meta.embedUrl,
      createdAt: new Date().toISOString(),
      folderId: folderId ?? null,
    };
    const db = await getDb();
    await db.runAsync(
      `INSERT INTO videos (videoId, userId, url, title, thumbnail, platform, streamUrl, embedUrl, durationSec, createdAt, folderId)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        video.videoId,
        video.userId,
        video.url,
        video.title,
        video.thumbnail,
        video.platform,
        video.streamUrl,
        video.embedUrl,
        video.durationSec ?? null,
        video.createdAt,
        video.folderId ?? null,
      ],
    );
    return video;
  },

  async remove(videoId: string): Promise<void> {
    const db = await getDb();
    await db.runAsync('DELETE FROM playlist_items WHERE videoId = ?', [videoId]);
    await db.runAsync('DELETE FROM watch_progress WHERE videoId = ?', [videoId]);
    await db.runAsync('DELETE FROM videos WHERE videoId = ?', [videoId]);
  },

  async moveToFolder(videoId: string, folderId: string | null): Promise<void> {
    const db = await getDb();
    await db.runAsync('UPDATE videos SET folderId = ? WHERE videoId = ?', [folderId, videoId]);
  },
};
