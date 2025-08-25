import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAPI } from '@/lib/auth/server-auth';
import { mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const authUser = await requireAuthAPI('admin');
    if (!authUser) {
      return NextResponse.json({ error: 'Obehörig' }, { status: 401 });
    }

    const uploadDir = path.join(process.cwd(), 'public', 'images');

    if (existsSync(uploadDir)) {
      return NextResponse.json({
        message: 'Uppladdningskatalog finns redan'
      });
    }

    await mkdir(uploadDir, { recursive: true });

    // Verify the directory was created
    if (existsSync(uploadDir)) {
      return NextResponse.json({
        message: 'Uppladdningskatalog skapad framgångsrikt',
        path: uploadDir
      });
    } else {
      return NextResponse.json({
        error: 'Kunde inte skapa uppladdningskatalog'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error creating upload directory:', error);
    return NextResponse.json({
      error: 'Kunde inte skapa uppladdningskatalog'
    }, { status: 500 });
  }
}
