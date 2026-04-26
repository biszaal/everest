import { getDb, uuid } from '@/services/local/db';
import { getCurrentUserId } from '@/services/local/auth';
import type {
  Playlist,
  PlaylistDetail,
  PlaylistItem,
  Video,
  VideoPlatform,
} from '@/types';

interface PlaylistRow {
  playlistId: string;
  userId: string;
  name: string;
  description: string | null;
  cover: string | null;
  createdAt: string;
  updatedAt: string;
}

interface JoinedItemRow {
  pi_itemId: string;
  pi_playlistId: string;
  pi_videoId: string;
  pi_position: number;
  pi_addedAt: string;
  v_videoId: string | null;
  v_userId: string | null;
  v_url: string | null;
  v_title: string | null;
  v_thumbnail: string | null;
  v_platform: string | null;
  v_streamUrl: string | null;
  v_embedUrl: string | null;
  v_durationSec: number | null;
  v_createdAt: string | null;
}

const rowToPlaylist = (r: PlaylistRow): Playlist => ({
  playlistId: r.playlistId,
  userId: r.userId,
  name: r.name,
  description: r.description ?? undefined,
  cover: r.cover ?? undefined,
  createdAt: r.createdAt,
  updatedAt: r.updatedAt,
});

const joinedToItem = (r: JoinedItemRow): PlaylistItem => {
  const video: Video | null = r.v_videoId
    ? {
        videoId: r.v_videoId,
        userId: r.v_userId ?? '',
        url: r.v_url ?? '',
        title: r.v_title ?? '',
        thumbnail: r.v_thumbnail ?? '',
        platform: (r.v_platform ?? 'unknown') as VideoPlatform,
        streamUrl: r.v_streamUrl,
        embedUrl: r.v_embedUrl,
        durationSec: r.v_durationSec ?? undefined,
        createdAt: r.v_createdAt ?? '',
      }
    : null;
  return {
    itemId: r.pi_itemId,
    playlistId: r.pi_playlistId,
    videoId: r.pi_videoId,
    order: r.pi_position,
    addedAt: r.pi_addedAt,
    video,
  };
};

const JOIN_SELECT = `
  SELECT
    pi.itemId     AS pi_itemId,
    pi.playlistId AS pi_playlistId,
    pi.videoId    AS pi_videoId,
    pi.position   AS pi_position,
    pi.addedAt    AS pi_addedAt,
    v.videoId     AS v_videoId,
    v.userId      AS v_userId,
    v.url         AS v_url,
    v.title       AS v_title,
    v.thumbnail   AS v_thumbnail,
    v.platform    AS v_platform,
    v.streamUrl   AS v_streamUrl,
    v.embedUrl    AS v_embedUrl,
    v.durationSec AS v_durationSec,
    v.createdAt   AS v_createdAt
  FROM playlist_items pi
  LEFT JOIN videos v ON v.videoId = pi.videoId
`;

export const playlistsService = {
  async list(): Promise<Playlist[]> {
    const userId = await getCurrentUserId();
    const db = await getDb();
    const rows = await db.getAllAsync<PlaylistRow>(
      'SELECT * FROM playlists WHERE userId = ? ORDER BY createdAt DESC',
      [userId],
    );
    return rows.map(rowToPlaylist);
  },

  async get(playlistId: string): Promise<PlaylistDetail> {
    const db = await getDb();
    const playlistRow = await db.getFirstAsync<PlaylistRow>(
      'SELECT * FROM playlists WHERE playlistId = ?',
      [playlistId],
    );
    if (!playlistRow) throw new Error('Playlist not found');
    const itemRows = await db.getAllAsync<JoinedItemRow>(
      `${JOIN_SELECT} WHERE pi.playlistId = ? ORDER BY pi.position ASC`,
      [playlistId],
    );
    return {
      playlist: rowToPlaylist(playlistRow),
      items: itemRows.map(joinedToItem),
    };
  },

  async create(name: string, description?: string): Promise<Playlist> {
    const userId = await getCurrentUserId();
    const now = new Date().toISOString();
    const playlist: Playlist = {
      playlistId: uuid(),
      userId,
      name,
      description,
      createdAt: now,
      updatedAt: now,
    };
    const db = await getDb();
    await db.runAsync(
      `INSERT INTO playlists (playlistId, userId, name, description, cover, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        playlist.playlistId,
        playlist.userId,
        playlist.name,
        playlist.description ?? null,
        null,
        playlist.createdAt,
        playlist.updatedAt,
      ],
    );
    return playlist;
  },

  async remove(playlistId: string, moveVideosToRoot = true): Promise<void> {
    const db = await getDb();
    await db.runAsync('DELETE FROM playlist_items WHERE playlistId = ?', [playlistId]);
    if (moveVideosToRoot) {
      await db.runAsync('UPDATE videos SET folderId = NULL WHERE folderId = ?', [playlistId]);
    } else {
      await db.runAsync('DELETE FROM videos WHERE folderId = ?', [playlistId]);
    }
    await db.runAsync('DELETE FROM playlists WHERE playlistId = ?', [playlistId]);
  },

  async rename(playlistId: string, name: string): Promise<void> {
    const db = await getDb();
    await db.runAsync(
      'UPDATE playlists SET name = ?, updatedAt = ? WHERE playlistId = ?',
      [name, new Date().toISOString(), playlistId],
    );
  },

  async counts(): Promise<Record<string, number>> {
    const db = await getDb();
    const rows = await db.getAllAsync<{ folderId: string | null; count: number }>(
      'SELECT folderId, COUNT(*) AS count FROM videos WHERE folderId IS NOT NULL GROUP BY folderId',
    );
    const out: Record<string, number> = {};
    for (const r of rows) if (r.folderId) out[r.folderId] = r.count;
    return out;
  },

  async addItem(playlistId: string, videoId: string): Promise<PlaylistItem> {
    const db = await getDb();
    const row = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM playlist_items WHERE playlistId = ?',
      [playlistId],
    );
    const nextOrder = row?.count ?? 0;
    const itemId = uuid();
    const addedAt = new Date().toISOString();
    await db.runAsync(
      `INSERT INTO playlist_items (itemId, playlistId, videoId, position, addedAt)
       VALUES (?, ?, ?, ?, ?)`,
      [itemId, playlistId, videoId, nextOrder, addedAt],
    );
    const joined = await db.getFirstAsync<JoinedItemRow>(
      `${JOIN_SELECT} WHERE pi.itemId = ?`,
      [itemId],
    );
    if (!joined) throw new Error('Failed to insert playlist item');
    return joinedToItem(joined);
  },

  async removeItem(_playlistId: string, itemId: string): Promise<void> {
    const db = await getDb();
    await db.runAsync('DELETE FROM playlist_items WHERE itemId = ?', [itemId]);
  },

  async reorder(playlistId: string, orderedItemIds: string[]): Promise<void> {
    const db = await getDb();
    for (let i = 0; i < orderedItemIds.length; i += 1) {
      await db.runAsync(
        'UPDATE playlist_items SET position = ? WHERE itemId = ? AND playlistId = ?',
        [i, orderedItemIds[i], playlistId],
      );
    }
  },
};
