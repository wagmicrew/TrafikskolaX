const { db } = require('../lib/db');
const { sql } = require('drizzle-orm');

async function checkTeoriAllowsSupervisors() {
  try {
    console.log('🔍 Checking Teori lesson types allows_supervisors configuration...');

    const result = await db.execute(sql.raw(`
      SELECT
        id,
        name,
        description,
        allows_supervisors,
        price,
        price_per_supervisor,
        duration_minutes,
        max_participants
      FROM teori_lesson_types
      WHERE is_active = true
      ORDER BY sort_order, name
    `));

    if (result.rows && result.rows.length > 0) {
      console.log('\n📚 Current Teori lesson types:');
      result.rows.forEach((type, index) => {
        console.log(`${index + 1}. ${type.name}`);
        console.log(`   - allows_supervisors: ${type.allows_supervisors}`);
        console.log(`   - price: ${type.price} kr`);
        console.log(`   - price_per_supervisor: ${type.price_per_supervisor || 'null'} kr`);
        console.log(`   - duration: ${type.duration_minutes} min`);
        console.log(`   - max_participants: ${type.max_participants}`);
        console.log('');
      });
    } else {
      console.log('❌ No active Teori lesson types found');
    }

  } catch (error) {
    console.error('❌ Error checking Teori configuration:', error);
  } finally {
    process.exit(0);
  }
}

checkTeoriAllowsSupervisors();
