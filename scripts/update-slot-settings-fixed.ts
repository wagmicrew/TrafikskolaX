import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local FIRST
config({ path: resolve(process.cwd(), '.env.local') });

// Now import the database client after environment is loaded
import { db } from '../lib/db/client';
import { slotSettings } from '../lib/db/schema';
import { eq } from 'drizzle-orm';

async function updateSlotSettings() {
  try {
    console.log('Starting slot settings update...');

    // Truncate the slot_settings table
    console.log('Truncating slot_settings table...');
    await db.delete(slotSettings);
    console.log('✓ Slot settings table truncated successfully');

    // Define new timeslots for Monday to Friday (1-5)
    // These are example times - replace with actual times from the image
    const newSlots = [
      // Monday (1)
      { dayOfWeek: 1, timeStart: '08:00', timeEnd: '09:00', isActive: true },
      { dayOfWeek: 1, timeStart: '09:00', timeEnd: '10:00', isActive: true },
      { dayOfWeek: 1, timeStart: '10:00', timeEnd: '11:00', isActive: true },
      { dayOfWeek: 1, timeStart: '11:00', timeEnd: '12:00', isActive: true },
      { dayOfWeek: 1, timeStart: '13:00', timeEnd: '14:00', isActive: true },
      { dayOfWeek: 1, timeStart: '14:00', timeEnd: '15:00', isActive: true },
      { dayOfWeek: 1, timeStart: '15:00', timeEnd: '16:00', isActive: true },
      { dayOfWeek: 1, timeStart: '16:00', timeEnd: '17:00', isActive: true },
      { dayOfWeek: 1, timeStart: '17:00', timeEnd: '18:00', isActive: true },
      { dayOfWeek: 1, timeStart: '18:00', timeEnd: '19:00', isActive: true },

      // Tuesday (2)
      { dayOfWeek: 2, timeStart: '08:00', timeEnd: '09:00', isActive: true },
      { dayOfWeek: 2, timeStart: '09:00', timeEnd: '10:00', isActive: true },
      { dayOfWeek: 2, timeStart: '10:00', timeEnd: '11:00', isActive: true },
      { dayOfWeek: 2, timeStart: '11:00', timeEnd: '12:00', isActive: true },
      { dayOfWeek: 2, timeStart: '13:00', timeEnd: '14:00', isActive: true },
      { dayOfWeek: 2, timeStart: '14:00', timeEnd: '15:00', isActive: true },
      { dayOfWeek: 2, timeStart: '15:00', timeEnd: '16:00', isActive: true },
      { dayOfWeek: 2, timeStart: '16:00', timeEnd: '17:00', isActive: true },
      { dayOfWeek: 2, timeStart: '17:00', timeEnd: '18:00', isActive: true },
      { dayOfWeek: 2, timeStart: '18:00', timeEnd: '19:00', isActive: true },

      // Wednesday (3)
      { dayOfWeek: 3, timeStart: '08:00', timeEnd: '09:00', isActive: true },
      { dayOfWeek: 3, timeStart: '09:00', timeEnd: '10:00', isActive: true },
      { dayOfWeek: 3, timeStart: '10:00', timeEnd: '11:00', isActive: true },
      { dayOfWeek: 3, timeStart: '11:00', timeEnd: '12:00', isActive: true },
      { dayOfWeek: 3, timeStart: '13:00', timeEnd: '14:00', isActive: true },
      { dayOfWeek: 3, timeStart: '14:00', timeEnd: '15:00', isActive: true },
      { dayOfWeek: 3, timeStart: '15:00', timeEnd: '16:00', isActive: true },
      { dayOfWeek: 3, timeStart: '16:00', timeEnd: '17:00', isActive: true },
      { dayOfWeek: 3, timeStart: '17:00', timeEnd: '18:00', isActive: true },
      { dayOfWeek: 3, timeStart: '18:00', timeEnd: '19:00', isActive: true },

      // Thursday (4)
      { dayOfWeek: 4, timeStart: '08:00', timeEnd: '09:00', isActive: true },
      { dayOfWeek: 4, timeStart: '09:00', timeEnd: '10:00', isActive: true },
      { dayOfWeek: 4, timeStart: '10:00', timeEnd: '11:00', isActive: true },
      { dayOfWeek: 4, timeStart: '11:00', timeEnd: '12:00', isActive: true },
      { dayOfWeek: 4, timeStart: '13:00', timeEnd: '14:00', isActive: true },
      { dayOfWeek: 4, timeStart: '14:00', timeEnd: '15:00', isActive: true },
      { dayOfWeek: 4, timeStart: '15:00', timeEnd: '16:00', isActive: true },
      { dayOfWeek: 4, timeStart: '16:00', timeEnd: '17:00', isActive: true },
      { dayOfWeek: 4, timeStart: '17:00', timeEnd: '18:00', isActive: true },
      { dayOfWeek: 4, timeStart: '18:00', timeEnd: '19:00', isActive: true },

      // Friday (5)
      { dayOfWeek: 5, timeStart: '08:00', timeEnd: '09:00', isActive: true },
      { dayOfWeek: 5, timeStart: '09:00', timeEnd: '10:00', isActive: true },
      { dayOfWeek: 5, timeStart: '10:00', timeEnd: '11:00', isActive: true },
      { dayOfWeek: 5, timeStart: '11:00', timeEnd: '12:00', isActive: true },
      { dayOfWeek: 5, timeStart: '13:00', timeEnd: '14:00', isActive: true },
      { dayOfWeek: 5, timeStart: '14:00', timeEnd: '15:00', isActive: true },
      { dayOfWeek: 5, timeStart: '15:00', timeEnd: '16:00', isActive: true },
      { dayOfWeek: 5, timeStart: '16:00', timeEnd: '17:00', isActive: true },
      { dayOfWeek: 5, timeStart: '17:00', timeEnd: '18:00', isActive: true },
      { dayOfWeek: 5, timeStart: '18:00', timeEnd: '19:00', isActive: true },
    ];

    // Insert new slots
    console.log('Inserting new timeslots...');
    await db.insert(slotSettings).values(newSlots);
    console.log(`✓ Successfully inserted ${newSlots.length} timeslots`);

    // Verify the insertion
    const insertedSlots = await db.select().from(slotSettings).orderBy(slotSettings.dayOfWeek, slotSettings.timeStart);
    console.log(`✓ Verification: ${insertedSlots.length} slots found in database`);

    // Show summary by day
    const slotsByDay: Record<number, number> = {};
    insertedSlots.forEach(slot => {
      slotsByDay[slot.dayOfWeek] = (slotsByDay[slot.dayOfWeek] || 0) + 1;
    });

    console.log('\nSummary by day:');
    Object.entries(slotsByDay).forEach(([day, count]) => {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      console.log(`  ${dayNames[parseInt(day)]}: ${count} slots`);
    });

    console.log('\n✅ Slot settings update completed successfully!');

  } catch (error) {
    console.error('❌ Error updating slot settings:', error);
    process.exit(1);
  }
}

// Run the script
updateSlotSettings();
