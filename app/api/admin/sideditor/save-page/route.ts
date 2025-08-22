import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { requireAuth } from '@/lib/auth/server-auth';

// Page configurations
const PAGE_CONFIGS = {
  'om-oss': {
    title: 'Om oss',
    path: 'app/om-oss/page.tsx',
    description: 'Sidan som presenterar vår trafikskola och våra tjänster'
  },
  'vara-tjanster': {
    title: 'Våra Tjänster',
    path: 'app/vara-tjanster/page.tsx',
    description: 'Sidan med detaljerad information om våra tjänster och priser'
  },
  'lokalerna': {
    title: 'Våra Lokaler',
    path: 'app/lokalerna/page.tsx',
    description: 'Sidan som visar våra lokaler och faciliteter'
  }
};

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    await requireAuth('admin');

    const { page, content, title } = await request.json();

    if (!page || !PAGE_CONFIGS[page as keyof typeof PAGE_CONFIGS]) {
      return NextResponse.json(
        { error: 'Ogiltig sida' },
        { status: 400 }
      );
    }

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Ogiltigt innehåll' },
        { status: 400 }
      );
    }

    const pageConfig = PAGE_CONFIGS[page as keyof typeof PAGE_CONFIGS];
    const filePath = path.join(process.cwd(), pageConfig.path);

    // Create backup of original file
    if (fs.existsSync(filePath)) {
      const backupPath = `${filePath}.backup.${Date.now()}`;
      fs.copyFileSync(filePath, backupPath);
    }

    // Write new content to file
    fs.writeFileSync(filePath, content, 'utf-8');

    // Get updated file stats
    const stats = fs.statSync(filePath);
    const lastModified = stats.mtime.toISOString();

    return NextResponse.json({
      success: true,
      message: `Sidan "${pageConfig.title}" har sparats`,
      lastModified,
      backupCreated: true
    });

  } catch (error) {
    console.error('Error saving page:', error);
    return NextResponse.json(
      { error: 'Kunde inte spara sidan' },
      { status: 500 }
    );
  }
}
