import { create } from 'zustand';

import { downloadsRegistry } from '@/services/downloads/registry';
import { startDirectDownload } from '@/services/downloads/directDownload';
import { startHlsDownload } from '@/services/downloads/hlsDownload';
import { deleteVideoDir } from '@/services/downloads/paths';
import { isHls } from '@/services/metadata';
import type { DownloadJob, DownloadRecord, Video } from '@/types';

type Handle = { cancel: () => void | Promise<void> };

interface DownloadsState {
  records: Record<string, DownloadRecord>;
  jobs: Record<string, DownloadJob>;
  bootstrapped: boolean;
  _handles: Record<string, Handle>;

  bootstrap: () => Promise<void>;
  enqueue: (video: Video) => Promise<void>;
  cancel: (videoId: string) => Promise<void>;
  removeLocal: (videoId: string) => Promise<void>;
}

const setJob = (s: DownloadsState, videoId: string, patch: Partial<DownloadJob>): DownloadsState['jobs'] => ({
  ...s.jobs,
  [videoId]: {
    videoId,
    status: patch.status ?? s.jobs[videoId]?.status ?? 'queued',
    progress: patch.progress ?? s.jobs[videoId]?.progress ?? 0,
    error: patch.error ?? s.jobs[videoId]?.error,
  },
});

export const useDownloadsStore = create<DownloadsState>((set, get) => ({
  records: {},
  jobs: {},
  bootstrapped: false,
  _handles: {},

  bootstrap: async () => {
    if (get().bootstrapped) return;
    try {
      const list = await downloadsRegistry.list();
      const records = Object.fromEntries(list.map((r) => [r.videoId, r]));
      set({ records, bootstrapped: true });
    } catch {
      set({ bootstrapped: true });
    }
  },

  enqueue: async (video) => {
    const { jobs, records } = get();
    if (records[video.videoId]) return;
    if (jobs[video.videoId]?.status === 'downloading') return;

    const streamUrl = video.streamUrl;
    if (!streamUrl) throw new Error('No direct stream URL to download');

    set((s) => ({ jobs: setJob(s, video.videoId, { status: 'downloading', progress: 0, error: undefined }) }));

    const onProgress = (ratio: number) => {
      set((s) => ({ jobs: setJob(s, video.videoId, { status: 'downloading', progress: ratio }) }));
    };

    const handle = isHls(streamUrl)
      ? startHlsDownload(video.videoId, streamUrl, onProgress)
      : startDirectDownload(video.videoId, streamUrl, onProgress);

    set((s) => ({ _handles: { ...s._handles, [video.videoId]: handle } }));

    try {
      const { localPath, sizeBytes } = await handle.promise;
      const record: DownloadRecord = {
        videoId: video.videoId,
        localPath,
        type: isHls(streamUrl) ? 'hls' : 'direct',
        sizeBytes,
        downloadedAt: new Date().toISOString(),
      };
      await downloadsRegistry.upsert(record);
      set((s) => {
        const { [video.videoId]: _, ..._handles } = s._handles;
        return {
          records: { ...s.records, [video.videoId]: record },
          jobs: setJob(s, video.videoId, { status: 'done', progress: 1 }),
          _handles,
        };
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Download failed';
      set((s) => {
        const { [video.videoId]: _, ..._handles } = s._handles;
        return {
          jobs: setJob(s, video.videoId, { status: /cancel/i.test(msg) ? 'cancelled' : 'failed', error: msg }),
          _handles,
        };
      });
    }
  },

  cancel: async (videoId) => {
    const handle = get()._handles[videoId];
    await handle?.cancel();
    set((s) => {
      const { [videoId]: _, ..._handles } = s._handles;
      return {
        jobs: setJob(s, videoId, { status: 'cancelled' }),
        _handles,
      };
    });
  },

  removeLocal: async (videoId) => {
    await deleteVideoDir(videoId);
    await downloadsRegistry.remove(videoId);
    set((s) => {
      const { [videoId]: _, ...records } = s.records;
      const { [videoId]: __, ...jobs } = s.jobs;
      return { records, jobs };
    });
  },
}));
