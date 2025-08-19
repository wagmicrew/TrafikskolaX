import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/jwt';
import { db } from '@/lib/db';
import { handledarSessions, handledarBookings, users, userCredits, siteSettings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { EnhancedEmailService } from '@/lib/email/enhanced-email-service';

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

    // Send confirmation emails using trigger system
    const emailService = new EnhancedEmailService();
    
    // Send student confirmation if studentId exists
    if (studentId) {
      try {
        const student = await db.select().from(users).where(eq(users.id, studentId)).limit(1);
        if (student.length > 0) {
          await emailService.sendTemplatedEmail('handledar_student_confirmation', {
            user: {
              id: student[0].id,
              email: student[0].email,
              firstName: student[0].firstName || '',
              lastName: student[0].lastName || '',
              role: student[0].role || 'student'
            },
            booking: {
              id: created.id,
              scheduledDate: new Date(String(session.date)).toLocaleDateString('sv-SE'),
              startTime: String(session.startTime).slice(0,5),
              endTime: String(session.endTime).slice(0,5),
              title: session.title,
              supervisorName: supervisorName,
              price: String(session.price || ''),
              status: created.status,
              paymentStatus: created.paymentStatus
            }
          });
        }
      } catch (error) {
        console.error('Failed to send student confirmation email:', error);
      }
    }

    // Send supervisor confirmation
    if (supervisorEmail) {
      try {
        await emailService.sendTemplatedEmail('handledar_supervisor_confirmation', {
          supervisor: {
            name: supervisorName,
            email: supervisorEmail,
            phone: supervisorPhone || ''
          },
          booking: {
            id: created.id,
            scheduledDate: new Date(String(session.date)).toLocaleDateString('sv-SE'),
            startTime: String(session.startTime).slice(0,5),
            endTime: String(session.endTime).slice(0,5),
            title: session.title,
            supervisorName: supervisorName,
            price: String(session.price || ''),
            status: created.status,
            paymentStatus: created.paymentStatus
          }
        }, supervisorEmail);
      } catch (error) {
        console.error('Failed to send supervisor confirmation email:', error);
      }
    }

    // Send payment request if needed
    if (sendPaymentEmail && supervisorEmail) {
      try {
        const baseUrl = request.nextUrl.origin || process.env.NEXT_PUBLIC_APP_URL || 'https://www.dintrafikskolahlm.se';
        const landingUrl = `${baseUrl}/handledar/payment/${created.id}`;
        const swishNumber = process.env.NEXT_PUBLIC_SWISH_NUMBER || '';
        
        await emailService.sendTemplatedEmail('handledar_supervisor_payment_request', {
          supervisor: {
            name: supervisorName,
            email: supervisorEmail,
            phone: supervisorPhone || ''
          },
          booking: {
            id: created.id,
            scheduledDate: new Date(String(session.date)).toLocaleDateString('sv-SE'),
            startTime: String(session.startTime).slice(0,5),
            endTime: String(session.endTime).slice(0,5),
            title: session.title,
            supervisorName: supervisorName,
            price: String(session.price || ''),
            status: created.status,
            paymentStatus: created.paymentStatus
          },
          payment: {
            amount: String(session.price || ''),
            swishNumber: swishNumber,
            landingUrl: landingUrl,
            method: 'swish'
          }
        }, supervisorEmail);
      } catch (error) {
        console.error('Failed to send payment request email:', error);
      }
    }

    // If marked paid, optionally credit handling is not required here.
    return NextResponse.json({ success: true, booking: created });
  } catch (error) {
    console.error('Error adding handledar booking:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


