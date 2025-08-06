import { db } from '../lib/db';
import { bookings, slotSettings, blockedSlots, userFeedback, internalMessages } from '../lib/db/schema';
import { sql } from 'drizzle-orm';

/**
 * Script to update booking slots according to the new schedule
 * This will:
 * 1. Delete all current bookings
 * 2. Delete all current slot settings
 * 3. Insert new slot settings for the daily schedule
 */
async function updateBookingSlots() {
  console.log('Starting booking slots update...');

  try {
    // 0. First delete related data that depends on bookings
    console.log('Deleting user feedback related to bookings...');
    await db.delete(userFeedback);
    console.log('User feedback deleted successfully');
    
    console.log('Deleting internal messages related to bookings...');
    await db.delete(internalMessages);
    console.log('Internal messages deleted successfully');
    
    // 1. Delete all current bookings
    console.log('Deleting all current bookings...');
    const deletedBookings = await db.delete(bookings);
    console.log('Bookings deleted successfully');

    // 2. Delete all current slot settings
    console.log('Deleting all current slot settings...');
    const deletedSlotSettings = await db.delete(slotSettings);
    console.log('Slot settings deleted successfully');

    // 3. Optional: Delete blocked slots (uncomment if needed)
    // console.log('Deleting all blocked slots...');
    // await db.delete(blockedSlots);
    // console.log('Blocked slots deleted successfully');

    // 4. Insert new slot settings
    console.log('Inserting new slot settings...');
    
    const newSlots = [];
    const timeSlots = [
        { start: '06:00:00', end: '07:45:00' },
        { start: '08:00:00', end: '09:45:00' },
        { start: '10:00:00', end: '11:45:00' },
        { start: '12:00:00', end: '13:45:00' },
        { start: '14:00:00', end: '15:45:00' },
        { start: '16:00:00', end: '17:45:00' },
      ];

      // Monday to Friday (1-5)
      for (let dayOfWeek = 1; dayOfWeek <= 5; dayOfWeek++) {
        for (const slot of timeSlots) {
          newSlots.push({
            dayOfWeek,
            timeStart: slot.start,
            timeEnd: slot.end,
            isActive: true,
            adminMinutes: 0,
          });
        }
      }

      // Optional: Add Saturday slots (uncomment if needed)
      // const saturdaySlots = [
      //   { start: '08:00:00', end: '09:45:00' },
      //   { start: '10:00:00', end: '11:45:00' },
      //   { start: '12:00:00', end: '13:45:00' },
      // ];
      // for (const slot of saturdaySlots) {
      //   newSlots.push({
      //     dayOfWeek: 6,
      //     timeStart: slot.start,
      //     timeEnd: slot.end,
      //     isActive: true,
      //     adminMinutes: 0,
      //   });
      // }

    await db.insert(slotSettings).values(newSlots);
    console.log(`Inserted ${newSlots.length} new slot settings`);

    console.log('Booking slots update completed successfully!');

    // Verify the changes
    console.log('\nVerifying new slot settings:');
    const slots = await db.select().from(slotSettings).orderBy(slotSettings.dayOfWeek, slotSettings.timeStart);
    
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    for (const slot of slots) {
      console.log(`${dayNames[slot.dayOfWeek]} ${slot.timeStart} - ${slot.timeEnd} (Active: ${slot.isActive})`);
    }

  } catch (error) {
    console.error('Error updating booking slots:', error);
    process.exit(1);
  }

  process.exit(0);
}

// Run the update
updateBookingSlots();
