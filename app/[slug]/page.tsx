import { notFound } from 'next/navigation';
import fs from 'fs';
import path from 'path';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function DynamicPage({ params }: PageProps) {
  const resolvedParams = await params;
  const { slug } = resolvedParams;

  // Validate slug to prevent directory traversal
  if (!slug || slug.includes('..') || slug.includes('/') || slug.includes('\\')) {
    notFound();
  }

  // Try to find static page in filesystem
  try {
    const staticPath = path.join(process.cwd(), 'app', slug, 'page.tsx');
    if (fs.existsSync(staticPath)) {
      // Static page exists, import and render it
      const staticPage = await import(`../${slug}/page`);
      if (staticPage && staticPage.default) {
        return <staticPage.default />;
      }
    }
  } catch (error) {
    console.error(`Error loading static page for slug: ${slug}`, error);
  }

  // If no static page found, return 404
  notFound();
}

// Generate static params for known static pages
export async function generateStaticParams() {
  // For now, return empty array since we're not using database-driven pages
  // This can be expanded later if needed
  return [];
}
