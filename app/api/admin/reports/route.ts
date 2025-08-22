import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAPI } from '@/lib/auth/server-auth';
import { db } from '@/lib/db';
import { userReports } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/admin/reports - List stored user PDF reports (admin-only)
export async function GET(req: NextRequest) {
  const auth = await requireAuthAPI('admin');
  if (!('success' in auth) || !auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const url = new URL(req.url);
    const limit = Math.min(Number(url.searchParams.get('limit') || 100), 500);

    const reports = await db
      .select({
        id: userReports.id,
        fileName: userReports.fileName,
        fileSize: userReports.fileSize,
        createdAt: userReports.createdAt,
        deletedUserEmail: userReports.deletedUserEmail,
        deletedUserName: userReports.deletedUserName,
      })
      .from(userReports)
      .orderBy(desc(userReports.createdAt))
      .limit(limit);

    return NextResponse.json({ reports });
  } catch (err) {
    console.error('Error listing reports:', err);
    return NextResponse.json({ error: 'Failed to list reports' }, { status: 500 });
  }
}
