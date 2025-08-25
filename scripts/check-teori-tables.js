const { db } = require('../lib/db');
const { sql } = require('drizzle-orm');

async function checkTeoriTables() {
  try {
    console.log('🔍 Checking Teori tables existence...');

    // Check if teori_lesson_types table exists
    try {
      const result = await db.execute(sql.raw(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'teori_lesson_types'
        );
      `));
      console.log('✅ teori_lesson_types table exists:', result.rows[0].exists);
    } catch (error) {
      console.log('❌ teori_lesson_types table does not exist');
    }

    // Check if teori_sessions table exists
    try {
      const result = await db.execute(sql.raw(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'teori_sessions'
        );
      `));
      console.log('✅ teori_sessions table exists:', result.rows[0].exists);
    } catch (error) {
      console.log('❌ teori_sessions table does not exist');
    }

    // Check if teori_bookings table exists
    try {
      const result = await db.execute(sql.raw(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'teori_bookings'
        );
      `));
      console.log('✅ teori_bookings table exists:', result.rows[0].exists);
    } catch (error) {
      console.log('❌ teori_bookings table does not exist');
    }

    // If tables exist, check for data
    console.log('\n📊 Checking for existing Teori data...');

    try {
      const lessonTypes = await db.execute(sql.raw('SELECT COUNT(*) FROM teori_lesson_types'));
      console.log('📚 Teori lesson types count:', lessonTypes.rows[0].count);
    } catch (error) {
      console.log('❌ Could not query teori_lesson_types');
    }

    try {
      const sessions = await db.execute(sql.raw('SELECT COUNT(*) FROM teori_sessions'));
      console.log('📅 Teori sessions count:', sessions.rows[0].count);
    } catch (error) {
      console.log('❌ Could not query teori_sessions');
    }

  } catch (error) {
    console.error('❌ Error checking Teori tables:', error);
  }
}

checkTeoriTables();
