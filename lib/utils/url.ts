export function getPublicBaseUrl(): string {
  // Prefer configured public URL; fallback to window origin in client; final fallback to request origin
  const envUrl = (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || '').trim();
  if (envUrl) return envUrl.replace(/\/$/, '');
  if (typeof window !== 'undefined' && window.location?.origin) return window.location.origin;
  
  // In server context, try to get from request headers or use a more intelligent fallback
  // This will be overridden by the actual request context in most cases
  return process.env.NODE_ENV === 'production' 
    ? 'https://www.dintrafikskolahlm.se' 
    : 'https://www.dintrafikskolahlm.se'; // Always use production URL, even in development
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


