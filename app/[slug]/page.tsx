import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { pages } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function DynamicPage({ params }: PageProps) {
  const resolvedParams = await params;
  const { slug } = resolvedParams;

  // First, try to find the page in the database
  let page = await db.select().from(pages).where(eq(pages.slug, slug)).limit(1);

  let pageContent = null;
  let pageTitle = '';
  let pageMetaTitle = '';
  let pageMetaDescription = '';

  if (page.length > 0 && page[0].status === 'published') {
    // Page found in database
    pageContent = page[0].content;
    pageTitle = page[0].title;
    pageMetaTitle = page[0].metaTitle || page[0].title;
    pageMetaDescription = page[0].metaDescription || page[0].excerpt || '';
  } else {
    // Try to find static page in filesystem
    try {
      const staticPath = path.join(process.cwd(), 'app', slug, 'page.tsx');
      if (fs.existsSync(staticPath)) {
        // Static page exists, but we need to render it differently
        // For now, redirect to the static page
        const staticPage = await import(`../${slug}/page`);
        if (staticPage) {
          return <staticPage.default />;
        }
      }
    } catch (error) {
      console.error(`Error loading static page for slug: ${slug}`, error);
    }

    // If no page found, return 404
    notFound();
  }

  return (
    <>
      {/* SEO Meta Tags */}
      <title>{pageMetaTitle}</title>
      {pageMetaDescription && (
        <meta name="description" content={pageMetaDescription} />
      )}

      {/* Page Content */}
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <article className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm p-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-6">{pageTitle}</h1>

            {pageContent ? (
              <div
                className="prose prose-lg max-w-none"
                dangerouslySetInnerHTML={{ __html: pageContent }}
              />
            ) : (
              <div className="text-gray-600">
                <p>Sidan har inget innehåll ännu.</p>
              </div>
            )}
          </article>
        </div>
      </div>
    </>
  );
}

// Generate static params for pages that exist in the database
export async function generateStaticParams() {
  try {
    const dbPages = await db.select({ slug: pages.slug }).from(pages).where(eq(pages.status, 'published'));

    return dbPages.map((page) => ({
      slug: page.slug,
    }));
  } catch (error) {
    console.error('Error generating static params:', error);
    return [];
  }
}
