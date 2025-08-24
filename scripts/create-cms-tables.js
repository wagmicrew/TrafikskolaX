const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function createCmsTables() {
  try {
    await client.connect();
    console.log('Connected to database');

    // Create pages table
    await client.query(`
      CREATE TABLE IF NOT EXISTS pages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        slug VARCHAR(255) NOT NULL UNIQUE,
        title VARCHAR(255) NOT NULL,
        content TEXT,
        excerpt TEXT,
        meta_title VARCHAR(255),
        meta_description TEXT,
        status VARCHAR(20) DEFAULT 'draft',
        is_static BOOLEAN DEFAULT FALSE,
        static_path VARCHAR(255),
        author_id UUID,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `);

    // Create menu_items table
    await client.query(`
      CREATE TABLE IF NOT EXISTS menu_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        parent_id UUID REFERENCES menu_items(id),
        label VARCHAR(255) NOT NULL,
        url VARCHAR(255),
        page_id UUID REFERENCES pages(id),
        is_external BOOLEAN DEFAULT FALSE,
        icon VARCHAR(100),
        sort_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        is_admin_menu BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `);

    // Create page_images table
    await client.query(`
      CREATE TABLE IF NOT EXISTS page_images (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        page_id UUID NOT NULL REFERENCES pages(id),
        filename VARCHAR(255) NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        path VARCHAR(500) NOT NULL,
        size INTEGER NOT NULL,
        mime_type VARCHAR(100) NOT NULL,
        uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `);

    // Add indexes for better performance
    await client.query(`CREATE INDEX IF NOT EXISTS idx_pages_slug ON pages(slug)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_pages_status ON pages(status)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_menu_items_parent_id ON menu_items(parent_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_menu_items_sort_order ON menu_items(sort_order)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_menu_items_is_admin_menu ON menu_items(is_admin_menu)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_page_images_page_id ON page_images(page_id)`);

    // Add comments
    await client.query(`COMMENT ON TABLE pages IS 'Stores page content for the CMS system'`);
    await client.query(`COMMENT ON TABLE menu_items IS 'Stores menu navigation items'`);
    await client.query(`COMMENT ON TABLE page_images IS 'Stores images uploaded to pages'`);

    console.log('✅ Successfully created CMS tables');

    // Insert some default pages
    const defaultPages = [
      {
        slug: 'hem',
        title: 'Hem',
        content: '<h1>Välkommen till Trafikskola X</h1><p>Din partner för säker körning och trafikskola.</p>',
        status: 'published'
      },
      {
        slug: 'om-oss',
        title: 'Om oss',
        content: '<h1>Om oss</h1><p>Vi är specialiserade på att utbilda säkra och kompetenta förare.</p>',
        status: 'published'
      },
      {
        slug: 'kontakt',
        title: 'Kontakt',
        content: '<h1>Kontakt</h1><p>Kontakta oss för frågor om våra tjänster.</p>',
        status: 'published'
      }
    ];

    for (const page of defaultPages) {
      await client.query(
        'INSERT INTO pages (slug, title, content, status) VALUES ($1, $2, $3, $4) ON CONFLICT (slug) DO NOTHING',
        [page.slug, page.title, page.content, page.status]
      );
    }

    console.log('✅ Successfully inserted default pages');

  } catch (error) {
    console.error('❌ Error creating tables:', error);
  } finally {
    await client.end();
    console.log('Database connection closed');
  }
}

createCmsTables();
