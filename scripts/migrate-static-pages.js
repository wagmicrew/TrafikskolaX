const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function migrateStaticPages() {
  try {
    await client.connect();
    console.log('Connected to database');

    // Check if CMS tables exist
    const pagesTableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'pages'
      );
    `);

    if (!pagesTableExists.rows[0].exists) {
      console.log('❌ CMS tables do not exist. Please run the CMS setup first.');
      console.log('📝 You can run this SQL in your Neon database:');
      console.log('   cat scripts/cms-system.sql');
      return;
    }

    console.log('✅ CMS tables exist, proceeding with migration...');

    // Static pages to migrate
    const staticPages = [
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

    for (const pageData of staticPages) {
      try {
        console.log(`🔄 Migrating ${pageData.slug}...`);

        // Check if page already exists in CMS
        const existingPage = await client.query(
          'SELECT id FROM pages WHERE slug = $1',
          [pageData.slug]
        );

        if (existingPage.rows.length > 0) {
          console.log(`⚠️  Page ${pageData.slug} already exists in CMS, skipping...`);
          continue;
        }

        // Read the static page file
        const filePath = path.join(process.cwd(), pageData.file);
        if (!fs.existsSync(filePath)) {
          console.log(`❌ File ${pageData.file} not found, skipping...`);
          continue;
        }

        const fileContent = fs.readFileSync(filePath, 'utf8');

        // Extract basic content (simplified - in real scenario you'd need more sophisticated parsing)
        let content = `<!-- Migrated from ${pageData.file} -->
<h1>${pageData.title}</h1>
<p>Denna sida har migrerats från det statiska filsystemet till CMS. Originalfil: ${pageData.file}</p>
<p><em>Obs: Innehållet kan behöva redigeras i CMS-redigeraren för att visas korrekt.</em></p>`;

        // Try to extract some meaningful content
        const titleMatch = fileContent.match(/title.*?=.*?["']([^"']+)["']/i);
        const h1Match = fileContent.match(/<h1[^>]*>(.*?)<\/h1>/i);

        let extractedTitle = pageData.title;
        if (h1Match && h1Match[1]) {
          extractedTitle = h1Match[1].replace(/&[a-zA-Z0-9#]+;/g, ' ').trim();
        } else if (titleMatch && titleMatch[1]) {
          extractedTitle = titleMatch[1];
        }

        // Create page in CMS
        const [newPage] = await client.query(`
          INSERT INTO pages (
            slug, title, content, status, is_static, static_path, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
          RETURNING id
        `, [
          pageData.slug,
          extractedTitle,
          content,
          'published',
          true,
          pageData.file
        ]);

        console.log(`✅ Created page ${pageData.slug} with ID: ${newPage.rows[0].id}`);

        // Create menu item for this page
        const [menuItem] = await client.query(`
          INSERT INTO menu_items (
            label, page_id, sort_order, is_active, is_admin_menu, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
          RETURNING id
        `, [
          extractedTitle,
          newPage.rows[0].id,
          10, // Default sort order
          true,
          false
        ]);

        console.log(`✅ Created menu item for ${pageData.slug}`);

      } catch (error) {
        console.error(`❌ Error migrating ${pageData.slug}:`, error.message);
      }
    }

    console.log('\n🎉 Migration completed!');
    console.log('\n📝 Next steps:');
    console.log('1. Go to /dashboard/admin/cms to edit the migrated pages');
    console.log('2. Update the page content using the TinyMCE editor');
    console.log('3. Adjust menu order and structure as needed');
    console.log('4. Test the pages to ensure they display correctly');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await client.end();
    console.log('Database connection closed');
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateStaticPages();
}

module.exports = { migrateStaticPages };
