import { db } from '../lib/db.js';
import { blockedSlots } from '../lib/db/schema.js';

async function checkBlockedSlots() {
  console.log('🔍 Checking blocked slots in database...');

  try {
    const allBlockedSlots = await db
      .select()
      .from(blockedSlots)
      .orderBy(blockedSlots.date);

    console.log(`📋 Found ${allBlockedSlots.length} blocked slots:`);

    if (allBlockedSlots.length === 0) {
      console.log('✅ No blocked slots found in the database');
      return;
    }

    allBlockedSlots.forEach((slot, index) => {
      console.log(`${index + 1}. Date: ${slot.date}`);
      console.log(`   - All Day: ${slot.isAllDay}`);
      console.log(`   - Time: ${slot.timeStart || 'N/A'} - ${slot.timeEnd || 'N/A'}`);
      console.log(`   - Reason: ${slot.reason || 'No reason provided'}`);
      console.log(`   - Created: ${slot.createdAt}`);
      console.log('');
    });

    // Group by date for better overview
    const groupedByDate = allBlockedSlots.reduce((acc, slot) => {
      if (!acc[slot.date]) {
        acc[slot.date] = [];
      }
      acc[slot.date].push(slot);
      return acc;
    }, {});

    console.log('📅 Blocked slots by date:');
    Object.entries(groupedByDate).forEach(([date, slots]) => {
      console.log(`  ${date}: ${slots.length} blocked slot(s)`);
    });

  } catch (error) {
    console.error('❌ Error checking blocked slots:', error);
  }
}

console.log('🚀 Starting blocked slots check...');
await checkBlockedSlots();
console.log('✨ Check completed');

process.exit(0);
