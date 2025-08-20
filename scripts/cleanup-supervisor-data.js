#!/usr/bin/env node

/**
 * Supervisor Data Cleanup Script
 * 
 * This script automatically erases social security numbers for supervisors
 * in handledar bookings that have passed their session date.
 * 
 * Usage:
 *   node scripts/cleanup-supervisor-data.js [--dry-run] [--verbose]
 * 
 * Cron job example (run daily at 2 AM):
 *   0 2 * * * cd /path/to/project && node scripts/cleanup-supervisor-data.js
 */

require('dotenv').config({ path: '.env.local' });

const { neon } = require('@neondatabase/serverless');

async function cleanupSupervisorData() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');
  const isVerbose = args.includes('--verbose');
  
  console.log(`\n=== Supervisor Data Cleanup ${isDryRun ? '(DRY RUN)' : ''} ===\n`);
  
  try {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is required');
    }

    const sql = neon(databaseUrl);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    if (isVerbose) {
      console.log(`Checking for bookings before: ${todayStr}`);
    }

    // Find all handledar bookings that have passed their session date
    const expiredBookings = await sql`
      SELECT 
        hb.id as booking_id,
        hs.date as session_date,
        hs.start_time as session_time,
        sd.supervisor_name,
        CASE WHEN sd.supervisor_personal_number IS NOT NULL THEN true ELSE false END as has_personal_number
      FROM handledar_bookings hb
      INNER JOIN handledar_sessions hs ON hb.session_id = hs.id
      LEFT JOIN supervisor_details sd ON hb.id = sd.handledar_booking_id
      WHERE hs.date < ${todayStr}
        AND sd.supervisor_personal_number IS NOT NULL
      ORDER BY hs.date DESC, hs.start_time DESC
    `;

    if (expiredBookings.length === 0) {
      console.log('✅ No expired bookings with personal numbers found');
      return;
    }

    // Group by booking ID to get unique bookings
    const uniqueBookings = new Map();
    expiredBookings.forEach(booking => {
      if (!uniqueBookings.has(booking.booking_id)) {
        uniqueBookings.set(booking.booking_id, {
          bookingId: booking.booking_id,
          sessionDate: booking.session_date,
          sessionTime: booking.session_time,
          supervisors: []
        });
      }
      if (booking.supervisor_name) {
        uniqueBookings.get(booking.booking_id).supervisors.push({
          name: booking.supervisor_name,
          hasPersonalNumber: booking.has_personal_number
        });
      }
    });

    const totalBookings = uniqueBookings.size;
    const totalPersonalNumbers = expiredBookings.filter(b => b.has_personal_number).length;

    console.log(`📊 Found ${totalBookings} expired bookings with ${totalPersonalNumbers} personal numbers to clean`);

    if (isVerbose) {
      console.log('\n📋 Expired bookings:');
      Array.from(uniqueBookings.values()).forEach(booking => {
        console.log(`  - Booking ${booking.bookingId}: ${booking.sessionDate} ${booking.sessionTime}`);
        booking.supervisors.forEach(supervisor => {
          console.log(`    • ${supervisor.name}${supervisor.hasPersonalNumber ? ' (has personal number)' : ''}`);
        });
      });
    }

    if (isDryRun) {
      console.log('\n🔍 DRY RUN: No changes made');
      console.log(`Would clean ${totalPersonalNumbers} personal numbers from ${totalBookings} bookings`);
      return;
    }

    // Clean up personal numbers for expired bookings
    console.log('\n🧹 Cleaning up personal numbers...');
    let cleanedCount = 0;

    for (const bookingId of uniqueBookings.keys()) {
      const result = await sql`
        UPDATE supervisor_details 
        SET supervisor_personal_number = NULL 
        WHERE handledar_booking_id = ${bookingId}
          AND supervisor_personal_number IS NOT NULL
      `;
      
      if (result.rowCount > 0) {
        cleanedCount += result.rowCount;
        if (isVerbose) {
          console.log(`  ✅ Cleaned ${result.rowCount} personal numbers from booking ${bookingId}`);
        }
      }
    }

    console.log(`\n✅ Successfully cleaned ${cleanedCount} personal numbers from ${totalBookings} expired bookings`);

    // Log the cleanup for audit purposes
    await sql`
      INSERT INTO site_settings (key, value, description, category)
      VALUES (
        'last_supervisor_cleanup',
        ${new Date().toISOString()},
        'Last supervisor personal number cleanup timestamp',
        'maintenance'
      )
      ON CONFLICT (key) 
      DO UPDATE SET 
        value = EXCLUDED.value,
        updated_at = CURRENT_TIMESTAMP
    `;

    console.log('📝 Cleanup timestamp logged to site_settings');

  } catch (error) {
    console.error('\n❌ Error during cleanup:', error.message);
    process.exit(1);
  }
}

// Run the cleanup if this script is executed directly
if (require.main === module) {
  cleanupSupervisorData()
    .then(() => {
      console.log('\n=== Cleanup completed ===\n');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Cleanup failed:', error);
      process.exit(1);
    });
}

module.exports = { cleanupSupervisorData };
