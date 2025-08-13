export function getPublicBaseUrl(): string {
  // Prefer configured public URL; fallback to window origin in client; final fallback localhost
  const envUrl = (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || '').trim();
  if (envUrl) return envUrl.replace(/\/$/, '');
  if (typeof window !== 'undefined' && window.location?.origin) return window.location.origin;
  return 'http://localhost:3000';
}

export function toAbsoluteUrl(pathOrUrl: string): string {
  try {
    const u = new URL(pathOrUrl);
    return u.toString();
  } catch {
    const base = getPublicBaseUrl();
    const p = String(pathOrUrl || '');
    return `${base}${p.startsWith('/') ? '' : '/'}${p}`;
  }
}


