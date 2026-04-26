// SDK 55: the expo-file-system top-level export is the new File/Directory API.
// We use the legacy `documentDirectory` / `downloadAsync` / `getInfoAsync` style here,
// available at `expo-file-system/legacy` for backward-compat.
import * as FileSystem from 'expo-file-system/legacy';

const ROOT = `${FileSystem.documentDirectory}videos/`;

export const ensureRoot = async () => {
  const info = await FileSystem.getInfoAsync(ROOT);
  if (!info.exists) await FileSystem.makeDirectoryAsync(ROOT, { intermediates: true });
};

export const videoDir = (videoId: string) => `${ROOT}${videoId}/`;

export const ensureVideoDir = async (videoId: string) => {
  await ensureRoot();
  const dir = videoDir(videoId);
  const info = await FileSystem.getInfoAsync(dir);
  if (!info.exists) await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  return dir;
};

export const deleteVideoDir = async (videoId: string) => {
  const dir = videoDir(videoId);
  const info = await FileSystem.getInfoAsync(dir);
  if (info.exists) await FileSystem.deleteAsync(dir, { idempotent: true });
};

export const extFromUrl = (url: string): string => {
  try {
    const path = new URL(url).pathname;
    const m = path.match(/\.([a-zA-Z0-9]+)$/);
    return m ? m[1].toLowerCase() : 'mp4';
  } catch {
    return 'mp4';
  }
};
