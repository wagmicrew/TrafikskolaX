import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAPI } from '@/lib/auth/server-auth';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import fs from 'fs/promises';
import path from 'path';

export const runtime = 'nodejs';

interface RunBody {
  path?: string;
  paths?: string[];
  dryRun?: boolean;
}

function sanitizeRelPath(p: string) {
  // Prevent path traversal
  if (p.includes('..')) throw new Error('Ogiltig sökväg');
  return p.replace(/\\/g, '/');
}

async function readSqlFileFromRepoRoot(relPath: string) {
  const repoRoot = process.cwd();
  const abs = path.resolve(repoRoot, relPath);
  const content = await fs.readFile(abs, 'utf8');
  return { abs, content };
}

const ALLOWED_PREFIXES = ['drizzle/', 'lib/db/migrations/', 'migrations/'];
function isAllowedRel(rel: string) {
  const lower = rel.toLowerCase();
  return ALLOWED_PREFIXES.some(pref => lower.startsWith(pref));
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuthAPI('admin');
    if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const body = (await req.json()) as RunBody;
    const targets = (body.paths && body.paths.length > 0)
      ? body.paths
      : (body.path ? [body.path] : []);

    if (targets.length === 0) {
      return NextResponse.json({ success: false, error: 'Inga migrationer angivna' }, { status: 400 });
    }

    const logs: string[] = [];
    const results: Array<{ path: string; ok: boolean; bytes?: number; error?: string }> = [];

    for (const rel of targets) {
      const safeRel = sanitizeRelPath(rel);
      if (!safeRel.toLowerCase().endsWith('.sql')) {
        logs.push(`Hoppas över (ej .sql): ${safeRel}`);
        results.push({ path: safeRel, ok: false, error: 'Endast .sql-filer är tillåtna' });
        continue;
      }
      if (!isAllowedRel(safeRel)) {
        logs.push(`Otillåten sökväg: ${safeRel}`);
        results.push({ path: safeRel, ok: false, error: 'Sökvägen ligger utanför tillåtna mappar' });
        continue;
      }
      logs.push(`Läser fil: ${safeRel}`);
      try {
        const { abs, content } = await readSqlFileFromRepoRoot(safeRel);
        logs.push(`Storlek: ${content.length} byte`);

        if (body.dryRun) {
          logs.push(`Torrkörning – ingen SQL kördes.`);
          results.push({ path: safeRel, ok: true, bytes: content.length });
          continue;
        }

        // Kör hela filen i ett anrop – fungerar för de flesta .sql-migreringar
        await db.execute(sql.raw(content));
        logs.push(`Klar: ${safeRel}`);
        results.push({ path: safeRel, ok: true, bytes: content.length });
      } catch (e: any) {
        const msg = e?.message || String(e);
        logs.push(`Fel för ${safeRel}: ${msg}`);
        results.push({ path: safeRel, ok: false, error: msg });
        // Fortsätt till nästa så att flera kan köras i samma session
      }
    }

    const ok = results.every(r => r.ok);
    return NextResponse.json({ success: ok, logs, results });
  } catch (error) {
    console.error('Run migrations error:', error);
    return NextResponse.json({ success: false, error: 'Misslyckades att köra migration(er)' }, { status: 500 });
  }
}
