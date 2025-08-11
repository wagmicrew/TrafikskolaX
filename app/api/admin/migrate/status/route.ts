import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
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

      const usersNum = Number((userCount as any).rows?.[0]?.count ?? 0);
      const adminsNum = Number((adminCount as any).rows?.[0]?.count ?? 0);
      const studentsNum = Number((studentCount as any).rows?.[0]?.count ?? 0);
      const teachersNum = Number((teacherCount as any).rows?.[0]?.count ?? 0);

      totalRecords += usersNum;
      totalTables++;

      results.push(`Users: ${usersNum} total (${adminsNum} admin, ${studentsNum} student, ${teachersNum} teacher)`);
    } catch (e) {
      results.push(`Error checking users: ${e}`);
    }

    // Check bookings table
    try {
      const bookingCount = await db.execute(sql`SELECT COUNT(*) as count FROM bookings`);
      const confirmedBookings = await db.execute(sql`SELECT COUNT(*) as count FROM bookings WHERE status = 'confirmed'`);
      const pendingBookings = await db.execute(sql`SELECT COUNT(*) as count FROM bookings WHERE status = 'pending'`);
      const guestBookings = await db.execute(sql`SELECT COUNT(*) as count FROM bookings WHERE is_guest_booking = true`);

      const bookingsNum = Number((bookingCount as any).rows?.[0]?.count ?? 0);
      const confirmedNum = Number((confirmedBookings as any).rows?.[0]?.count ?? 0);
      const pendingNum = Number((pendingBookings as any).rows?.[0]?.count ?? 0);
      const guestNum = Number((guestBookings as any).rows?.[0]?.count ?? 0);

      totalRecords += bookingsNum;
      totalTables++;

      results.push(`Bookings: ${bookingsNum} total (${confirmedNum} confirmed, ${pendingNum} pending, ${guestNum} guest)`);
    } catch (e) {
      results.push(`Error checking bookings: ${e}`);
    }

    // Check lesson types
    try {
      const lessonTypeCount = await db.execute(sql`SELECT COUNT(*) as count FROM lesson_types`);
      const activeLessonTypes = await db.execute(sql`SELECT COUNT(*) as count FROM lesson_types WHERE is_active = true`);

      const lessonsNum = Number((lessonTypeCount as any).rows?.[0]?.count ?? 0);
      const activeLessonsNum = Number((activeLessonTypes as any).rows?.[0]?.count ?? 0);

      totalRecords += lessonsNum;
      totalTables++;

      results.push(`Lesson Types: ${lessonsNum} total (${activeLessonsNum} active)`);
    } catch (e) {
      results.push(`Error checking lesson types: ${e}`);
    }

    // Check cars
    try {
      const carCount = await db.execute(sql`SELECT COUNT(*) as count FROM cars`);
      const activeCars = await db.execute(sql`SELECT COUNT(*) as count FROM cars WHERE is_active = true`);

      const carsNum = Number((carCount as any).rows?.[0]?.count ?? 0);
      const activeCarsNum = Number((activeCars as any).rows?.[0]?.count ?? 0);

      totalRecords += carsNum;
      totalTables++;

      results.push(`Cars: ${carsNum} total (${activeCarsNum} active)`);
    } catch (e) {
      results.push(`Error checking cars: ${e}`);
    }

    // Check user credits
    try {
      const creditCount = await db.execute(sql`SELECT COUNT(*) as count FROM user_credits`);
      const activeCredits = await db.execute(sql`SELECT COUNT(*) as count FROM user_credits WHERE credits_remaining > 0`);

      const creditsNum = Number((creditCount as any).rows?.[0]?.count ?? 0);
      const activeCreditsNum = Number((activeCredits as any).rows?.[0]?.count ?? 0);

      totalRecords += creditsNum;
      totalTables++;

      results.push(`User Credits: ${creditsNum} total (${activeCreditsNum} with remaining credits)`);
    } catch (e) {
      results.push(`Error checking user credits: ${e}`);
    }

    // Check slot settings
    try {
      const slotCount = await db.execute(sql`SELECT COUNT(*) as count FROM slot_settings`);
      const activeSlots = await db.execute(sql`SELECT COUNT(*) as count FROM slot_settings WHERE is_active = true`);

      const slotsNum = Number((slotCount as any).rows?.[0]?.count ?? 0);
      const activeSlotsNum = Number((activeSlots as any).rows?.[0]?.count ?? 0);

      totalRecords += slotsNum;
      totalTables++;

      results.push(`Slot Settings: ${slotsNum} total (${activeSlotsNum} active)`);
    } catch (e) {
      results.push(`Error checking slot settings: ${e}`);
    }

    // Check packages
    try {
      const packageCount = await db.execute(sql`SELECT COUNT(*) as count FROM packages`);
      const activePackages = await db.execute(sql`SELECT COUNT(*) as count FROM packages WHERE is_active = true`);

      const packagesNum = Number((packageCount as any).rows?.[0]?.count ?? 0);
      const activePackagesNum = Number((activePackages as any).rows?.[0]?.count ?? 0);

      totalRecords += packagesNum;
      totalTables++;

      results.push(`Packages: ${packagesNum} total (${activePackagesNum} active)`);
    } catch (e) {
      results.push(`Error checking packages: ${e}`);
    }

    // Check handledar sessions
    try {
      const sessionCount = await db.execute(sql`SELECT COUNT(*) as count FROM handledar_sessions`);
      const activeSessions = await db.execute(sql`SELECT COUNT(*) as count FROM handledar_sessions WHERE is_active = true`);

      const sessionsNum = Number((sessionCount as any).rows?.[0]?.count ?? 0);
      const activeSessionsNum = Number((activeSessions as any).rows?.[0]?.count ?? 0);

      totalRecords += sessionsNum;
      totalTables++;

      results.push(`Handledar Sessions: ${sessionsNum} total (${activeSessionsNum} active)`);
    } catch (e) {
      results.push(`Error checking handledar sessions: ${e}`);
    }

    // Check site settings
    try {
      const settingCount = await db.execute(sql`SELECT COUNT(*) as count FROM site_settings`);

      const settingsNum = Number((settingCount as any).rows?.[0]?.count ?? 0);
      totalRecords += settingsNum;
      totalTables++;

      results.push(`Site Settings: ${settingsNum} configurations`);
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
      const recentNum = Number((recentBookings as any).rows?.[0]?.count ?? 0);
      results.push(`Recent Activity: ${recentNum} bookings created in last 7 days`);
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
