export const isLikelyUrl = (value: string): boolean => {
  const v = value.trim();
  if (!v) return false;
  try {
    const u = new URL(v.includes('://') ? v : `https://${v}`);
    return Boolean(u.hostname && u.hostname.includes('.'));
  } catch {
    return false;
  }
};

/** Extract a clean hostname for display (strips `www.`). Falls back to the input if it can't parse. */
export const hostOf = (url: string): string => {
  if (!url) return '';
  try {
    return new URL(url).host.replace(/^www\./, '');
  } catch {
    return url;
  }
};
