import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAPI } from '@/lib/auth/server-auth';
import { db } from '@/lib/db';
import { menuItems } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

// GET /api/admin/cms/menu/[id] - Get specific menu item
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
    const menuItem = await db.select().from(menuItems).where(eq(menuItems.id, resolvedParams.id)).limit(1);

    if (!menuItem.length) {
      return NextResponse.json({ error: 'Menyobjekt hittades inte' }, { status: 404 });
    }

    return NextResponse.json({ menuItem: menuItem[0] });
  } catch (error) {
    console.error('Error fetching menu item:', error);
    return NextResponse.json({ error: 'Kunde inte hämta menyobjekt' }, { status: 500 });
  }
}

// PUT /api/admin/cms/menu/[id] - Update menu item
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
      label,
      url,
      pageId,
      isExternal,
      icon,
      sortOrder,
      isActive,
      isAdminMenu
    } = body;

    // Validate required fields
    if (!label) {
      return NextResponse.json({
        error: 'Etikett är obligatorisk'
      }, { status: 400 });
    }

    const [updatedMenuItem] = await db
      .update(menuItems)
      .set({
        label,
        url,
        pageId: pageId || null,
        isExternal,
        icon,
        sortOrder,
        isActive,
        isAdminMenu,
        updatedAt: new Date()
      })
      .where(eq(menuItems.id, resolvedParams.id))
      .returning();

    return NextResponse.json({
      message: 'Menyobjekt uppdaterat framgångsrikt',
      menuItem: updatedMenuItem
    });
  } catch (error) {
    console.error('Error updating menu item:', error);
    return NextResponse.json({ error: 'Kunde inte uppdatera menyobjekt' }, { status: 500 });
  }
}

// DELETE /api/admin/cms/menu/[id] - Delete menu item
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

    // Check if menu item exists
    const menuItem = await db.select().from(menuItems).where(eq(menuItems.id, resolvedParams.id)).limit(1);
    if (!menuItem.length) {
      return NextResponse.json({ error: 'Menyobjekt hittades inte' }, { status: 404 });
    }

    await db.delete(menuItems).where(eq(menuItems.id, resolvedParams.id));

    return NextResponse.json({
      message: 'Menyobjekt raderat framgångsrikt'
    });
  } catch (error) {
    console.error('Error deleting menu item:', error);
    return NextResponse.json({ error: 'Kunde inte radera menyobjekt' }, { status: 500 });
  }
}
