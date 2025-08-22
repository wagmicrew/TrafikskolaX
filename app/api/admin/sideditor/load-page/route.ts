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

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    await requireAuth('admin');

    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page');

    if (!page || !PAGE_CONFIGS[page as keyof typeof PAGE_CONFIGS]) {
      return NextResponse.json(
        { error: 'Ogiltig sida' },
        { status: 400 }
      );
    }

    const pageConfig = PAGE_CONFIGS[page as keyof typeof PAGE_CONFIGS];
    const filePath = path.join(process.cwd(), pageConfig.path);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: 'Filen hittades inte' },
        { status: 404 }
      );
    }

    // Read the file content
    const fileContent = fs.readFileSync(filePath, 'utf-8');

    // Get file stats for last modified
    const stats = fs.statSync(filePath);
    const lastModified = stats.mtime.toISOString();

    return NextResponse.json({
      title: pageConfig.title,
      content: fileContent,
      lastModified,
      path: pageConfig.path
    });

  } catch (error) {
    console.error('Error loading page:', error);
    return NextResponse.json(
      { error: 'Kunde inte ladda sidan' },
      { status: 500 }
    );
  }
}
