import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAPI } from '@/lib/auth/server-auth';
import { db } from '@/lib/db';
import { menuItems } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

// GET /api/admin/cms/menu - List all menu items
export async function GET() {
  try {
    const authUser = await requireAuthAPI('admin');
    if (!authUser) {
      return NextResponse.json({ error: 'Obehörig' }, { status: 401 });
    }

    const allMenuItems = await db.select().from(menuItems).orderBy(menuItems.sortOrder);

    return NextResponse.json({ menuItems: allMenuItems });
  } catch (error) {
    console.error('Error fetching menu items:', error);
    return NextResponse.json({ error: 'Kunde inte hämta menyobjekt' }, { status: 500 });
  }
}

// POST /api/admin/cms/menu - Create new menu item
export async function POST(request: NextRequest) {
  try {
    const authUser = await requireAuthAPI('admin');
    if (!authUser) {
      return NextResponse.json({ error: 'Obehörig' }, { status: 401 });
    }

    const body = await request.json();
    const {
      label,
      url,
      pageId,
      isExternal = false,
      icon,
      sortOrder = 0,
      isActive = true,
      isAdminMenu = false
    } = body;

    // Validate required fields
    if (!label) {
      return NextResponse.json({
        error: 'Etikett är obligatorisk'
      }, { status: 400 });
    }

    const [newMenuItem] = await db.insert(menuItems).values({
      label,
      url,
      pageId: pageId || null,
      isExternal,
      icon,
      sortOrder,
      isActive,
      isAdminMenu,
    }).returning();

    return NextResponse.json({
      message: 'Menyobjekt skapat framgångsrikt',
      menuItem: newMenuItem
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating menu item:', error);
    return NextResponse.json({ error: 'Kunde inte skapa menyobjekt' }, { status: 500 });
  }
}
