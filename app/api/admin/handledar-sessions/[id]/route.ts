import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { handledarSessions, handledarBookings, users, userCredits } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { EmailService } from '@/lib/email/email-service';
import { requireAuthAPI } from '@/lib/auth/server-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuthAPI();
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    if (auth.user.role !== 'admin' && auth.user.role !== 'teacher') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { id: sessionId } = await params;

    // Get session details
    const session = await db
      .select({
        id: handledarSessions.id,
        title: handledarSessions.title,
        description: handledarSessions.description,
        date: handledarSessions.date,
        startTime: handledarSessions.startTime,
        endTime: handledarSessions.endTime,
        maxParticipants: handledarSessions.maxParticipants,
        currentParticipants: handledarSessions.currentParticipants,
        pricePerParticipant: handledarSessions.pricePerParticipant,
        teacherId: handledarSessions.teacherId,
        teacherName: users.firstName,
        teacherLastName: users.lastName,
        isActive: handledarSessions.isActive,
        createdAt: handledarSessions.createdAt,
      })
      .from(handledarSessions)
      .leftJoin(users, eq(handledarSessions.teacherId, users.id))
      .where(eq(handledarSessions.id, sessionId))
      .limit(1);

    if (session.length === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Get bookings for this session
    const bookings = await db
      .select({
        id: handledarBookings.id,
        supervisorName: handledarBookings.supervisorName,
        supervisorEmail: handledarBookings.supervisorEmail,
        supervisorPhone: handledarBookings.supervisorPhone,
        price: handledarBookings.price,
        paymentStatus: handledarBookings.paymentStatus,
        paymentMethod: handledarBookings.paymentMethod,
        status: handledarBookings.status,
        reminderSent: handledarBookings.reminderSent,
        createdAt: handledarBookings.createdAt,
        studentName: users.firstName,
        studentLastName: users.lastName,
        studentEmail: users.email,
      })
      .from(handledarBookings)
      .leftJoin(users, eq(handledarBookings.studentId, users.id))
      .where(eq(handledarBookings.sessionId, sessionId));

    const sessionData = {
      ...session[0],
      teacherName: session[0].teacherName && session[0].teacherLastName 
        ? `${session[0].teacherName} ${session[0].teacherLastName}` 
        : 'Ingen lärare tilldelad',
      // Exclude temporary placeholders from participant count
      spotsLeft: Number(session[0].maxParticipants) - (bookings.filter(b => b.supervisorName !== 'Temporary').length),
      bookings: bookings.map(booking => ({
        ...booking,
        studentName: booking.studentName && booking.studentLastName 
          ? `${booking.studentName} ${booking.studentLastName}` 
          : null,
      })),
    };

    return NextResponse.json({ session: sessionData });
  } catch (error) {
    console.error('Error fetching handledar session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuthAPI('admin');
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id: sessionId } = await params;
    const body = await request.json();
    const { title, description, date, startTime, endTime, maxParticipants, pricePerParticipant, teacherId } = body;

    const updatedSession = await db
      .update(handledarSessions)
      .set({
        title,
        description,
        date,
        startTime,
        endTime,
        maxParticipants: parseInt(maxParticipants),
        pricePerParticipant: String(parseFloat(pricePerParticipant)),
        teacherId: teacherId || null,
        updatedAt: new Date(),
      })
      .where(eq(handledarSessions.id, sessionId))
      .returning();

    if (updatedSession.length === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      message: 'Session updated successfully', 
      session: updatedSession[0] 
    });
  } catch (error) {
    console.error('Error updating handledar session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuthAPI('admin');
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id: sessionId } = await params;

    // Load session details for email context
    const [session] = await db
      .select({
        id: handledarSessions.id,
        title: handledarSessions.title,
        date: handledarSessions.date,
        startTime: handledarSessions.startTime,
        endTime: handledarSessions.endTime,
      })
      .from(handledarSessions)
      .where(eq(handledarSessions.id, sessionId));

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Fetch all bookings for the session
    const bookings = await db
      .select({
        id: handledarBookings.id,
        studentId: handledarBookings.studentId,
        supervisorName: handledarBookings.supervisorName,
        supervisorEmail: handledarBookings.supervisorEmail,
        supervisorPhone: handledarBookings.supervisorPhone,
        price: handledarBookings.price,
        paymentStatus: handledarBookings.paymentStatus,
        bookedBy: handledarBookings.bookedBy,
        createdAt: handledarBookings.createdAt,
        studentEmail: users.email,
        studentFirst: users.firstName,
        studentLast: users.lastName,
      })
      .from(handledarBookings)
      .leftJoin(users, eq(handledarBookings.studentId, users.id))
      .where(eq(handledarBookings.sessionId, sessionId));

    let emailsSent = 0;
    let creditsGranted = 0;

    for (const b of bookings) {
      try {
        const hasStudent = !!b.studentId;
        const studentName = [b.studentFirst, b.studentLast].filter(Boolean).join(' ').trim();
        const studentEmail = (b.studentEmail || '').trim();
        const supervisorEmail = (b.supervisorEmail || '').trim();

        // Grant handledar credit to student when applicable
        if (hasStudent && b.studentId) {
          // Try find existing handledar credit row
          const existing = await db
            .select({ id: userCredits.id, creditsRemaining: userCredits.creditsRemaining, creditsTotal: userCredits.creditsTotal })
            .from(userCredits)
            .where(
              and(
                eq(userCredits.userId, b.studentId),
                eq(userCredits.creditType, 'handledar' as any)
              )
            )
            .limit(1);
          if (existing.length > 0) {
            await db
              .update(userCredits)
              .set({
                creditsRemaining: (Number(existing[0].creditsRemaining || 0) + 1) as any,
                creditsTotal: (Number(existing[0].creditsTotal || 0) + 1) as any,
                updatedAt: new Date(),
              })
              .where(eq(userCredits.id, (existing[0] as any).id));
          } else {
            await db.insert(userCredits).values({
              userId: b.studentId,
              lessonTypeId: null,
              handledarSessionId: null,
              creditsRemaining: 1,
              creditsTotal: 1,
              creditType: 'handledar' as any,
              createdAt: new Date(),
              updatedAt: new Date(),
            } as any);
          }
          creditsGranted++;
        }

        // Build recipients and email content
        const recipients: string[] = [];
        if (hasStudent && studentEmail) recipients.push(studentEmail);
        if (supervisorEmail && (!hasStudent || supervisorEmail.toLowerCase() !== studentEmail.toLowerCase())) {
          recipients.push(supervisorEmail);
        }

        const when = `${new Date(String(session.date)).toLocaleDateString('sv-SE')} kl ${String(session.startTime).slice(0,5)}-${String(session.endTime).slice(0,5)}`;
        const subject = 'Handledarutbildning inställd';
        const bodyForStudent = `
          <p>Hej ${studentName || 'deltagare'},</p>
          <p>Din anmälda handledarutbildning (${session.title}) ${when} har tyvärr blivit inställd.</p>
          <p>Vi har lagt till en handledarkredit på ditt konto så att du kan boka om utan kostnad.</p>
          <p>Besök vår sida för att boka en ny tid.</p>
        `;
        const bodyForSupervisor = `
          <p>Hej ${b.supervisorName || ''},</p>
          <p>Din anmälda handledarutbildning (${session.title}) ${when} har tyvärr blivit inställd.</p>
          <p>Vänligen kontakta skolan för ombokning eller återbetalning.</p>
        `;

        if (recipients.length > 0) {
          // If has student, prefer student wording; otherwise supervisor wording
          const html = hasStudent ? bodyForStudent : bodyForSupervisor;
          await EmailService.sendEmail({
            to: recipients.join(','),
            subject,
            html,
            messageType: 'general',
            userId: hasStudent ? (b.studentId as any) : null,
          });
          emailsSent += recipients.length;
        }

        // Remove the booking after notifying
        await db.delete(handledarBookings).where(eq(handledarBookings.id, b.id));
      } catch (err) {
        console.error('Failed to process booking cancellation', b.id, err);
      }
    }

    // Soft delete the session
    await db
      .update(handledarSessions)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(handledarSessions.id, sessionId));

    return NextResponse.json({ message: 'Session cancelled and removed', emailsSent, creditsGranted });
  } catch (error) {
    console.error('Error deleting handledar session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
