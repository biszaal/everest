import { useEffect } from 'react';

import { useDownloadsStore } from '@/store/downloadsStore';
import { isHls } from '@/services/metadata';
import type { Video } from '@/types';

export const useDownloads = () => {
  const records = useDownloadsStore((s) => s.records);
  const jobs = useDownloadsStore((s) => s.jobs);
  const bootstrap = useDownloadsStore((s) => s.bootstrap);
  const enqueue = useDownloadsStore((s) => s.enqueue);
  const cancel = useDownloadsStore((s) => s.cancel);
  const removeLocal = useDownloadsStore((s) => s.removeLocal);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const statusFor = (videoId: string) => {
    if (records[videoId]) return { status: 'done' as const, progress: 1, record: records[videoId] };
    const job = jobs[videoId];
    if (!job) return { status: 'idle' as const, progress: 0 };
    return { status: job.status, progress: job.progress, error: job.error };
  };

  const isDownloadable = (video: Video) =>
    video.platform === 'direct' && Boolean(video.streamUrl) && !!video.streamUrl;

  const isHlsVideo = (video: Video) => isHls(video.streamUrl);

  return {
    records,
    jobs,
    statusFor,
    isDownloadable,
    isHlsVideo,
    startDownload: enqueue,
    cancelDownload: cancel,
    deleteDownload: removeLocal,
  };
};
