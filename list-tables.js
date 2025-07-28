const { neon } = require('@neondatabase/serverless');
const fs = require('fs');

// Read .env.local file manually
const envContent = fs.readFileSync('.env.local', 'utf8');
const envLines = envContent.split('\n');
let databaseUrl = '';

for (const line of envLines) {
  if (line.startsWith('DATABASE_URL=')) {
    databaseUrl = line.split('DATABASE_URL=')[1].trim();
    break;
  }
}

async function listTables() {
  const sql = neon(databaseUrl);

  try {
    console.log('Connected to database successfully!');
    
    // Query to get all tables in the public schema
    const result = await sql`
      SELECT table_name, table_type
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    
    console.log('\n=== Tables in trafikskolax database ===');
    if (result.length === 0) {
      console.log('No tables found in the public schema.');
    } else {
      result.forEach(row => {
        console.log(`- ${row.table_name} (${row.table_type})`);
      });
    }
    
    // Also get table details with column info
    console.log('\n=== Table Details ===');
    for (const table of result) {
      const columns = await sql`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = ${table.table_name}
        ORDER BY ordinal_position;
      `;
      
      console.log(`\n${table.table_name}:`);
      columns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type}${col.is_nullable === 'NO' ? ' NOT NULL' : ''}${col.column_default ? ` DEFAULT ${col.column_default}` : ''}`);
      });
    }
    
  } catch (error) {
    console.error('Error connecting to database:', error.message);
  }
}

listTables();
