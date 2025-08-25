import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAPI } from '@/lib/auth/server-auth';
import { db } from '@/lib/db';
import { pages, menuItems } from '@/lib/db/schema';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const authUser = await requireAuthAPI('admin');
    if (!authUser) {
      return NextResponse.json({ error: 'Obehörig' }, { status: 401 });
    }

    console.log('🔄 Starting current pages initialization...');

    // Clear existing pages and menu items
    console.log('🗑️  Clearing existing pages and menu items...');
    await db.delete(menuItems).where(menuItems.isAdminMenu.isNot(true));
    await db.delete(pages);

    // Current static pages to extract and insert
    const staticPages = [
      {
        slug: 'om-oss',
        title: 'Om oss',
        file: 'app/om-oss/page.tsx'
      },
      {
        slug: 'integritetspolicy',
        title: 'Integritetspolicy',
        file: 'app/integritetspolicy/page.tsx'
      },
      {
        slug: 'kopvillkor',
        title: 'Köpvillkor',
        file: 'app/kopvillkor/page.tsx'
      },
      {
        slug: 'lokalerna',
        title: 'Lokalerna',
        file: 'app/lokalerna/page.tsx'
      },
      {
        slug: 'vara-tjanster',
        title: 'Våra tjänster',
        file: 'app/vara-tjanster/page.tsx'
      },
      {
        slug: 'villkor',
        title: 'Villkor',
        file: 'app/villkor/page.tsx'
      }
    ];

    const processedPages = [];

    for (const pageData of staticPages) {
      try {
        console.log(`📄 Processing ${pageData.slug}...`);

        const filePath = path.join(process.cwd(), pageData.file);

        if (!fs.existsSync(filePath)) {
          console.log(`⚠️  File not found: ${pageData.file}`);
          continue;
        }

        // Read the current file content
        const fileContent = fs.readFileSync(filePath, 'utf8');

        // Extract meaningful content by finding the JSX return content
        let extractedContent = '';

        // For om-oss page, use the entire content as is (it's already in good format)
        if (pageData.slug === 'om-oss') {
          // Extract everything between the first return statement and the closing div
          const returnMatch = fileContent.match(/return\s*\(\s*([\s\S]*?)\s*\)\s*;/);
          if (returnMatch) {
            extractedContent = returnMatch[1].trim();
            // Remove the outer div wrapper
            extractedContent = extractedContent.replace(/^\s*<div[^>]*>\s*/, '');
            extractedContent = extractedContent.replace(/\s*<\/div>\s*$/, '');
          }
        } else {
          // For other pages, extract the main content
          const contentMatch = fileContent.match(/<main[^>]*>([\s\S]*?)<\/main>/);
          if (contentMatch) {
            extractedContent = contentMatch[1].trim();
          } else {
            // Try to find the main content area
            const divMatch = fileContent.match(/<div[^>]*className[^>]*>([\s\S]*?)<\/div>/);
            if (divMatch) {
              extractedContent = divMatch[1].trim();
            } else {
              extractedContent = `<h1>${pageData.title}</h1><p>Sidan finns men kunde inte extraheras automatiskt.</p>`;
            }
          }
        }

        // Clean up the extracted content for proper HTML
        extractedContent = extractedContent
          .replace(/className/g, 'class') // Convert className to class
          .replace(/\{([^}]+)\}/g, '$1') // Remove curly braces from expressions
          .replace(/\/static\//g, '/images/') // Fix image paths
          .trim();

        // Create the page in database
        const [newPage] = await db.insert(pages).values({
          slug: pageData.slug,
          title: pageData.title,
          content: extractedContent,
          excerpt: `Migrerad från ${pageData.file}`,
          status: 'published',
          isStatic: true,
          staticPath: pageData.file,
          authorId: authUser.userId
        }).returning();

        processedPages.push(newPage);
        console.log(`✅ Created page: ${pageData.slug} (ID: ${newPage.id})`);

        // Create menu item for this page
        const [menuItem] = await db.insert(menuItems).values({
          label: pageData.title,
          pageId: newPage.id,
          isExternal: false,
          icon: 'FileText',
          sortOrder: 10,
          isActive: true,
          isAdminMenu: false
        }).returning();

        console.log(`✅ Created menu item for: ${pageData.title}`);

      } catch (error) {
        console.error(`❌ Error processing ${pageData.slug}:`, error.message);
      }
    }

    console.log('\n🎉 Initialization completed!');
    console.log(`📊 Processed ${processedPages.length} pages`);
    console.log('🔄 Menu items created for all pages');

    return NextResponse.json({
      message: 'Current pages successfully initialized in database',
      pagesProcessed: processedPages.length,
      pages: processedPages
    });

  } catch (error) {
    console.error('❌ Initialization failed:', error);
    return NextResponse.json({
      error: 'Failed to initialize current pages',
      details: error.message
    }, { status: 500 });
  }
}
