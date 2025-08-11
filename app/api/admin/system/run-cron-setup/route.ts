import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAPI } from '@/lib/auth/server-auth';

export async function POST(request: NextRequest) {
  const auth = await requireAuthAPI('admin');
  if (!auth.success) return NextResponse.json({ error: 'Unauthorized' }, { status: auth.status });
  try {
    const body = await request.json();
    const { appUrl, cronSecret } = body as { appUrl: string; cronSecret: string };
    if (!appUrl || !cronSecret) return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });

    // Validate URL
    let base: URL;
    try {
      base = new URL(appUrl);
      if (!['http:', 'https:'].includes(base.protocol)) throw new Error('Invalid protocol');
    } catch {
      return NextResponse.json({ error: 'Invalid appUrl' }, { status: 400 });
    }

    const cleanupUrl = new URL('/api/booking/cleanup-expired', base).toString();

    // Probe the endpoint with provided secret (GET for stats)
    let validated = false;
    let probeStatus = 0;
    let probeBody: any = null;
    try {
      const res = await fetch(cleanupUrl, { method: 'GET', headers: { Authorization: `Bearer ${cronSecret}` } });
      probeStatus = res.status;
      const text = await res.text();
      try { probeBody = text ? JSON.parse(text) : null; } catch { probeBody = text; }
      validated = res.ok;
    } catch (e) {
      // Network/other error, keep validated=false
      probeBody = { error: (e as Error).message };
    }

    const linuxCron = `*/5 * * * * curl -s -X POST -H "Authorization: Bearer ${cronSecret}" ${cleanupUrl} > /dev/null 2>&1`;
    const windowsPowerShell = `powershell -NoProfile -WindowStyle Hidden -Command \"Invoke-RestMethod -Method Post -Uri '${cleanupUrl}' -Headers @{Authorization='Bearer ${cronSecret}'} | Out-Null\"`;
    const windowsSchtasks = `schtasks /Create /SC MINUTE /MO 5 /TN "TrafikskolaCleanupExpired" /TR "${windowsPowerShell}" /F`;

    return NextResponse.json({
      success: true,
      message: 'Cron instructions generated',
      endpoint: cleanupUrl,
      validated,
      probe: { status: probeStatus, body: probeBody },
      examples: {
        linuxCron,
        curlNow: `curl -X POST -H "Authorization: Bearer ${cronSecret}" ${cleanupUrl}`,
        windowsPowerShellOneLiner: windowsPowerShell.replace(' -WindowStyle Hidden', ''),
        windowsSchtasks,
      },
    });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to prepare cron setup', details: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 });
  }
}




