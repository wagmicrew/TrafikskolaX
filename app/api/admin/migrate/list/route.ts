import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAPI } from '@/lib/auth/server-auth';
import path from 'path';
import fs from 'fs/promises';

export const runtime = 'nodejs';

// Directories to scan for .sql migrations, relative to repo root
const RELATIVE_DIRS = [
  'drizzle',
  'lib/db/migrations',
  'migrations',
];

async function safeStat(p: string) {
  try { return await fs.stat(p); } catch { return null; }
}

async function collectSqlFiles(root: string) {
  const items: any[] = [];
  for (const rel of RELATIVE_DIRS) {
    const abs = path.resolve(root, rel);
    const st = await safeStat(abs);
    if (!st || !st.isDirectory()) continue;

    const stack: string[] = [abs];
    while (stack.length) {
      const dir = stack.pop()!;
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const entryAbs = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          stack.push(entryAbs);
        } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.sql')) {
          const s = await safeStat(entryAbs);
          if (!s) continue;
          const relPath = path.relative(root, entryAbs).replace(/\\/g, '/');
          items.push({
            id: relPath,
            dir: rel,
            filename: entry.name,
            relPath,
            size: s.size,
            mtime: s.mtimeMs,
            // preview removed for performance; fetch via /api/admin/migrate/preview when needed
          });
        }
      }
    }
  }
  // Sort by directory then filename
  items.sort((a, b) => (a.dir + a.filename).localeCompare(b.dir + b.filename));
  return items;
}

export async function GET(_req: NextRequest) {
  try {
    const auth = await requireAuthAPI('admin');
    if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const root = process.cwd();
    const items = await collectSqlFiles(root);
    return NextResponse.json({ success: true, count: items.length, items });
  } catch (error) {
    console.error('List migrations error:', error);
    return NextResponse.json({ success: false, error: 'Failed to list migrations' }, { status: 500 });
  }
}
