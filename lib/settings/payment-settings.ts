import { db } from '@/lib/db';
import { siteSettings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

type SettingsMap = Record<string, string>;

let cached: { data: SettingsMap; expiresAt: number } | null = null;

export async function getPaymentSettingsCached(ttlMs: number = 60_000): Promise<SettingsMap> {
  const now = Date.now();
  if (cached && cached.expiresAt > now) return cached.data;

  const settings = await db
    .select({ key: siteSettings.key, value: siteSettings.value })
    .from(siteSettings)
    .where(eq(siteSettings.category, 'payment'));

  const map = settings.reduce((acc, s) => {
    acc[s.key] = s.value ?? '';
    return acc;
  }, {} as SettingsMap);

  cached = { data: map, expiresAt: now + ttlMs };
  return map;
}


