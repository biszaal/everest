import { useCallback, useEffect, useState } from 'react';

import { videosService } from '@/services/videos';
import { progressService } from '@/services/progress';
import type { Video, WatchProgress } from '@/types';

/** folderId: undefined = all, null = loose (no folder), string = specific folder. */
export const useVideos = (folderId?: string | null) => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await videosService.list(folderId);
      setVideos(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load videos');
    } finally {
      setLoading(false);
    }
  }, [folderId]);

  const addVideo = useCallback(
    async (url: string, targetFolderId?: string | null) => {
      const created = await videosService.add(url, targetFolderId ?? folderId ?? null);
      setVideos((prev) => [created, ...prev.filter((v) => v.videoId !== created.videoId)]);
      return created;
    },
    [folderId],
  );

  const removeVideo = useCallback(async (id: string) => {
    await videosService.remove(id);
    setVideos((prev) => prev.filter((v) => v.videoId !== id));
  }, []);

  const moveVideo = useCallback(
    async (id: string, targetFolderId: string | null) => {
      await videosService.moveToFolder(id, targetFolderId);
      // If we're scoped to a folder, the moved video leaves the current view.
      if (folderId !== undefined) {
        setVideos((prev) => prev.filter((v) => v.videoId !== id));
      } else {
        setVideos((prev) =>
          prev.map((v) => (v.videoId === id ? { ...v, folderId: targetFolderId } : v)),
        );
      }
    },
    [folderId],
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { videos, loading, error, refresh, addVideo, removeVideo, moveVideo };
};

export const useWatchProgress = () => {
  const [progress, setProgress] = useState<WatchProgress[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const list = await progressService.list();
      setProgress(list);
    } catch {
      setProgress([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { progress, loading, refresh };
};
