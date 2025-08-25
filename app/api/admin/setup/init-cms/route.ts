import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAPI } from '@/lib/auth/server-auth';
import { runTerminalCmd } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const authUser = await requireAuthAPI('admin');
    if (!authUser) {
      return NextResponse.json({ error: 'Obehörig' }, { status: 401 });
    }

    // Run the CMS table creation script
    const result = await runTerminalCmd('node scripts/create-cms-tables.js');

    if (result.exitCode === 0) {
      return NextResponse.json({
        message: 'CMS-tabeller skapade framgångsrikt',
        details: result.output
      });
    } else {
      return NextResponse.json({
        error: 'Kunde inte skapa CMS-tabeller',
        details: result.output
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error initializing CMS:', error);
    return NextResponse.json({
      error: 'Kunde inte initialisera CMS'
    }, { status: 500 });
  }
}
