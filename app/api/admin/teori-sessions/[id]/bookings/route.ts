import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAPI } from '@/lib/auth/server-auth';
import { db } from '@/lib/db';
import { teoriSessions, teoriBookings, users, teoriLessonTypes } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { EnhancedEmailService } from '@/lib/email/enhanced-email-service';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuthAPI();
  if (!auth.success) return NextResponse.json({ error: 'Unauthorized' }, { status: auth.status });
  if (auth.user.role !== 'admin') {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  const { id: sessionId } = await params;

  try {
    const {
      studentId,
      supervisorName,
      supervisorEmail,
      supervisorPhone,
      personalId,
      sendPaymentEmail
    } = await request.json();

    if (!supervisorName) {
      return NextResponse.json({ error: 'Handledare namn krävs' }, { status: 400 });
    }

    // Get session details with lesson type info
    const [session] = await db
      .select({
        id: teoriSessions.id,
        title: teoriSessions.title,
        date: teoriSessions.date,
        startTime: teoriSessions.startTime,
        endTime: teoriSessions.endTime,
        maxParticipants: teoriSessions.maxParticipants,
        currentParticipants: teoriSessions.currentParticipants,
        lessonTypeName: teoriLessonTypes.name,
        price: teoriLessonTypes.price,
        allowsSupervisors: teoriLessonTypes.allowsSupervisors
      })
      .from(teoriSessions)
      .leftJoin(teoriLessonTypes, eq(teoriSessions.lessonTypeId, teoriLessonTypes.id))
      .where(eq(teoriSessions.id, sessionId));

    if (!session) {
      return NextResponse.json({ error: 'Session hittades inte' }, { status: 404 });
    }

    // Check if session is full
    if (session.currentParticipants >= session.maxParticipants) {
      return NextResponse.json({ error: 'Sessionen är full' }, { status: 400 });
    }

    // Create booking
    const [created] = await db
      .insert(teoriBookings)
      .values({
        sessionId,
        studentId: studentId || null,
        supervisorName,
        supervisorEmail: supervisorEmail || null,
        supervisorPhone: supervisorPhone || null,
        personalId: personalId || null,
        paymentStatus: sendPaymentEmail ? 'pending' : 'paid',
        status: sendPaymentEmail ? 'pending' : 'confirmed',
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();

    // Update participant counter
    await db
      .update(teoriSessions)
      .set({
        currentParticipants: sql`${teoriSessions.currentParticipants} + 1`,
        updatedAt: new Date()
      })
      .where(eq(teoriSessions.id, sessionId));

    // Send confirmation emails
    try {
      const baseUrl = request.nextUrl.origin || process.env.NEXT_PUBLIC_APP_URL || 'https://www.dintrafikskolahlm.se';

      // Send student confirmation if studentId exists
      if (studentId) {
        const [student] = await db
          .select()
          .from(users)
          .where(eq(users.id, studentId))
          .limit(1);

        if (student) {
          await EnhancedEmailService.sendTriggeredEmail('teori_student_confirmation', {
            user: {
              id: student.id,
              email: student.email,
              firstName: student.firstName || '',
              lastName: student.lastName || '',
              role: student.role || 'student'
            },
            booking: {
              id: String(created.id),
              scheduledDate: new Date(String(session.date)).toLocaleDateString('sv-SE'),
              startTime: String(session.startTime).slice(0, 5),
              endTime: String(session.endTime).slice(0, 5),
              lessonTypeName: session.lessonTypeName,
              totalPrice: String(session.price || '')
            },
            customData: {
              supervisorName: supervisorName
            }
          });
        }
      }

      // Send supervisor confirmation
      if (supervisorEmail) {
        await EnhancedEmailService.sendTriggeredEmail('teori_supervisor_confirmation', {
          booking: {
            id: String(created.id),
            scheduledDate: new Date(String(session.date)).toLocaleDateString('sv-SE'),
            startTime: String(session.startTime).slice(0, 5),
            endTime: String(session.endTime).slice(0, 5),
            lessonTypeName: session.lessonTypeName,
            totalPrice: String(session.price || '')
          },
          customData: {
            supervisorEmail: supervisorEmail,
            supervisorName: supervisorName,
            supervisorPhone: supervisorPhone || ''
          }
        });
      }

      // Send payment request if needed
      if (sendPaymentEmail && supervisorEmail) {
        const paymentUrl = `${baseUrl}/teori/payment/${created.id}`;
        const swishNumber = process.env.NEXT_PUBLIC_SWISH_NUMBER || '';

        await EnhancedEmailService.sendTriggeredEmail('teori_supervisor_payment_request', {
          booking: {
            id: String(created.id),
            scheduledDate: new Date(String(session.date)).toLocaleDateString('sv-SE'),
            startTime: String(session.startTime).slice(0, 5),
            endTime: String(session.endTime).slice(0, 5),
            lessonTypeName: session.lessonTypeName,
            totalPrice: String(session.price || '')
          },
          customData: {
            supervisorEmail: supervisorEmail,
            supervisorName: supervisorName,
            supervisorPhone: supervisorPhone || '',
            amount: String(session.price || ''),
            swishNumber: swishNumber,
            paymentUrl: paymentUrl,
            method: 'swish'
          }
        });
      }
    } catch (emailError) {
      console.error('Failed to send confirmation emails:', emailError);
      // Don't fail the booking if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Deltagare tillagd!',
      booking: created
    });

  } catch (error) {
    console.error('Error adding teori participant:', error);
    return NextResponse.json({ error: 'Kunde inte lägga till deltagare' }, { status: 500 });
  }
}
