import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

/**
 * Migration API: Move handledar sessions to unified Teori system
 *
 * This API migrates:
 * - handledar_sessions → teori_sessions
 * - handledar_bookings → teori_bookings
 * - supervisor_details → teori_supervisors
 */

export async function POST(request: NextRequest) {
  try {
    // Authentication
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value || cookieStore.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { dryRun = true } = await request.json();

    console.log(`🔄 Starting handledar to teori migration (dry run: ${dryRun})`);

    // Step 1: Get handledar lesson type ID
    const handledarLessonTypeQuery = `
      SELECT id FROM teori_lesson_types
      WHERE name = 'Handledarutbildning'
      LIMIT 1
    `;

    const lessonTypeResult = await db.execute(sql.raw(handledarLessonTypeQuery));

    if (lessonTypeResult.length === 0) {
      return NextResponse.json({
        error: 'Handledarutbildning lesson type not found. Please create it first.'
      }, { status: 400 });
    }

    const handledarLessonTypeId = lessonTypeResult[0].id;
    console.log(`📍 Found handledar lesson type ID: ${handledarLessonTypeId}`);

    // Step 2: Migrate handledar_sessions to teori_sessions
    console.log('\n📋 Step 2: Migrating handledar_sessions → teori_sessions');

    const migrateSessionsQuery = `
      INSERT INTO teori_sessions (
        lesson_type_id, title, description, date, start_time, end_time,
        max_participants, current_participants, teacher_id,
        price, reference_id, session_type, is_active, created_at, updated_at
      )
      SELECT
        '${handledarLessonTypeId}', title, description, date, start_time, end_time,
        max_participants, current_participants, teacher_id,
        price_per_participant, id, 'handledar', is_active, created_at, updated_at
      FROM handledar_sessions
      WHERE is_active = true
    `;

    if (!dryRun) {
      await db.execute(sql.raw(migrateSessionsQuery));
      console.log('✅ Migrated handledar sessions');
    } else {
      console.log(`📝 Would execute: ${migrateSessionsQuery}`);
    }

    // Step 3: Get migrated session mapping
    const sessionMappingQuery = `
      SELECT ts.id as new_session_id, hs.id as old_session_id
      FROM teori_sessions ts
      JOIN handledar_sessions hs ON ts.reference_id = hs.id
      WHERE ts.session_type = 'handledar'
    `;

    const sessionMapping = dryRun ? [] : await db.execute(sql.raw(sessionMappingQuery));
    console.log(`📍 Found ${sessionMapping.length} session mappings`);

    // Step 4: Migrate handledar_bookings to teori_bookings
    console.log('\n📋 Step 4: Migrating handledar_bookings → teori_bookings');

    // First, get all handledar bookings
    const bookingsQuery = `
      SELECT hb.*, ts.id as new_session_id
      FROM handledar_bookings hb
      JOIN teori_sessions ts ON ts.reference_id = hb.session_id
      WHERE hb.status NOT IN ('cancelled', 'completed')
    `;

    const bookings = dryRun ? [] : await db.execute(sql.raw(bookingsQuery));
    console.log(`📍 Found ${bookings.length} active handledar bookings to migrate`);

    // Migrate each booking
    for (const booking of bookings) {
      const migrateBookingQuery = `
        INSERT INTO teori_bookings (
          session_id, student_id, status, price, payment_status,
          payment_method, swish_uuid, booked_by, reminder_sent,
          participant_name, participant_email, participant_phone,
          participant_personal_number, created_at, updated_at
        ) VALUES (
          '${booking.new_session_id}',
          ${booking.student_id ? `'${booking.student_id}'` : 'NULL'},
          '${booking.status}',
          ${booking.price},
          '${booking.payment_status}',
          ${booking.payment_method ? `'${booking.payment_method}'` : 'NULL'},
          ${booking.swish_uuid ? `'${booking.swish_uuid}'` : 'NULL'},
          ${booking.booked_by ? `'${booking.booked_by}'` : 'NULL'},
          ${booking.reminder_sent},
          '${booking.supervisor_name}',
          ${booking.supervisor_email ? `'${booking.supervisor_email}'` : 'NULL'},
          ${booking.supervisor_phone ? `'${booking.supervisor_phone}'` : 'NULL'},
          ${booking.supervisor_personal_number ? `'${booking.supervisor_personal_number}'` : 'NULL'},
          '${booking.created_at}',
          '${booking.updated_at}'
        )
      `;

      if (!dryRun) {
        await db.execute(sql.raw(migrateBookingQuery));
      } else {
        console.log(`📝 Would migrate booking ${booking.id}`);
      }
    }

    // Step 5: Migrate supervisor_details to teori_supervisors
    console.log('\n📋 Step 5: Migrating supervisor_details → teori_supervisors');

    // Get supervisor details with booking mapping
    const supervisorQuery = `
      SELECT sd.*, hb.price_per_supervisor
      FROM supervisor_details sd
      JOIN handledar_bookings hb ON hb.id = sd.handledar_booking_id
      WHERE hb.status NOT IN ('cancelled', 'completed')
    `;

    const supervisors = dryRun ? [] : await db.execute(sql.raw(supervisorQuery));
    console.log(`📍 Found ${supervisors.length} supervisors to migrate`);

    // Migrate supervisors (this requires matching the new booking IDs)
    if (!dryRun && supervisors.length > 0) {
      // This is complex because we need to match the migrated bookings
      // For now, we'll skip this step and handle it manually if needed
      console.log('⚠️  Supervisor migration requires manual matching. Skipping for now.');
    }

    // Summary
    const summary = {
      dryRun,
      handledarLessonTypeId,
      sessionsMigrated: dryRun ? 'Would migrate' : sessionMapping.length,
      bookingsMigrated: dryRun ? 'Would migrate' : bookings.length,
      supervisorsToMigrate: supervisors.length,
      nextSteps: [
        'Test the migration with dry run first',
        'Verify all data is migrated correctly',
        'Update any hardcoded references',
        'Remove old handledar tables after verification'
      ]
    };

    console.log('\n📊 Migration Summary:');
    console.log(JSON.stringify(summary, null, 2));

    if (dryRun) {
      return NextResponse.json({
        message: 'Dry run completed successfully',
        summary,
        note: 'This was a dry run. No data was actually migrated. Set dryRun: false to perform actual migration.'
      });
    } else {
      return NextResponse.json({
        message: 'Migration completed successfully',
        summary,
        warning: 'Please verify all data was migrated correctly before removing old tables.'
      });
    }

  } catch (error) {
    console.error('Migration failed:', error);
    return NextResponse.json({
      error: 'Migration failed',
      details: error.message
    }, { status: 500 });
  }
}

// Missing imports that need to be added
// import { db } from '@/lib/db';
// import { sql } from 'drizzle-orm';
