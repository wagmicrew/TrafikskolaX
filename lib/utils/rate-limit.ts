type Window = {
  timestamps: number[];
};

const windowsByKey: Map<string, Window> = new Map();

export function rateLimit({
  key,
  limit,
  windowMs,
}: {
  key: string;
  limit: number;
  windowMs: number;
}): { allowed: boolean; remaining: number; resetMs: number } {
  const now = Date.now();
  const windowStart = now - windowMs;
  const win = windowsByKey.get(key) || { timestamps: [] };

  // prune old
  win.timestamps = win.timestamps.filter((t) => t > windowStart);

  if (win.timestamps.length >= limit) {
    const resetMs = Math.max(0, windowMs - (now - win.timestamps[0]));
    windowsByKey.set(key, win);
    return { allowed: false, remaining: 0, resetMs };
  }

  win.timestamps.push(now);
  windowsByKey.set(key, win);
  return { allowed: true, remaining: limit - win.timestamps.length, resetMs: windowMs };
}

export function getRequestIp(headers: Headers): string {
  const xff = headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  const realIp = headers.get('x-real-ip');
  if (realIp) return realIp;
  return 'unknown';
}


