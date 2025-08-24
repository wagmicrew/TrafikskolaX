import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { menuItems, pages } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

// GET /api/menu - Get main menu items
export async function GET() {
  try {
    // Get all active menu items that are not admin menu items
    const menuData = await db
      .select({
        id: menuItems.id,
        label: menuItems.label,
        url: menuItems.url,
        pageId: menuItems.pageId,
        isExternal: menuItems.isExternal,
        icon: menuItems.icon,
        sortOrder: menuItems.sortOrder,
        pageSlug: pages.slug,
        pageTitle: pages.title,
      })
      .from(menuItems)
      .leftJoin(pages, eq(menuItems.pageId, pages.id))
      .where(and(
        eq(menuItems.isActive, true),
        eq(menuItems.isAdminMenu, false)
      ))
      .orderBy(menuItems.sortOrder);

    // Build menu structure (supporting nested menus)
    const menuStructure = menuData.map(item => ({
      id: item.id,
      label: item.label,
      url: item.url || (item.pageSlug ? `/${item.pageSlug}` : '#'),
      isExternal: item.isExternal,
      icon: item.icon,
      children: [] // For future nested menu support
    }));

    return NextResponse.json({ menu: menuStructure });
  } catch (error) {
    console.error('Error fetching menu:', error);
    return NextResponse.json({
      error: 'Kunde inte hämta meny'
    }, { status: 500 });
  }
}
