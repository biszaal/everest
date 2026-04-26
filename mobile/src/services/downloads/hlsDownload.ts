import * as FileSystem from 'expo-file-system';

import { deleteVideoDir, ensureVideoDir } from './paths';

export interface HlsDownloadHandle {
  cancel: () => void;
  promise: Promise<{ localPath: string; sizeBytes: number }>;
}

interface ManifestAnalysis {
  isMaster: boolean;
  variants: { uri: string; bandwidth: number }[];
  segmentUris: string[];
  mapUri: string | null;
  rewrittenLines: string[];
}

const parseVariants = (lines: string[]): { uri: string; bandwidth: number }[] => {
  const out: { uri: string; bandwidth: number }[] = [];
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (line.startsWith('#EXT-X-STREAM-INF')) {
      const bwMatch = line.match(/BANDWIDTH=(\d+)/);
      const bandwidth = bwMatch ? Number(bwMatch[1]) : 0;
      const next = (lines[i + 1] ?? '').trim();
      if (next && !next.startsWith('#')) out.push({ uri: next, bandwidth });
    }
  }
  return out;
};

const analyseMedia = (manifest: string): ManifestAnalysis => {
  const lines = manifest.split(/\r?\n/);
  const segmentUris: string[] = [];
  const rewritten: string[] = [];
  let mapUri: string | null = null;
  let segIdx = 0;

  for (const raw of lines) {
    const line = raw;
    if (line.startsWith('#EXT-X-MAP')) {
      const m = line.match(/URI="([^"]+)"/);
      if (m) {
        mapUri = m[1];
        rewritten.push(line.replace(m[1], 'init.mp4'));
      } else {
        rewritten.push(line);
      }
    } else if (!line.startsWith('#') && line.trim().length > 0) {
      const localName = `seg-${String(segIdx).padStart(5, '0')}.ts`;
      segmentUris.push(line.trim());
      rewritten.push(localName);
      segIdx += 1;
    } else {
      rewritten.push(line);
    }
  }

  const isMaster = /#EXT-X-STREAM-INF/i.test(manifest);

  return {
    isMaster,
    variants: isMaster ? parseVariants(lines) : [],
    segmentUris,
    mapUri,
    rewrittenLines: rewritten,
  };
};

const fetchText = async (url: string): Promise<string> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Manifest fetch failed (${res.status})`);
  return res.text();
};

const resolve = (uri: string, base: string): string => new URL(uri, base).toString();

const downloadInBatches = async (
  jobs: { remote: string; local: string }[],
  concurrency: number,
  onStep: () => void,
  isCancelled: () => boolean,
): Promise<void> => {
  let cursor = 0;
  const workers = Array.from({ length: Math.min(concurrency, jobs.length) }, async () => {
    while (cursor < jobs.length) {
      if (isCancelled()) return;
      const i = cursor;
      cursor += 1;
      const job = jobs[i];
      const result = await FileSystem.downloadAsync(job.remote, job.local);
      if (result.status >= 400) throw new Error(`Segment ${i} failed (${result.status})`);
      onStep();
    }
  });
  await Promise.all(workers);
};

export const startHlsDownload = (
  videoId: string,
  manifestUrl: string,
  onProgress?: (ratio: number) => void,
): HlsDownloadHandle => {
  let cancelled = false;

  const promise = (async () => {
    const dir = await ensureVideoDir(videoId);

    // 1. Fetch master/media manifest; pick lowest-bitrate variant if master.
    const masterText = await fetchText(manifestUrl);
    let mediaUrl = manifestUrl;
    let mediaText = masterText;
    const masterAnalysis = analyseMedia(masterText);

    if (masterAnalysis.isMaster && masterAnalysis.variants.length > 0) {
      const lowest = [...masterAnalysis.variants].sort((a, b) => a.bandwidth - b.bandwidth)[0];
      mediaUrl = resolve(lowest.uri, manifestUrl);
      mediaText = await fetchText(mediaUrl);
    }

    if (cancelled) throw new Error('Download cancelled');

    // 2. Analyse media playlist, compute local target paths.
    const media = analyseMedia(mediaText);
    if (media.segmentUris.length === 0) throw new Error('No segments found');

    const jobs = media.segmentUris.map((uri, idx) => ({
      remote: resolve(uri, mediaUrl),
      local: `${dir}seg-${String(idx).padStart(5, '0')}.ts`,
    }));
    if (media.mapUri) {
      jobs.unshift({ remote: resolve(media.mapUri, mediaUrl), local: `${dir}init.mp4` });
    }

    let completed = 0;
    const total = jobs.length;
    await downloadInBatches(
      jobs,
      4,
      () => {
        completed += 1;
        onProgress?.(completed / total);
      },
      () => cancelled,
    );

    if (cancelled) throw new Error('Download cancelled');

    // 3. Write rewritten manifest.
    const manifestPath = `${dir}manifest.m3u8`;
    await FileSystem.writeAsStringAsync(manifestPath, media.rewrittenLines.join('\n'));

    // 4. Tally total size.
    let sizeBytes = 0;
    for (const j of jobs) {
      const info = await FileSystem.getInfoAsync(j.local, { size: true });
      if (info.exists && 'size' in info && typeof info.size === 'number') sizeBytes += info.size;
    }
    const miInfo = await FileSystem.getInfoAsync(manifestPath, { size: true });
    if (miInfo.exists && 'size' in miInfo && typeof miInfo.size === 'number') sizeBytes += miInfo.size;

    return { localPath: manifestPath, sizeBytes };
  })().catch(async (err) => {
    await deleteVideoDir(videoId).catch(() => undefined);
    throw err;
  });

  return {
    promise,
    cancel: () => {
      cancelled = true;
    },
  };
};
