import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAPI } from '@/lib/auth/server-auth';
import { db } from '@/lib/db';
import { pages } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

// GET /api/admin/cms/pages/[id] - Get specific page
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await requireAuthAPI('admin');
    if (!authUser) {
      return NextResponse.json({ error: 'Obehörig' }, { status: 401 });
    }

    const resolvedParams = await params;
    const page = await db.select().from(pages).where(eq(pages.id, resolvedParams.id)).limit(1);

    if (!page.length) {
      return NextResponse.json({ error: 'Sidan hittades inte' }, { status: 404 });
    }

    return NextResponse.json({ page: page[0] });
  } catch (error) {
    console.error('Error fetching page:', error);
    return NextResponse.json({ error: 'Kunde inte hämta sidan' }, { status: 500 });
  }
}

// PUT /api/admin/cms/pages/[id] - Update page
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await requireAuthAPI('admin');
    if (!authUser) {
      return NextResponse.json({ error: 'Obehörig' }, { status: 401 });
    }

    const resolvedParams = await params;
    const body = await request.json();
    const {
      title,
      slug,
      content,
      excerpt,
      metaTitle,
      metaDescription,
      status
    } = body;

    // Validate required fields
    if (!title || !slug) {
      return NextResponse.json({
        error: 'Titel och slug är obligatoriska'
      }, { status: 400 });
    }

    // Check if slug already exists (excluding current page)
    const existingPage = await db
      .select()
      .from(pages)
      .where(eq(pages.slug, slug))
      .limit(1);

    if (existingPage.length > 0 && existingPage[0].id !== resolvedParams.id) {
      return NextResponse.json({
        error: 'En sida med denna slug finns redan'
      }, { status: 400 });
    }

    const [updatedPage] = await db
      .update(pages)
      .set({
        title,
        slug,
        content,
        excerpt,
        metaTitle,
        metaDescription,
        status,
        updatedAt: new Date()
      })
      .where(eq(pages.id, resolvedParams.id))
      .returning();

    return NextResponse.json({
      message: 'Sidan uppdaterad framgångsrikt',
      page: updatedPage
    });
  } catch (error) {
    console.error('Error updating page:', error);
    return NextResponse.json({ error: 'Kunde inte uppdatera sidan' }, { status: 500 });
  }
}

// DELETE /api/admin/cms/pages/[id] - Delete page
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await requireAuthAPI('admin');
    if (!authUser) {
      return NextResponse.json({ error: 'Obehörig' }, { status: 401 });
    }

    const resolvedParams = await params;

    // Check if page exists
    const page = await db.select().from(pages).where(eq(pages.id, resolvedParams.id)).limit(1);
    if (!page.length) {
      return NextResponse.json({ error: 'Sidan hittades inte' }, { status: 404 });
    }

    await db.delete(pages).where(eq(pages.id, resolvedParams.id));

    return NextResponse.json({
      message: 'Sidan raderad framgångsrikt'
    });
  } catch (error) {
    console.error('Error deleting page:', error);
    return NextResponse.json({ error: 'Kunde inte radera sidan' }, { status: 500 });
  }
}
