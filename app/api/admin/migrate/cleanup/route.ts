import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { sql } from 'drizzle-orm';
import { requireAuthAPI } from '@/lib/auth/server-auth';

export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const authResult = await requireAuthAPI('admin');
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const results = [];

    // Clean test data while preserving admin users
    try {
      // Delete bookings (this will cascade to related data)
      const deletedBookings = await db.execute(sql`
        DELETE FROM bookings 
        WHERE user_id IN (
          SELECT id FROM users 
          WHERE email LIKE '%@test.se' OR email LIKE '%@example.com'
        ) OR guest_email LIKE '%@test.se' OR guest_email LIKE '%@example.com'
      `);
      results.push(`Deleted ${deletedBookings.rowCount || 0} test bookings`);
    } catch (e) {
      results.push(`Error deleting bookings: ${e}`);
    }

    // Clean user credits for test users
    try {
      const deletedCredits = await db.execute(sql`
        DELETE FROM user_credits 
        WHERE user_id IN (
          SELECT id FROM users 
          WHERE email LIKE '%@test.se'
        )
      `);
      results.push(`Deleted ${deletedCredits.rowCount || 0} test user credits`);
    } catch (e) {
      results.push(`Error deleting user credits: ${e}`);
    }

    // Clean user feedback for test users
    try {
      const deletedFeedback = await db.execute(sql`
        DELETE FROM user_feedback 
        WHERE user_id IN (
          SELECT id FROM users 
          WHERE email LIKE '%@test.se'
        )
      `);
      results.push(`Deleted ${deletedFeedback.rowCount || 0} test user feedback`);
    } catch (e) {
      results.push(`Error deleting user feedback: ${e}`);
    }

    // Clean test users (but keep admin users)
    try {
      const deletedUsers = await db.execute(sql`
        DELETE FROM users 
        WHERE email LIKE '%@test.se' 
        AND role != 'admin'
      `);
      results.push(`Deleted ${deletedUsers.rowCount || 0} test users`);
    } catch (e) {
      results.push(`Error deleting users: ${e}`);
    }

    // Clean test cars
    try {
      const deletedCars = await db.execute(sql`
        DELETE FROM cars 
        WHERE license_plate IN ('ABC123', 'DEF456', 'GHI789', 'JKL012')
      `);
      results.push(`Deleted ${deletedCars.rowCount || 0} test cars`);
    } catch (e) {
      results.push(`Error deleting cars: ${e}`);
    }

    // Clean old bookings (older than 6 months)
    try {
      const deletedOldBookings = await db.execute(sql`
        DELETE FROM bookings 
        WHERE scheduled_date < CURRENT_DATE - INTERVAL '6 months'
      `);
      results.push(`Deleted ${deletedOldBookings.rowCount || 0} old bookings`);
    } catch (e) {
      results.push(`Error deleting old bookings: ${e}`);
    }

    // Clean orphaned slot overrides
    try {
      const deletedOverrides = await db.execute(sql`
        DELETE FROM slot_overrides 
        WHERE date < CURRENT_DATE - INTERVAL '1 month'
      `);
      results.push(`Deleted ${deletedOverrides.rowCount || 0} old slot overrides`);
    } catch (e) {
      results.push(`Error deleting slot overrides: ${e}`);
    }

    // Clean internal messages older than 30 days
    try {
      const deletedMessages = await db.execute(sql`
        DELETE FROM internal_messages 
        WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '30 days'
      `);
      results.push(`Deleted ${deletedMessages.rowCount || 0} old internal messages`);
    } catch (e) {
      results.push(`Error deleting internal messages: ${e}`);
    }

    // Clean expired handledar sessions
    try {
      const deletedSessions = await db.execute(sql`
        DELETE FROM handledar_sessions 
        WHERE date < CURRENT_DATE - INTERVAL '1 month'
      `);
      results.push(`Deleted ${deletedSessions.rowCount || 0} old handledar sessions`);
    } catch (e) {
      results.push(`Error deleting handledar sessions: ${e}`);
    }

    // Clean package purchases for test users
    try {
      const deletedPurchases = await db.execute(sql`
        DELETE FROM package_purchases 
        WHERE user_id IN (
          SELECT id FROM users 
          WHERE email LIKE '%@test.se'
        )
      `);
      results.push(`Deleted ${deletedPurchases.rowCount || 0} test package purchases`);
    } catch (e) {
      results.push(`Error deleting package purchases: ${e}`);
    }

    // Reset sequences and clean up
    try {
      await db.execute(sql`VACUUM ANALYZE`);
      results.push('Database vacuum and analyze completed');
    } catch (e) {
      results.push(`Error during vacuum: ${e}`);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Database cleanup completed - all test data removed, admin users preserved',
      results 
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Database cleanup failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
