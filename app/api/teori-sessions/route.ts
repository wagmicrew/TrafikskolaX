import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { eq, gte, and, sql } from 'drizzle-orm';

// Define the legacy Teori tables (these would need to be added to schema.ts)
const teoriLessonTypes = 'teori_lesson_types';
const teoriSessions = 'teori_sessions';
const teoriBookings = 'teori_bookings';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const scope = searchParams.get('scope') || 'future';
    const typeId = searchParams.get('typeId');
    const today = new Date().toISOString().split('T')[0];

    // Fetch Teori lesson types
    let lessonTypesQuery = `
      SELECT
        id,
        name,
        description,
        allows_supervisors,
        price,
        price_per_supervisor,
        duration_minutes,
        max_participants,
        is_active,
        sort_order
      FROM ${teoriLessonTypes}
      WHERE is_active = true
    `;

    if (typeId) {
      lessonTypesQuery += ` AND id = '${typeId}'`;
    }

    lessonTypesQuery += ` ORDER BY sort_order, name`;

    let lessonTypes;
    try {
      lessonTypes = await db.execute(sql.raw(lessonTypesQuery));
    } catch (error) {
      console.error('Error querying Teori lesson types:', error);
      return NextResponse.json({
        sessions: [],
        sessionsByType: [],
        totalAvailable: 0,
        lessonTypes: [],
        error: 'Teori tables not yet initialized. Please run the migration first.',
        needsSetup: true
      }, { status: 200 });
    }

    // Fetch Teori sessions with booking counts
    let sessionsQuery = `
      SELECT
        ts.id,
        ts.lesson_type_id,
        ts.title,
        ts.description,
        ts.date,
        ts.start_time,
        ts.end_time,
        ts.max_participants,
        ts.current_participants,
        ts.teacher_id,
        ts.is_active,
        tlt.name as lesson_type_name,
        tlt.description as lesson_type_description,
        tlt.allows_supervisors,
        tlt.price,
        tlt.price_per_supervisor,
        tlt.duration_minutes,
        COUNT(tb.id) as booked_count
      FROM ${teoriSessions} ts
      JOIN ${teoriLessonTypes} tlt ON ts.lesson_type_id = tlt.id
      LEFT JOIN ${teoriBookings} tb ON ts.id = tb.session_id AND tb.status != 'cancelled'
      WHERE ts.is_active = true
      AND tlt.is_active = true
    `;

    // Apply scope filter
    if (scope === 'future') {
      sessionsQuery += ` AND ts.date >= '${today}'`;
    }

    if (typeId) {
      sessionsQuery += ` AND ts.lesson_type_id = '${typeId}'`;
    }

    sessionsQuery += `
      GROUP BY ts.id, ts.lesson_type_id, ts.title, ts.description, ts.date,
               ts.start_time, ts.end_time, ts.max_participants, ts.current_participants,
               ts.teacher_id, ts.is_active, tlt.name, tlt.description, tlt.allows_supervisors,
               tlt.price, tlt.price_per_supervisor, tlt.duration_minutes
      ORDER BY ts.date, ts.start_time
    `;

    let sessions;
    try {
      sessions = await db.execute(sql.raw(sessionsQuery));
    } catch (error) {
      console.error('Error querying Teori sessions:', error);
      return NextResponse.json({
        sessions: [],
        sessionsByType: [],
        totalAvailable: 0,
        lessonTypes: [],
        error: 'Teori tables not yet initialized. Please run the migration first.',
        needsSetup: true
      }, { status: 200 });
    }

    // Process sessions to include availability information
    const processedSessions = (sessions.rows || []).map((session: any) => ({
      ...session,
      available_spots: session.max_participants - (session.current_participants || 0) - (session.booked_count || 0),
      is_available: (session.max_participants - (session.current_participants || 0) - (session.booked_count || 0)) > 0,
      type: 'teori',
      formatted_date_time: formatDateTime(session.date, session.start_time, session.end_time),
      price: parseFloat(session.price || 0),
      duration_minutes: session.duration_minutes || 60,
      allows_supervisors: session.allows_supervisors || false,
      price_per_supervisor: session.price_per_supervisor ? parseFloat(session.price_per_supervisor) : null,
    }));

    // Filter only available sessions
    const availableSessions = processedSessions.filter((session: any) => session.is_available);

    // Group by lesson type for better presentation
    const sessionsByType = availableSessions.reduce((acc: any, session: any) => {
      const typeId = session.lesson_type_id;
      if (!acc[typeId]) {
        acc[typeId] = {
          lessonType: {
            id: typeId,
            name: session.lesson_type_name,
            description: session.lesson_type_description,
            allows_supervisors: session.allows_supervisors,
            price: session.price,
            price_per_supervisor: session.price_per_supervisor,
            duration_minutes: session.duration_minutes,
            type: 'teori',
          },
          sessions: []
        };
      }
      acc[typeId].sessions.push(session);
      return acc;
    }, {});

    return NextResponse.json({
      sessions: availableSessions,
      sessionsByType: Object.values(sessionsByType),
      totalAvailable: availableSessions.length,
      lessonTypes: lessonTypes.rows
    });

  } catch (error) {
    console.error('Error fetching Teori sessions:', error);
    return NextResponse.json({
      error: 'Failed to fetch Teori sessions',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function formatDateTime(date: string, startTime: string, endTime: string): string {
  const dateObj = new Date(date);
  const formattedDate = dateObj.toLocaleDateString('sv-SE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `${formattedDate}, ${startTime?.slice(0, 5)} - ${endTime?.slice(0, 5)}`;
}
