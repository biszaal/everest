import type { VideoPlatform } from '@/types';

export interface ResolvedMetadata {
  platform: VideoPlatform;
  title: string;
  thumbnail: string;
  embedUrl: string | null;
  streamUrl: string | null;
}

const YOUTUBE_HOSTS = ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com', 'youtu.be'];
const VIMEO_HOSTS = ['vimeo.com', 'www.vimeo.com', 'player.vimeo.com'];
const DIRECT_EXT = /\.(mp4|m3u8|mov|webm|mkv)(\?.*)?$/i;

const safeUrl = (url: string): URL | null => {
  try {
    return new URL(url.trim());
  } catch {
    return null;
  }
};

const extractYoutubeId = (u: URL): string | null => {
  if (u.hostname === 'youtu.be') return u.pathname.replace(/^\//, '').split('/')[0] || null;
  if (u.pathname === '/watch') return u.searchParams.get('v');
  const m = u.pathname.match(/^\/(?:embed|shorts|v)\/([a-zA-Z0-9_-]{6,})/);
  return m ? m[1] : null;
};

const extractVimeoId = (u: URL): string | null => {
  const parts = u.pathname.split('/').filter(Boolean);
  return parts.find((p) => /^\d+$/.test(p)) ?? null;
};

const fetchJson = async <T>(url: string): Promise<T | null> => {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
};

export const resolveMetadata = async (rawUrl: string): Promise<ResolvedMetadata> => {
  const u = safeUrl(rawUrl);
  if (!u) throw new Error('Invalid URL');

  const host = u.hostname.toLowerCase();

  if (YOUTUBE_HOSTS.includes(host)) {
    const id = extractYoutubeId(u);
    if (!id) throw new Error('Could not extract YouTube video id');
    const oembed = await fetchJson<{ title?: string; thumbnail_url?: string }>(
      `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(rawUrl)}`,
    );
    return {
      platform: 'youtube',
      title: oembed?.title ?? 'YouTube video',
      thumbnail: oembed?.thumbnail_url ?? `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      embedUrl: `https://www.youtube.com/embed/${id}?playsinline=1&modestbranding=1&rel=0`,
      streamUrl: null,
    };
  }

  if (VIMEO_HOSTS.includes(host)) {
    const id = extractVimeoId(u);
    if (!id) throw new Error('Could not extract Vimeo video id');
    const oembed = await fetchJson<{ title?: string; thumbnail_url?: string }>(
      `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(rawUrl)}`,
    );
    return {
      platform: 'vimeo',
      title: oembed?.title ?? 'Vimeo video',
      thumbnail: oembed?.thumbnail_url ?? '',
      embedUrl: `https://player.vimeo.com/video/${id}`,
      streamUrl: null,
    };
  }

  if (DIRECT_EXT.test(u.pathname)) {
    const name = decodeURIComponent(u.pathname.split('/').pop() ?? 'Video');
    return {
      platform: 'direct',
      title: name.replace(/\.[^.]+$/, ''),
      thumbnail: '',
      embedUrl: null,
      streamUrl: rawUrl,
    };
  }

  return {
    platform: 'unknown',
    title: u.hostname,
    thumbnail: '',
    embedUrl: null,
    streamUrl: rawUrl,
  };
};

export const isDownloadable = (platform: VideoPlatform, url: string | null | undefined): boolean => {
  if (platform !== 'direct') return false;
  if (!url) return false;
  return DIRECT_EXT.test(new URL(url).pathname);
};

export const isHls = (url: string | null | undefined): boolean => {
  if (!url) return false;
  try {
    return /\.m3u8(\?.*)?$/i.test(new URL(url).pathname);
  } catch {
    return false;
  }
};
