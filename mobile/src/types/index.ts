export type VideoPlatform = 'youtube' | 'vimeo' | 'direct' | 'unknown';

export interface Video {
  videoId: string;
  userId: string;
  url: string;
  title: string;
  thumbnail: string;
  platform: VideoPlatform;
  streamUrl: string | null;
  embedUrl: string | null;
  durationSec?: number;
  createdAt: string;
  folderId?: string | null;
}

export type Folder = Playlist;

export interface Playlist {
  playlistId: string;
  userId: string;
  name: string;
  description?: string;
  cover?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlaylistItem {
  itemId: string;
  playlistId: string;
  videoId: string;
  order: number;
  addedAt: string;
  video?: Video | null;
}

export interface PlaylistDetail {
  playlist: Playlist;
  items: PlaylistItem[];
}

export interface WatchProgress {
  userId: string;
  videoId: string;
  progress: number;
  duration?: number;
  updatedAt: string;
}

export interface AuthUser {
  userId: string;
  email: string;
}

export type DownloadType = 'direct' | 'hls';
export type DownloadStatus =
  | 'idle'
  | 'queued'
  | 'downloading'
  | 'done'
  | 'failed'
  | 'cancelled';

export interface DownloadRecord {
  videoId: string;
  localPath: string;
  type: DownloadType;
  sizeBytes: number;
  downloadedAt: string;
}

export interface DownloadJob {
  videoId: string;
  status: DownloadStatus;
  progress: number;
  error?: string;
}

export type MainStackParamList = {
  Tabs: undefined;
  Folder: { folderId: string };
  CreateFolder: undefined;
  MoveVideo: { videoId: string };
};

export type TabParamList = {
  Browse: undefined;
  Library: undefined;
};

// ----- DB row shapes -----
export interface VideoRow {
  id: string;
  user_id: string;
  url: string;
  title: string;
  thumbnail: string | null;
  platform: VideoPlatform;
  stream_url: string | null;
  embed_url: string | null;
  duration_sec: number | null;
  created_at: string;
  folder_id: string | null;
}

export interface PlaylistRow {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  cover: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlaylistItemRow {
  id: string;
  playlist_id: string;
  video_id: string;
  order: number;
  added_at: string;
  videos?: VideoRow | null;
}

export interface WatchProgressRow {
  user_id: string;
  video_id: string;
  progress_sec: number;
  duration_sec: number | null;
  updated_at: string;
}

export const mapVideo = (r: VideoRow): Video => ({
  videoId: r.id,
  userId: r.user_id,
  url: r.url,
  title: r.title,
  thumbnail: r.thumbnail ?? '',
  platform: r.platform,
  streamUrl: r.stream_url,
  embedUrl: r.embed_url,
  durationSec: r.duration_sec ?? undefined,
  createdAt: r.created_at,
  folderId: r.folder_id,
});

export const mapPlaylist = (r: PlaylistRow): Playlist => ({
  playlistId: r.id,
  userId: r.user_id,
  name: r.name,
  description: r.description ?? undefined,
  cover: r.cover ?? undefined,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

export const mapPlaylistItem = (r: PlaylistItemRow): PlaylistItem => ({
  itemId: r.id,
  playlistId: r.playlist_id,
  videoId: r.video_id,
  order: r.order,
  addedAt: r.added_at,
  video: r.videos ? mapVideo(r.videos) : null,
});

export const mapProgress = (r: WatchProgressRow): WatchProgress => ({
  userId: r.user_id,
  videoId: r.video_id,
  progress: r.progress_sec,
  duration: r.duration_sec ?? undefined,
  updatedAt: r.updated_at,
});
