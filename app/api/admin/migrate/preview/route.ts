import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAPI } from '@/lib/auth/server-auth';
import path from 'path';
import fs from 'fs/promises';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuthAPI('admin');
    if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { searchParams } = new URL(req.url);
    const relPath = searchParams.get('path');
    if (!relPath) return NextResponse.json({ error: 'Missing path' }, { status: 400 });
    if (relPath.includes('..')) return NextResponse.json({ error: 'Invalid path' }, { status: 400 });

    const root = process.cwd();
    const abs = path.resolve(root, relPath);
    const st = await fs.stat(abs).catch(() => null);
    if (!st || !st.isFile()) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const buf = await fs.readFile(abs, 'utf8');
    const preview = buf.slice(0, 4000);
    return NextResponse.json({ success: true, preview, bytes: buf.length });
  } catch (error) {
    console.error('Preview migration error:', error);
    return NextResponse.json({ success: false, error: 'Failed to preview file' }, { status: 500 });
  }
}


