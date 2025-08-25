import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAPI } from '@/lib/auth/server-auth';
import { db } from '@/lib/db';
import { pages } from '@/lib/db/schema';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const authUser = await requireAuthAPI('admin');
    if (!authUser) {
      return NextResponse.json({ error: 'Obehörig' }, { status: 401 });
    }

    // Default pages to create
    const defaultPages = [
      {
        slug: 'hem',
        title: 'Hem',
        content: '<h1>Välkommen till Trafikskola X</h1><p>Din partner för säker körning och trafikskola.</p>',
        excerpt: 'Välkommen till Trafikskola X - din partner för säker körning.',
        status: 'published'
      },
      {
        slug: 'om-oss',
        title: 'Om oss',
        content: '<h1>Om oss</h1><p>Vi är specialiserade på att utbilda säkra och kompetenta förare med många års erfarenhet.</p>',
        excerpt: 'Lär dig mer om vår trafikskola och vårt team.',
        status: 'published'
      },
      {
        slug: 'kontakt',
        title: 'Kontakt',
        content: '<h1>Kontakt</h1><p>Kontakta oss för frågor om våra tjänster och kurser.</p>',
        excerpt: 'Kontakta oss för att få mer information om våra tjänster.',
        status: 'published'
      }
    ];

    const createdPages = [];

    for (const pageData of defaultPages) {
      const [page] = await db.insert(pages).values({
        ...pageData,
        authorId: authUser.userId,
      }).returning();

      createdPages.push(page);
    }

    return NextResponse.json({
      message: 'Standardsidor skapade framgångsrikt',
      pages: createdPages
    });
  } catch (error) {
    console.error('Error creating default pages:', error);
    return NextResponse.json({
      error: 'Kunde inte skapa standardsidor'
    }, { status: 500 });
  }
}
