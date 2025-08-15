// Simple script to run Qliro migrations manually
const fs = require('fs');

async function runQliroMigrations() {
  console.log('=== Running Qliro Migrations ===\n');
  
  try {
    // Check if migration files exist
    const migration1 = './drizzle/0011_create_qliro_orders_table.sql';
    const migration2 = './drizzle/0012_add_qliro_foreign_keys.sql';
    const migration3 = './drizzle/0013_add_qliro_indexes.sql';
    
    console.log('1. Checking migration files...');
    
    if (fs.existsSync(migration1)) {
      console.log('   ✅ Migration 1 file exists');
    } else {
      console.log('   ❌ Migration 1 file missing');
    }
    
    if (fs.existsSync(migration2)) {
      console.log('   ✅ Migration 2 file exists');
    } else {
      console.log('   ❌ Migration 2 file missing');
    }
    
    if (fs.existsSync(migration3)) {
      console.log('   ✅ Migration 3 file exists');
    } else {
      console.log('   ❌ Migration 3 file missing');
    }
    
    console.log('\n2. Migration file contents:');
    
    if (fs.existsSync(migration1)) {
      const content1 = fs.readFileSync(migration1, 'utf8');
      console.log('\n   Migration 1 (Create table):');
      console.log('   ' + content1.replace(/\n/g, '\n   '));
    }
    
    if (fs.existsSync(migration2)) {
      const content2 = fs.readFileSync(migration2, 'utf8');
      console.log('\n   Migration 2 (Foreign keys):');
      console.log('   ' + content2.replace(/\n/g, '\n   '));
    }
    
    if (fs.existsSync(migration3)) {
      const content3 = fs.readFileSync(migration3, 'utf8');
      console.log('\n   Migration 3 (Indexes):');
      console.log('   ' + content3.replace(/\n/g, '\n   '));
    }
    
    console.log('\n=== Migration Check Complete ===');
    console.log('\nTo run these migrations:');
    console.log('1. Ensure your DATABASE_URL environment variable is set');
    console.log('2. Run: npx drizzle-kit push');
    console.log('3. Or manually execute the SQL in your database');
    
  } catch (error) {
    console.error('Error checking migrations:', error.message);
  }
}

runQliroMigrations();
