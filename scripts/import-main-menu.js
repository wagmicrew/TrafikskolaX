const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function importMainMenu() {
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

    const menuTableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'menu_items'
      );
    `);

    if (!pagesTableExists.rows[0].exists || !menuTableExists.rows[0].exists) {
      console.log('❌ CMS tables do not exist. Please run the CMS setup first.');
      console.log('📝 You can run this SQL in your Neon database:');
      console.log('   cat scripts/cms-system.sql');
      return;
    }

    console.log('✅ CMS tables exist, proceeding with menu import...');

    // Current main menu items to import
    const mainMenuItems = [
      {
        label: 'Startpage',
        url: '/',
        isExternal: false,
        icon: 'Home',
        sortOrder: 1,
        isActive: true,
        isAdminMenu: false
      },
      {
        label: 'Om oss',
        pageId: null, // Will be set if page exists
        isExternal: false,
        icon: 'Info',
        sortOrder: 2,
        isActive: true,
        isAdminMenu: false
      },
      {
        label: 'Våra tjänster',
        pageId: null, // Will be set if page exists
        isExternal: false,
        icon: 'FileText',
        sortOrder: 3,
        isActive: true,
        isAdminMenu: false
      },
      {
        label: 'Lokalerna',
        pageId: null, // Will be set if page exists
        isExternal: false,
        icon: 'MapPin',
        sortOrder: 4,
        isActive: true,
        isAdminMenu: false
      }
    ];

    // Get existing pages to link menu items
    const existingPages = await client.query(
      'SELECT id, slug FROM pages WHERE status = $1',
      ['published']
    );

    const pageMap = {};
    existingPages.rows.forEach(page => {
      pageMap[page.slug] = page.id;
    });

    // Update menu items with page IDs if pages exist
    mainMenuItems.forEach(item => {
      if (item.label === 'Om oss' && pageMap['om-oss']) {
        item.pageId = pageMap['om-oss'];
        item.url = null; // Clear URL since we're linking to page
      } else if (item.label === 'Våra tjänster' && pageMap['vara-tjanster']) {
        item.pageId = pageMap['vara-tjanster'];
        item.url = null;
      } else if (item.label === 'Lokalerna' && pageMap['lokalerna']) {
        item.pageId = pageMap['lokalerna'];
        item.url = null;
      }
    });

    // Import menu items
    for (const menuItem of mainMenuItems) {
      try {
        // Check if menu item already exists
        const existingMenuItem = await client.query(
          'SELECT id FROM menu_items WHERE label = $1 AND is_admin_menu = false',
          [menuItem.label]
        );

        if (existingMenuItem.rows.length > 0) {
          console.log(`⚠️  Menu item "${menuItem.label}" already exists, updating...`);

          // Update existing menu item
          await client.query(`
            UPDATE menu_items
            SET url = $1, page_id = $2, is_external = $3, icon = $4,
                sort_order = $5, is_active = $6, updated_at = NOW()
            WHERE label = $7 AND is_admin_menu = false
          `, [
            menuItem.url,
            menuItem.pageId,
            menuItem.isExternal,
            menuItem.icon,
            menuItem.sortOrder,
            menuItem.isActive,
            menuItem.label
          ]);

          console.log(`✅ Updated menu item: ${menuItem.label}`);
        } else {
          // Create new menu item
          const [newMenuItem] = await client.query(`
            INSERT INTO menu_items (
              label, url, page_id, is_external, icon, sort_order, is_active, is_admin_menu, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
            RETURNING id
          `, [
            menuItem.label,
            menuItem.url,
            menuItem.pageId,
            menuItem.isExternal,
            menuItem.icon,
            menuItem.sortOrder,
            menuItem.isActive,
            menuItem.isAdminMenu
          ]);

          console.log(`✅ Created menu item: ${menuItem.label} (ID: ${newMenuItem.rows[0].id})`);
        }

      } catch (error) {
        console.error(`❌ Error processing menu item "${menuItem.label}":`, error.message);
      }
    }

    console.log('\n🎉 Menu import completed!');
    console.log('\n📝 Next steps:');
    console.log('1. Go to /dashboard/admin/cms to verify the imported menu items');
    console.log('2. Adjust sorting order or icons as needed');
    console.log('3. The menu will be automatically loaded on the main site');
    console.log('4. Test the menu navigation to ensure it works correctly');

  } catch (error) {
    console.error('❌ Menu import failed:', error);
  } finally {
    await client.end();
    console.log('Database connection closed');
  }
}

// Run import if called directly
if (require.main === module) {
  importMainMenu();
}

module.exports = { importMainMenu };
