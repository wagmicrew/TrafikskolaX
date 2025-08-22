import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAPI } from '@/lib/auth/server-auth';
import { db } from '@/lib/db';
import { userReports } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/admin/reports/[id] - Download a stored user PDF report (admin-only)
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuthAPI('admin');
  if (!('success' in auth) || !auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = await params;

    const rows = await db
      .select()
      .from(userReports)
      .where(eq(userReports.id, id))
      .limit(1);

    if (!rows.length) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    const report = rows[0] as any;
    const filePath: string = report.filePath;
    const fileName: string = report.fileName || 'report.pdf';

    // Ensure path resolves under our storage/reports directory
    const baseDir = path.join(process.cwd(), 'storage', 'reports');
    const resolved = path.resolve(filePath);
    if (!resolved.startsWith(baseDir)) {
      console.warn('Attempted access to file outside baseDir:', resolved);
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const data = await fs.promises.readFile(resolved);

    return new NextResponse(data, {
      status: 200,
      headers: new Headers({
        'Content-Type': report.mimeType || 'application/pdf',
        'Content-Length': String(data.length),
        'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
        'Cache-Control': 'no-store',
      }),
    });
  } catch (err) {
    console.error('Error downloading report:', err);
    return NextResponse.json({ error: 'Failed to download report' }, { status: 500 });
  }
}
