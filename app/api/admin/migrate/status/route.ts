import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { sql } from 'drizzle-orm';
import { requireAuthAPI } from '@/lib/auth/server-auth';

export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const authResult = await requireAuthAPI('admin');
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const results = [];
    let totalTables = 0;
    let totalRecords = 0;

    // Check users table
    try {
      const userCount = await db.execute(sql`SELECT COUNT(*) as count FROM users`);
      const adminCount = await db.execute(sql`SELECT COUNT(*) as count FROM users WHERE role = 'admin'`);
      const studentCount = await db.execute(sql`SELECT COUNT(*) as count FROM users WHERE role = 'student'`);
      const teacherCount = await db.execute(sql`SELECT COUNT(*) as count FROM users WHERE role = 'teacher'`);
      
      const users = parseInt(userCount[0].count as string);
      totalRecords += users;
      totalTables++;
      
      results.push(`Users: ${users} total (${adminCount[0].count} admin, ${studentCount[0].count} student, ${teacherCount[0].count} teacher)`);
    } catch (e) {
      results.push(`Error checking users: ${e}`);
    }

    // Check bookings table
    try {
      const bookingCount = await db.execute(sql`SELECT COUNT(*) as count FROM bookings`);
      const confirmedBookings = await db.execute(sql`SELECT COUNT(*) as count FROM bookings WHERE status = 'confirmed'`);
      const pendingBookings = await db.execute(sql`SELECT COUNT(*) as count FROM bookings WHERE status = 'pending'`);
      const guestBookings = await db.execute(sql`SELECT COUNT(*) as count FROM bookings WHERE is_guest_booking = true`);
      
      const bookings = parseInt(bookingCount[0].count as string);
      totalRecords += bookings;
      totalTables++;
      
      results.push(`Bookings: ${bookings} total (${confirmedBookings[0].count} confirmed, ${pendingBookings[0].count} pending, ${guestBookings[0].count} guest)`);
    } catch (e) {
      results.push(`Error checking bookings: ${e}`);
    }

    // Check lesson types
    try {
      const lessonTypeCount = await db.execute(sql`SELECT COUNT(*) as count FROM lesson_types`);
      const activeLessonTypes = await db.execute(sql`SELECT COUNT(*) as count FROM lesson_types WHERE is_active = true`);
      
      const lessons = parseInt(lessonTypeCount[0].count as string);
      totalRecords += lessons;
      totalTables++;
      
      results.push(`Lesson Types: ${lessons} total (${activeLessonTypes[0].count} active)`);
    } catch (e) {
      results.push(`Error checking lesson types: ${e}`);
    }

    // Check cars
    try {
      const carCount = await db.execute(sql`SELECT COUNT(*) as count FROM cars`);
      const activeCars = await db.execute(sql`SELECT COUNT(*) as count FROM cars WHERE is_active = true`);
      
      const cars = parseInt(carCount[0].count as string);
      totalRecords += cars;
      totalTables++;
      
      results.push(`Cars: ${cars} total (${activeCars[0].count} active)`);
    } catch (e) {
      results.push(`Error checking cars: ${e}`);
    }

    // Check user credits
    try {
      const creditCount = await db.execute(sql`SELECT COUNT(*) as count FROM user_credits`);
      const activeCredits = await db.execute(sql`SELECT COUNT(*) as count FROM user_credits WHERE credits_remaining > 0`);
      
      const credits = parseInt(creditCount[0].count as string);
      totalRecords += credits;
      totalTables++;
      
      results.push(`User Credits: ${credits} total (${activeCredits[0].count} with remaining credits)`);
    } catch (e) {
      results.push(`Error checking user credits: ${e}`);
    }

    // Check slot settings
    try {
      const slotCount = await db.execute(sql`SELECT COUNT(*) as count FROM slot_settings`);
      const activeSlots = await db.execute(sql`SELECT COUNT(*) as count FROM slot_settings WHERE is_active = true`);
      
      const slots = parseInt(slotCount[0].count as string);
      totalRecords += slots;
      totalTables++;
      
      results.push(`Slot Settings: ${slots} total (${activeSlots[0].count} active)`);
    } catch (e) {
      results.push(`Error checking slot settings: ${e}`);
    }

    // Check packages
    try {
      const packageCount = await db.execute(sql`SELECT COUNT(*) as count FROM packages`);
      const activePackages = await db.execute(sql`SELECT COUNT(*) as count FROM packages WHERE is_active = true`);
      
      const packages = parseInt(packageCount[0].count as string);
      totalRecords += packages;
      totalTables++;
      
      results.push(`Packages: ${packages} total (${activePackages[0].count} active)`);
    } catch (e) {
      results.push(`Error checking packages: ${e}`);
    }

    // Check handledar sessions
    try {
      const sessionCount = await db.execute(sql`SELECT COUNT(*) as count FROM handledar_sessions`);
      const activeSessions = await db.execute(sql`SELECT COUNT(*) as count FROM handledar_sessions WHERE is_active = true`);
      
      const sessions = parseInt(sessionCount[0].count as string);
      totalRecords += sessions;
      totalTables++;
      
      results.push(`Handledar Sessions: ${sessions} total (${activeSessions[0].count} active)`);
    } catch (e) {
      results.push(`Error checking handledar sessions: ${e}`);
    }

    // Check site settings
    try {
      const settingCount = await db.execute(sql`SELECT COUNT(*) as count FROM site_settings`);
      
      const settings = parseInt(settingCount[0].count as string);
      totalRecords += settings;
      totalTables++;
      
      results.push(`Site Settings: ${settings} configurations`);
    } catch (e) {
      results.push(`Error checking site settings: ${e}`);
    }

    // Database connection test
    try {
      await db.execute(sql`SELECT 1`);
      results.push('Database connection: ✅ Connected');
    } catch (e) {
      results.push(`Database connection: ❌ Error - ${e}`);
    }

    // Check recent activity (last 7 days)
    try {
      const recentBookings = await db.execute(sql`
        SELECT COUNT(*) as count 
        FROM bookings 
        WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '7 days'
      `);
      results.push(`Recent Activity: ${recentBookings[0].count} bookings created in last 7 days`);
    } catch (e) {
      results.push(`Error checking recent activity: ${e}`);
    }

    return NextResponse.json({ 
      success: true, 
      message: `Database healthy - ${totalTables} tables checked, ${totalRecords} total records`,
      results,
      summary: {
        tablesChecked: totalTables,
        totalRecords: totalRecords,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Status check failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
