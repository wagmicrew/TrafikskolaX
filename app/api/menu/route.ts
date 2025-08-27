import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET /api/menu - Get main menu items (static response)
export async function GET() {
  try {
    // Static menu structure to match the Navigation component
    const menuStructure = [
      {
        id: 'home',
        label: 'Hem',
        url: '/',
        isExternal: false,
        icon: 'Home',
        children: []
      },
      {
        id: 'om-oss',
        label: 'Om oss',
        url: '/om-oss',
        isExternal: false,
        icon: 'User',
        children: []
      },
      {
        id: 'vara-tjanster',
        label: 'Våra Tjänster',
        url: '/vara-tjanster',
        isExternal: false,
        icon: 'Car',
        children: []
      },
      {
        id: 'lokalerna',
        label: 'Lokalerna',
        url: '/lokalerna',
        isExternal: false,
        icon: 'Building2',
        children: []
      },
      {
        id: 'boka-korning',
        label: 'Boka körning',
        url: '/boka-korning',
        isExternal: false,
        icon: 'Calendar',
        children: []
      }
    ];

    return NextResponse.json({ menu: menuStructure });
  } catch (error) {
    console.error('Error fetching menu:', error);
    return NextResponse.json({
      error: 'Kunde inte hämta meny'
    }, { status: 500 });
  }
}
