import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAPI } from '@/lib/auth/server-auth';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export async function POST(_request: NextRequest) {
  const auth = await requireAuthAPI('admin');
  if (!auth.success) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: auth.status });
  }
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS lesson_content_groups (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name varchar(255) NOT NULL,
        sort_order integer DEFAULT 0,
        is_active boolean DEFAULT true,
        created_at timestamp DEFAULT now() NOT NULL,
        updated_at timestamp DEFAULT now() NOT NULL
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS lesson_content_items (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        group_id uuid NOT NULL REFERENCES lesson_content_groups(id) ON DELETE CASCADE,
        title varchar(255) NOT NULL,
        description text,
        duration_minutes integer,
        sort_order integer DEFAULT 0,
        is_active boolean DEFAULT true,
        created_at timestamp DEFAULT now() NOT NULL,
        updated_at timestamp DEFAULT now() NOT NULL
      );
    `);

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('Migration error (lesson-content):', e);
    return NextResponse.json({ error: 'Failed to create lesson content tables' }, { status: 500 });
  }
}



