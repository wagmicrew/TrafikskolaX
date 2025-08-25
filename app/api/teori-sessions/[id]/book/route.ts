import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth/jwt';
import { v4 as uuidv4 } from 'uuid';
import { eq, sql } from 'drizzle-orm';
import crypto from 'crypto';

// Encryption function for personal IDs
function encryptPersonalId(personalId: string): string {
  const algorithm = 'aes-256-gcm';
  const key = process.env.ENCRYPTION_KEY || 'fallback-key-32-characters-long';
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipher(algorithm, key);
  let encrypted = cipher.update(personalId, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return encrypted;
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      supervisorName,
      supervisorEmail,
      supervisorPhone,
      personalId,
      supervisorCount = 1,
      paymentMethod = 'pending',
      guestName,
      guestEmail,
      guestPhone,
    } = body;

    let userId: string | null = null;
    let isGuestBooking = true;
    let currentUserId = null;
    let currentUserRole = null;

    // Check if user is logged in
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token');

    if (token) {
      try {
        const payload = await verifyToken(token.value);
        userId = payload.id;
        currentUserId = payload.id;
        currentUserRole = payload.role;
        isGuestBooking = false;
      } catch (error) {
        console.error('Token verification failed:', error);
      }
    }

    // Check if Teori session exists and has available spots
    const sessionCheckQuery = `
      SELECT
        ts.*,
        tlt.name as lesson_type_name,
        tlt.description as lesson_type_description,
        tlt.allows_supervisors,
        tlt.price,
        tlt.price_per_supervisor,
        tlt.duration_minutes,
        COUNT(tb.id) as booked_count
      FROM teori_sessions ts
      JOIN teori_lesson_types tlt ON ts.lesson_type_id = tlt.id
      LEFT JOIN teori_bookings tb ON ts.id = tb.session_id AND tb.status != 'cancelled'
      WHERE ts.id = '${id}' AND ts.is_active = true AND tlt.is_active = true
      GROUP BY ts.id, tlt.id
    `;

    const sessionResult = await db.execute(sql.raw(sessionCheckQuery));

    if (!sessionResult.rows.length) {
      return NextResponse.json({ error: 'Session not found or not active' }, { status: 404 });
    }

    const session = sessionResult.rows[0];
    const availableSpots = session.max_participants - (session.current_participants || 0) - (session.booked_count || 0);

    if (availableSpots <= 0) {
      return NextResponse.json({ error: 'Session is fully booked' }, { status: 400 });
    }

    // Calculate price
    let price = parseFloat(session.price);
    let supervisorPrice = 0;

    if (session.allows_supervisors && supervisorCount > 1) {
      const additionalSupervisors = supervisorCount - 1;
      supervisorPrice = additionalSupervisors * (session.price_per_supervisor || 500);
      price += supervisorPrice;
    }

    // Encrypt personal ID if provided
    let encryptedPersonalId = null;
    if (personalId && session.allows_supervisors) {
      encryptedPersonalId = encryptPersonalId(personalId);
    }

    // Determine participant details
    let participantName = '';
    let participantEmail = '';
    let participantPhone = '';

    if (session.allows_supervisors && supervisorName) {
      participantName = supervisorName;
      participantEmail = supervisorEmail || '';
      participantPhone = supervisorPhone || '';
    } else if (isGuestBooking) {
      participantName = guestName || '';
      participantEmail = guestEmail || '';
      participantPhone = guestPhone || '';
    }

    // Validate required fields
    if (!participantName || !participantEmail) {
      return NextResponse.json({
        error: 'Namn och e-post krävs för bokning'
      }, { status: 400 });
    }

    // Create booking
    const bookingInsertQuery = `
      INSERT INTO teori_bookings (
        session_id,
        student_id,
        status,
        price,
        payment_status,
        payment_method,
        swish_uuid,
        booked_by,
        supervisor_name,
        supervisor_email,
        supervisor_phone
      ) VALUES (
        '${id}',
        ${userId ? `'${userId}'` : 'NULL'},
        'pending',
        ${price},
        '${paymentMethod === 'credits' ? 'paid' : 'pending'}',
        '${paymentMethod}',
        '${uuidv4()}',
        ${currentUserId ? `'${currentUserId}'` : 'NULL'},
        '${participantName.replace(/'/g, "''")}',
        '${participantEmail.replace(/'/g, "''")}',
        '${participantPhone.replace(/'/g, "''")}'
      ) RETURNING id
    `;

    const bookingResult = await db.execute(sql.raw(bookingInsertQuery));
    const bookingId = bookingResult.rows[0].id;

    // Create supervisor record if personal ID is provided
    if (encryptedPersonalId) {
      const supervisorInsertQuery = `
        INSERT INTO teori_supervisors (
          teori_booking_id,
          supervisor_name,
          supervisor_email,
          supervisor_phone,
          supervisor_personal_number,
          price
        ) VALUES (
          '${bookingId}',
          '${participantName.replace(/'/g, "''")}',
          '${participantEmail.replace(/'/g, "''")}',
          '${participantPhone.replace(/'/g, "''")}',
          '${encryptedPersonalId}',
          ${supervisorPrice}
        )
      `;

      await db.execute(sql.raw(supervisorInsertQuery));
    }

    // Update session participant count
    const updateQuery = `
      UPDATE teori_sessions
      SET current_participants = current_participants + 1,
          updated_at = NOW()
      WHERE id = '${id}'
    `;

    await db.execute(sql.raw(updateQuery));

    return NextResponse.json({
      booking: {
        id: bookingId,
        sessionId: id,
        studentId: userId,
        status: paymentMethod === 'credits' ? 'confirmed' : 'pending',
        price: price,
        supervisorName: participantName,
        supervisorEmail: participantEmail,
        supervisorPhone: participantPhone,
      },
      message: 'Teori session bokad framgångsrikt',
      sessionInfo: {
        title: session.title,
        date: session.date,
        startTime: session.start_time,
        endTime: session.end_time,
        lessonType: session.lesson_type_name
      }
    });

  } catch (error) {
    console.error('Error creating Teori session booking:', error);
    return NextResponse.json({
      error: 'Failed to create booking',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
