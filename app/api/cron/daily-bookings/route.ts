import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookings, users } from '@/lib/db/schema';
import { and, eq, gte, lte, sql } from 'drizzle-orm';
import { sendMail } from '@/lib/mailer/universal-mailer';
import { format, startOfToday, endOfToday } from 'date-fns';
import { sv } from 'date-fns/locale';

// This endpoint should be protected and only callable by the cron job
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: Request) {
  try {
    // Verify the request is from our cron job
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      console.error('Unauthorized cron job attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = new Date();
    const todayStart = startOfToday();
    const todayEnd = endOfToday();

    // Get all bookings for today
    const todaysBookings = await db
      .select({
        id: bookings.id,
        startTime: bookings.startTime,
        endTime: bookings.endTime,
        status: bookings.status,
        paymentStatus: bookings.paymentStatus,
        student: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          phone: users.phone,
        },
        teacher: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        },
        lessonType: {
          name: sql<string>`lesson_types.name`,
        },
      })
      .from(bookings)
      .leftJoin(users, eq(bookings.userId, users.id))
      .leftJoin(users, eq(bookings.teacherId, users.id))
      .leftJoin(sql`lesson_types`, eq(bookings.lessonTypeId, sql`lesson_types.id`))
      .where(
        and(
          gte(bookings.scheduledDate, format(todayStart, 'yyyy-MM-dd')),
          lte(bookings.scheduledDate, format(todayEnd, 'yyyy-MM-dd')),
          eq(bookings.status, 'confirmed')
        )
      )
      .orderBy(bookings.startTime);

    if (todaysBookings.length === 0) {
      console.log('No bookings found for today');
      return NextResponse.json({ message: 'No bookings for today' });
    }

    // Group bookings by teacher
    const bookingsByTeacher = todaysBookings.reduce((acc, booking) => {
      if (!booking.teacher) return acc;
      
      const teacherId = booking.teacher.id;
      if (!acc[teacherId]) {
        acc[teacherId] = {
          teacher: booking.teacher,
          bookings: [],
        };
      }
      
      acc[teacherId].bookings.push(booking);
      return acc;
    }, {} as Record<string, { teacher: { id: string; firstName: string; lastName: string; email: string; }; bookings: typeof todaysBookings }>);

    // Send email to each teacher with their schedule
    const results = await Promise.all(
      Object.values(bookingsByTeacher).map(async ({ teacher, bookings }) => {
        try {
          const formattedDate = format(today, 'EEEE d MMMM yyyy', { locale: sv });
          const bookingList = bookings
            .map(
              (booking) => `
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">
                  ${booking.startTime} - ${booking.endTime}
                </td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">
                  ${booking.lessonType?.name || 'Körlektion'}
                </td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">
                  ${booking.student ? `${booking.student.firstName} ${booking.student.lastName}` : 'Okänd student'}
                </td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">
                  <a href="tel:${booking.student?.phone || ''}">${booking.student?.phone || '-'}</a>
                </td>
              </tr>
            `
            )
            .join('');

          const emailContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #1a365d;">Dagens schema - ${formattedDate}</h2>
              <p>Hej ${teacher.firstName},</p>
              <p>Här är dina bokade lektioner för idag:</p>
              
              <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <thead>
                  <tr style="background-color: #f2f2f2;">
                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Tid</th>
                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Typ</th>
                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Elev</th>
                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Telefon</th>
                  </tr>
                </thead>
                <tbody>
                  ${bookingList}
                </tbody>
              </table>
              
              <p>Lycka till med dagens lektioner!</p>
              
              <p>Med vänliga hälsningar,<br>
              Din Trafikskola HLM</p>
              
              <p style="font-size: 12px; color: #666; margin-top: 30px;">
                Detta är ett automatiskt meddelande. Svara inte på detta e-postmeddelande.
              </p>
            </div>
          `;

          await sendMail({
            to: teacher.email,
            subject: `Dagens schema - ${formattedDate}`,
            html: emailContent,
          });

          return { success: true, teacherId: teacher.id, email: teacher.email };
        } catch (error) {
          console.error(`Failed to send daily summary to ${teacher.email}:`, error);
          return { success: false, teacherId: teacher.id, email: teacher.email, error: error instanceof Error ? error.message : 'Unknown error' };
        }
      })
    );

    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;

    return NextResponse.json({
      success: true,
      message: `Sent daily booking summary to ${successCount} of ${totalCount} teachers`,
      details: results,
    });
  } catch (error) {
    console.error('Error in daily bookings cron job:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process daily bookings' },
      { status: 500 }
    );
  }
}
