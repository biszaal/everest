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
