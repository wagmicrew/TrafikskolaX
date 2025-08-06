import { NextResponse } from 'next/server';
import { requireAuthAPI } from '@/lib/auth/server-auth';
import { db } from '@/lib/db';
import { bookings, siteSettings, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { sendEmail } from '@/lib/email/sendEmail';
import { createBookingConfirmationTemplate } from '@/lib/email/templates/booking-confirmation-template';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';

export async function POST(request: Request) {
  try {
    const user = await requireAuthAPI('admin');

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { bookingId, sendEmail = true } = body;

    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 });
    }

    // Get booking from database
    const bookingResult = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, bookingId))
      .limit(1);

    if (bookingResult.length === 0) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const booking = bookingResult[0];

    // Get student information
    const studentData = await db
      .select()
      .from(users)
      .where(eq(users.id, booking.userId as string))
      .limit(1);

    if (studentData.length === 0 && !booking.isGuestBooking) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const student = booking.isGuestBooking ? 
      {
        firstName: booking.guestName?.split(' ')[0] || 'Guest',
        lastName: booking.guestName?.split(' ').slice(1).join(' ') || 'User',
        email: booking.guestEmail || ''
      } : 
      studentData[0];

    // Update booking status to confirmed
    await db
      .update(bookings)
      .set({ 
        status: 'confirmed',
        updatedAt: new Date()
      })
      .where(eq(bookings.id, bookingId));

    // If sendEmail is true, send confirmation to student
    if (sendEmail) {
      // Get email settings from database
      const settingsRows = await db
        .select()
        .from(siteSettings)
        .where(
          eq(siteSettings.category, 'email')
        );

      const settings = settingsRows.reduce((acc, row) => {
        acc[row.key] = row.value;
        return acc;
      }, {} as Record<string, string>);

      // Get school contact info
      const contactSettingsRows = await db
        .select()
        .from(siteSettings)
        .where(
          eq(siteSettings.key, 'school_contact_email')
        );

      // Format the booking date and time
      const bookingDate = format(new Date(booking.scheduledDate), 'EEEE d MMMM yyyy', { locale: sv });
      const startTime = booking.startTime.slice(0, 5); // Format HH:MM
      const endTime = booking.endTime.slice(0, 5); // Format HH:MM

      // Get teacher info if available
      let teacherName = '';
      if (booking.teacherId) {
        const teacherData = await db
          .select()
          .from(users)
          .where(eq(users.id, booking.teacherId))
          .limit(1);

        if (teacherData.length > 0) {
          teacherName = `${teacherData[0].firstName} ${teacherData[0].lastName}`;
        }
      }

      // Create email content
      const { htmlContent, textContent } = createBookingConfirmationTemplate({
        recipientName: `${student.firstName}`,
        bookingDetails: {
          lessonType: booking.lessonTypeId, // This would ideally be the lesson type name, not ID
          date: bookingDate,
          time: `${startTime} - ${endTime}`,
          duration: booking.durationMinutes,
          price: `${booking.totalPrice}`,
          teacherName: teacherName || undefined
        },
        schoolDetails: {
          name: settings.from_name || 'Din Trafikskola',
          contactEmail: settings.school_contact_email || settings.from_email || 'noreply@dintrafikskolahlm.se',
          contactName: settings.school_contact_name || undefined,
          phone: settings.school_phone || undefined
        },
        bookingId: booking.id,
        paymentStatus: booking.paymentStatus || 'unpaid'
      });

      // Send confirmation email
      await sendEmail(student.email, 'Bokningsbekräftelse', {
        title: 'Bokningsbekräftelse',
        body: htmlContent
      });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Booking confirmed successfully',
      booking: {
        id: booking.id,
        status: 'confirmed',
        emailSent: sendEmail
      }
    });
  } catch (error: any) {
    console.error('Error confirming booking:', error);
    return NextResponse.json(
      { 
        error: 'Failed to confirm booking',
        details: error.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}
