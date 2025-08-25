import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAPI } from '@/lib/auth/server-auth';
import { db } from '@/lib/db';
import { menuItems, pages } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const authUser = await requireAuthAPI('admin');
    if (!authUser) {
      return NextResponse.json({ error: 'Obehörig' }, { status: 401 });
    }

    // Get the created pages to link menu items
    const createdPages = await db.select({ id: pages.id, slug: pages.slug }).from(pages);

    const pageMap: Record<string, string> = {};
    createdPages.forEach(page => {
      pageMap[page.slug] = page.id;
    });

    // Default menu items
    const defaultMenuItems = [
      {
        label: 'Hem',
        url: '/',
        isExternal: false,
        icon: 'Home',
        sortOrder: 1,
        isActive: true,
        isAdminMenu: false
      },
      {
        label: 'Om oss',
        pageId: pageMap['om-oss'] || null,
        isExternal: false,
        icon: 'Info',
        sortOrder: 2,
        isActive: true,
        isAdminMenu: false
      },
      {
        label: 'Kontakt',
        pageId: pageMap['kontakt'] || null,
        isExternal: false,
        icon: 'Phone',
        sortOrder: 3,
        isActive: true,
        isAdminMenu: false
      }
    ];

    const createdMenuItems = [];

    for (const menuItemData of defaultMenuItems) {
      const [menuItem] = await db.insert(menuItems).values(menuItemData).returning();
      createdMenuItems.push(menuItem);
    }

    return NextResponse.json({
      message: 'Standardmeny skapad framgångsrikt',
      menuItems: createdMenuItems
    });
  } catch (error) {
    console.error('Error creating default menu:', error);
    return NextResponse.json({
      error: 'Kunde inte skapa standardmeny'
    }, { status: 500 });
  }
}
