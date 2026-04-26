import * as FileSystem from 'expo-file-system';

import { deleteVideoDir, ensureVideoDir, extFromUrl } from './paths';

export interface DirectDownloadHandle {
  cancel: () => Promise<void>;
  promise: Promise<{ localPath: string; sizeBytes: number }>;
}

export const startDirectDownload = (
  videoId: string,
  url: string,
  onProgress?: (ratio: number) => void,
): DirectDownloadHandle => {
  let resumable: FileSystem.DownloadResumable | null = null;
  let cancelled = false;

  const promise = (async () => {
    const dir = await ensureVideoDir(videoId);
    const ext = extFromUrl(url);
    const localPath = `${dir}video.${ext}`;

    resumable = FileSystem.createDownloadResumable(
      url,
      localPath,
      {},
      (p) => {
        if (p.totalBytesExpectedToWrite > 0) {
          onProgress?.(p.totalBytesWritten / p.totalBytesExpectedToWrite);
        }
      },
    );

    const result = await resumable.downloadAsync();
    if (cancelled) throw new Error('Download cancelled');
    if (!result) throw new Error('Download failed');

    const info = await FileSystem.getInfoAsync(result.uri, { size: true });
    const sizeBytes = info.exists && 'size' in info && typeof info.size === 'number' ? info.size : 0;
    return { localPath: result.uri, sizeBytes };
  })();

  return {
    promise,
    cancel: async () => {
      cancelled = true;
      try {
        await resumable?.cancelAsync();
      } catch {
        // swallow
      }
      await deleteVideoDir(videoId);
    },
  };
};
