import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAPI } from '@/lib/auth/server-auth';
import { db } from '@/lib/db';
import { pages } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

// GET /api/admin/cms/pages - List all pages
export async function GET() {
  try {
    const authUser = await requireAuthAPI('admin');
    if (!authUser) {
      return NextResponse.json({ error: 'Obehörig' }, { status: 401 });
    }

    const allPages = await db.select().from(pages).orderBy(pages.createdAt);

    return NextResponse.json({ pages: allPages });
  } catch (error) {
    console.error('Error fetching pages:', error);
    return NextResponse.json({ error: 'Kunde inte hämta sidor' }, { status: 500 });
  }
}

// POST /api/admin/cms/pages - Create new page
export async function POST(request: NextRequest) {
  try {
    const authUser = await requireAuthAPI('admin');
    if (!authUser) {
      return NextResponse.json({ error: 'Obehörig' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      slug,
      content,
      excerpt,
      metaTitle,
      metaDescription,
      status = 'draft'
    } = body;

    // Validate required fields
    if (!title || !slug) {
      return NextResponse.json({
        error: 'Titel och slug är obligatoriska'
      }, { status: 400 });
    }

    // Check if slug already exists
    const existingPage = await db.select().from(pages).where(eq(pages.slug, slug)).limit(1);
    if (existingPage.length > 0) {
      return NextResponse.json({
        error: 'En sida med denna slug finns redan'
      }, { status: 400 });
    }

    const [newPage] = await db.insert(pages).values({
      title,
      slug,
      content,
      excerpt,
      metaTitle,
      metaDescription,
      status,
      authorId: authUser.userId,
    }).returning();

    return NextResponse.json({
      message: 'Sidan skapad framgångsrikt',
      page: newPage
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating page:', error);
    return NextResponse.json({ error: 'Kunde inte skapa sida' }, { status: 500 });
  }
}
