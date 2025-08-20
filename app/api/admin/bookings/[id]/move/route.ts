import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookings, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { verifyToken } from '@/lib/auth/jwt';
import { cookies } from 'next/headers';
import { sendEmail } from '@/lib/mailer/universal-mailer';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { scheduledDate, startTime, endTime } = body;

    if (!scheduledDate || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get the current booking
    const [currentBooking] = await db
      .select()
      .from(bookings)
      .leftJoin(users, eq(bookings.userId, users.id))
      .where(eq(bookings.id, id))
      .limit(1);

    if (!currentBooking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Update the booking
    await db
      .update(bookings)
      .set({
        scheduledDate: scheduledDate,
        startTime,
        endTime,
        updatedAt: new Date(),
      })
      .where(eq(bookings.id, id));

    // Send notification email to the user
    const userEmail = currentBooking.users?.email || currentBooking.bookings.guestEmail;
    const userName = currentBooking.users 
      ? `${currentBooking.users.firstName} ${currentBooking.users.lastName}`
      : currentBooking.bookings.guestName;

    if (userEmail) {
      await sendEmail({
        to: userEmail,
        subject: 'Din bokning har flyttats',
        html: `
          <h2>Hej ${userName || 'där'}!</h2>
          <p>Din bokning har flyttats till ett nytt datum och tid.</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Ny bokningstid:</h3>
            <p><strong>Datum:</strong> ${new Date(scheduledDate).toLocaleDateString('sv-SE')}</p>
            <p><strong>Tid:</strong> ${startTime} - ${endTime}</p>
          </div>
          
          <p>Om du har några frågor, vänligen kontakta oss.</p>
          
          <p>Med vänliga hälsningar,<br>Din Trafikskola HLM</p>
        `,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error moving booking:', error);
    return NextResponse.json(
      { error: 'Failed to move booking' },
      { status: 500 }
    );
  }
}
