import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAPI } from '@/lib/auth/server-auth';
import { db } from '@/lib/db';
import { pages, menuItems, teoriLessonTypes, teoriSessions } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { existsSync } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const authUser = await requireAuthAPI('admin');
    if (!authUser) {
      return NextResponse.json({ error: 'Obehörig' }, { status: 401 });
    }

    const status = {
      cmsTables: false,
      defaultPages: false,
      defaultMenu: false,
      uploadDirectory: false,
      teoriTables: false,
      teoriSampleData: false
    };

    try {
      // Check if CMS tables exist by trying to query them
      await db.select().from(pages).limit(1);
      status.cmsTables = true;

      await db.select().from(menuItems).limit(1);
      status.cmsTables = status.cmsTables && true;
    } catch (error) {
      // Tables don't exist
      status.cmsTables = false;
    }

    if (status.cmsTables) {
      // Check for default pages
      const defaultPages = await db.select().from(pages).where(eq(pages.status, 'published'));
      status.defaultPages = defaultPages.length > 0;

      // Check for default menu items
      const defaultMenu = await db.select().from(menuItems).where(eq(menuItems.isActive, true));
      status.defaultMenu = defaultMenu.length > 0;
    }

    // Check upload directory
    const uploadDir = path.join(process.cwd(), 'public', 'images');
    status.uploadDirectory = existsSync(uploadDir);

    // Check Teori tables
    try {
      // Check if session_type column exists (indicates migration was run)
      const sessionTypeCheck = await db.execute(sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'teori_sessions' AND column_name = 'session_type'
      `);
      status.teoriTables = sessionTypeCheck.rows.length > 0;

      // Check for sample data
      if (status.teoriTables) {
        const sampleData = await db.select().from(teoriLessonTypes).limit(1);
        status.teoriSampleData = sampleData.length > 0;
      }
    } catch (error) {
      // Teori tables don't exist
      status.teoriTables = false;
      status.teoriSampleData = false;
    }

    return NextResponse.json({ status });
  } catch (error) {
    console.error('Error checking setup status:', error);
    return NextResponse.json({
      error: 'Kunde inte kontrollera status'
    }, { status: 500 });
  }
}
