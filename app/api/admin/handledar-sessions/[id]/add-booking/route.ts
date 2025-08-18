import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/jwt';
import { db } from '@/lib/db';
import { handledarSessions, handledarBookings, users, userCredits, siteSettings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { EmailService } from '@/lib/email/email-service';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value || cookieStore.get('auth-token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = await verifyToken(token);
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Access denied' }, { status: 403 });

    const { id: sessionId } = await params;
    const { supervisorName, supervisorEmail, supervisorPhone, studentId, sendPaymentEmail } = await request.json();
    if (!supervisorName) return NextResponse.json({ error: 'supervisorName required' }, { status: 400 });

    const [session] = await db
      .select({ id: handledarSessions.id, title: handledarSessions.title, date: handledarSessions.date, startTime: handledarSessions.startTime, endTime: handledarSessions.endTime, price: handledarSessions.pricePerParticipant, max: handledarSessions.maxParticipants, current: handledarSessions.currentParticipants })
      .from(handledarSessions)
      .where(eq(handledarSessions.id, sessionId));
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

    // Create booking
    const [created] = await db
      .insert(handledarBookings)
      .values({
        sessionId,
        studentId: studentId || null,
        supervisorName,
        supervisorEmail: supervisorEmail || null,
        supervisorPhone: supervisorPhone || null,
        price: session.price as any,
        paymentStatus: sendPaymentEmail ? 'pending' : 'paid',
        status: sendPaymentEmail ? 'pending' : 'confirmed',
        bookedBy: user.userId as any,
      })
      .returning();

    // Update participant counter
    await db
      .update(handledarSessions)
      .set({ currentParticipants: Number(session.current || 0) + 1, updatedAt: new Date() })
      .where(eq(handledarSessions.id, sessionId));

    // Optionally send Swish payment email
    if (sendPaymentEmail && supervisorEmail) {
      const swishNumber = process.env.NEXT_PUBLIC_SWISH_NUMBER || '';
      const amount = String(session.price || '');
      const message = `Handledar ${new Date(String(session.date)).toLocaleDateString('sv-SE')} ${String(session.startTime).slice(0,5)}`;
              const baseUrl = request.nextUrl.origin || process.env.NEXT_PUBLIC_APP_URL || 'https://www.dintrafikskolahlm.se';
      const landingUrl = `${baseUrl}/handledar/payment/${created.id}`;
      await EmailService.sendEmail({
        to: supervisorEmail,
        subject: 'Betalning för Handledarutbildning',
        html: `
          <p>Hej ${supervisorName},</p>
          <p>Du är bokad till handledarutbildningen "${session.title}" ${new Date(String(session.date)).toLocaleDateString('sv-SE')} kl ${String(session.startTime).slice(0,5)}-${String(session.endTime).slice(0,5)}.</p>
          <p>Vänligen betala ${amount} kr före kurstillfället. Använd länken nedan för betalning och detaljer:</p>
          <div style="text-align:center;margin:12px 0">
            <a href="${landingUrl}" style="background:#dc2626;color:white;padding:12px 18px;border-radius:10px;text-decoration:none;font-weight:700">Öppna betalningssida</a>
          </div>
          <p>Tack!</p>
        `,
        messageType: 'general',
        userId: studentId || null,
      });
    }

    // If marked paid, optionally credit handling is not required here.
    return NextResponse.json({ success: true, booking: created });
  } catch (error) {
    console.error('Error adding handledar booking:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


