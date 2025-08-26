require('dotenv').config();
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function checkSchema() {
  try {
    console.log('🔍 Checking lesson_types table schema...');

    // Check columns in lesson_types table
    const result = await sql`SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'lesson_types'
      ORDER BY ordinal_position`;

    console.log('📋 lesson_types columns:');
    result.forEach(col => {
      console.log(`  • ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });

    // Check if 'type' column exists
    const hasTypeColumn = result.some(col => col.column_name === 'type');
    console.log(`\n🔍 'type' column exists: ${hasTypeColumn ? '✅ YES' : '❌ NO'}`);

    if (!hasTypeColumn) {
      console.log('\n💡 The lesson_types table is missing the required columns for the unified system.');
      console.log('🔧 You may need to run the migration scripts.');
    }

    // Also check teori_lesson_types
    console.log('\n🔍 Checking teori_lesson_types table schema...');
    const teoriResult = await sql`SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'teori_lesson_types'
      ORDER BY ordinal_position`;

    console.log('📋 teori_lesson_types columns:');
    teoriResult.forEach(col => {
      console.log(`  • ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking schema:', error.message);
    process.exit(1);
  }
}

checkSchema();
