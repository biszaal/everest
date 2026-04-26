import { useCallback, useEffect, useState } from 'react';

import { playlistsService } from '@/services/playlists';
import type { Folder } from '@/types';

export const useFolders = () => {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [list, c] = await Promise.all([
        playlistsService.list(),
        playlistsService.counts?.() ?? Promise.resolve({}),
      ]);
      setFolders(list);
      setCounts(c ?? {});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load folders');
    } finally {
      setLoading(false);
    }
  }, []);

  const create = useCallback(async (name: string, description?: string) => {
    const folder = await playlistsService.create(name, description);
    setFolders((prev) => [folder, ...prev]);
    return folder;
  }, []);

  const remove = useCallback(async (folderId: string, moveVideosToRoot = true) => {
    await playlistsService.remove(folderId, moveVideosToRoot);
    setFolders((prev) => prev.filter((f) => f.playlistId !== folderId));
    setCounts((prev) => {
      const { [folderId]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  const rename = useCallback(async (folderId: string, name: string) => {
    await playlistsService.rename?.(folderId, name);
    setFolders((prev) =>
      prev.map((f) => (f.playlistId === folderId ? { ...f, name, updatedAt: new Date().toISOString() } : f)),
    );
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { folders, counts, loading, error, refresh, create, remove, rename };
};
