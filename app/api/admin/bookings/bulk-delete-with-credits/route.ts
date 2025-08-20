import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookings, userCredits, users } from '@/lib/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { requireAuthAPI } from '@/lib/auth/server-auth';
import { sendEmail } from '@/lib/mailer/universal-mailer';

export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireAuthAPI('admin');
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const user = authResult.user;

    const body = await request.json();
    const { bookingIds, reimburseCredits = true, sendEmails = true } = body;

    if (!bookingIds || !Array.isArray(bookingIds) || bookingIds.length === 0) {
      return NextResponse.json(
        { error: 'Booking IDs array is required' },
        { status: 400 }
      );
    }

    // Get all bookings with user details
    const bookingsToDelete = await db
      .select({
        id: bookings.id,
        userId: bookings.userId,
        scheduledDate: bookings.scheduledDate,
        startTime: bookings.startTime,
        endTime: bookings.endTime,
        lessonTypeId: bookings.lessonTypeId,
        totalPrice: bookings.totalPrice,
        status: bookings.status,
        paymentStatus: bookings.paymentStatus,
        isGuestBooking: bookings.isGuestBooking,
        guestName: bookings.guestName,
        guestEmail: bookings.guestEmail,
        userName: users.firstName,
        userLastName: users.lastName,
        userEmail: users.email
      })
      .from(bookings)
      .leftJoin(users, eq(bookings.userId, users.id))
      .where(inArray(bookings.id, bookingIds));

    if (bookingsToDelete.length === 0) {
      return NextResponse.json(
        { error: 'No bookings found to delete' },
        { status: 404 }
      );
    }

    // Group bookings by user for credit reimbursement
    const bookingsByUser = new Map();
    const guestBookings: any[] = [];

    bookingsToDelete.forEach(booking => {
      if (booking.userId && !booking.isGuestBooking) {
        if (!bookingsByUser.has(booking.userId)) {
          bookingsByUser.set(booking.userId, []);
        }
        bookingsByUser.get(booking.userId).push(booking);
      } else {
        guestBookings.push(booking);
      }
    });

    // Start database transaction
    const results = await db.transaction(async (tx) => {
      const deletionResults = [];

      // Process each user's bookings
      for (const [userId, userBookings] of bookingsByUser) {
        let creditsReimbursed = 0;

        // Reimburse credits if requested
        if (reimburseCredits) {
          for (const booking of userBookings) {
            if (booking.lessonTypeId) {
              // Add 1 credit for each booking
              await tx.insert(userCredits).values({
                userId: userId,
                lessonTypeId: booking.lessonTypeId,
                creditsRemaining: 1,
                creditsTotal: 1,
                creditType: 'lesson'
              });
              creditsReimbursed++;
            }
          }
        }

        // Delete user's bookings
        await tx.delete(bookings).where(
          inArray(bookings.id, userBookings.map((b: any) => b.id))
        );

        deletionResults.push({
          userId,
          bookingsDeleted: userBookings.length,
          creditsReimbursed,
          userEmail: userBookings[0].userEmail,
          userName: `${userBookings[0].userName} ${userBookings[0].userLastName}`
        });
      }

              // Delete guest bookings
        if (guestBookings.length > 0) {
          await tx.delete(bookings).where(
            inArray(bookings.id, guestBookings.map((b: any) => b.id))
          );

        deletionResults.push({
          guestBookings: guestBookings.length,
          guestEmails: guestBookings.map(b => b.guestEmail).filter(Boolean)
        });
      }

      return deletionResults;
    });

    // Send email notifications if requested
    if (sendEmails) {
      const emailPromises = [];

      // Send emails to registered users
      for (const result of results) {
        if (result.userId && result.userEmail) {
          const userBookings = bookingsToDelete.filter(b => b.userId === result.userId);
          
          const emailData = {
            to: result.userEmail,
            subject: 'Dina bokningar har avbokats',
            html: `
              <h2>Bokningar avbokade</h2>
              <p>Hej ${result.userName},</p>
              <p>Följande bokningar har avbokats av administratören:</p>
              <ul>
                ${userBookings.map(booking => `
                  <li>
                    <strong>${booking.scheduledDate} ${booking.startTime}-${booking.endTime}</strong><br>
                    Status: ${booking.status}<br>
                    Betalning: ${booking.paymentStatus}
                  </li>
                `).join('')}
              </ul>
                            ${(result.creditsReimbursed ?? 0) > 0 ?
                `<p><strong>${result.creditsReimbursed} kredit(er) har återbetalats till ditt konto.</strong></p>` :
                ''
              }
              <p>Du kan boka nya tider på vår hemsida.</p>
              <p>Med vänliga hälsningar,<br>Din Trafikskola Hässleholm</p>
            `,
            text: `
              Bokningar avbokade
              
              Hej ${result.userName},
              
              Följande bokningar har avbokats av administratören:
              ${userBookings.map(booking => `
                - ${booking.scheduledDate} ${booking.startTime}-${booking.endTime}
                  Status: ${booking.status}
                  Betalning: ${booking.paymentStatus}
              `).join('')}
              
                            ${(result.creditsReimbursed ?? 0) > 0 ?
                `${result.creditsReimbursed} kredit(er) har återbetalats till ditt konto.` :
                ''
              }
              
              Du kan boka nya tider på vår hemsida.
              
              Med vänliga hälsningar,
              Din Trafikskola Hässleholm
            `
          };

          emailPromises.push(sendEmail(emailData));
        }
      }

      // Send emails to guest users
      const guestResults = results.find(r => r.guestBookings);
      if (guestResults && guestResults.guestEmails) {
        for (const guestEmail of guestResults.guestEmails) {
          const guestBookings = bookingsToDelete.filter(b => b.guestEmail === guestEmail);
          
          const emailData = {
            to: guestEmail,
            subject: 'Din bokning har avbokats',
            html: `
              <h2>Bokning avbokad</h2>
              <p>Följande bokning har avbokats av administratören:</p>
              <ul>
                ${guestBookings.map(booking => `
                  <li>
                    <strong>${booking.scheduledDate} ${booking.startTime}-${booking.endTime}</strong><br>
                    Status: ${booking.status}<br>
                    Betalning: ${booking.paymentStatus}
                  </li>
                `).join('')}
              </ul>
              <p>Du kan boka nya tider på vår hemsida.</p>
              <p>Med vänliga hälsningar,<br>Din Trafikskola Hässleholm</p>
            `,
            text: `
              Bokning avbokad
              
              Följande bokning har avbokats av administratören:
              ${guestBookings.map(booking => `
                - ${booking.scheduledDate} ${booking.startTime}-${booking.endTime}
                  Status: ${booking.status}
                  Betalning: ${booking.paymentStatus}
              `).join('')}
              
              Du kan boka nya tider på vår hemsida.
              
              Med vänliga hälsningar,
              Din Trafikskola Hässleholm
            `
          };

          emailPromises.push(sendEmail(emailData));
        }
      }

      // Send all emails in parallel
      try {
        await Promise.all(emailPromises);
      } catch (emailError) {
        console.error('Failed to send some deletion emails:', emailError);
        // Don't fail the deletion if emails fail
      }
    }

    // Send notification email to admin
    try {
      const adminEmailData = {
        to: user.email,
        subject: 'Bokningar raderade av administratör',
        html: `
          <h2>Bokningar raderade</h2>
          <p>Du har raderat ${bookingsToDelete.length} bokningar:</p>
          <ul>
            ${bookingsToDelete.map(booking => `
              <li>
                <strong>${booking.scheduledDate} ${booking.startTime}-${booking.endTime}</strong><br>
                ${booking.userId ? `${booking.userName} ${booking.userLastName}` : `Gäst: ${booking.guestName}`}<br>
                Status: ${booking.status}<br>
                Betalning: ${booking.paymentStatus}
              </li>
            `).join('')}
          </ul>
          <p><strong>Raderad av:</strong> ${user.firstName} ${user.lastName}</p>
          <p><strong>Datum:</strong> ${new Date().toLocaleDateString('sv-SE')}</p>
        `,
        text: `
          Bokningar raderade
          
          Du har raderat ${bookingsToDelete.length} bokningar:
          ${bookingsToDelete.map(booking => `
            - ${booking.scheduledDate} ${booking.startTime}-${booking.endTime}
              ${booking.userId ? `${booking.userName} ${booking.userLastName}` : `Gäst: ${booking.guestName}`}
              Status: ${booking.status}
              Betalning: ${booking.paymentStatus}
          `).join('')}
          
          Raderad av: ${user.firstName} ${user.lastName}
          Datum: ${new Date().toLocaleDateString('sv-SE')}
        `
      };

      await sendEmail(adminEmailData);
    } catch (emailError) {
      console.error('Failed to send admin notification email:', emailError);
    }

    return NextResponse.json({
      success: true,
      message: 'Bookings deleted successfully',
      statistics: {
        totalBookingsDeleted: bookingsToDelete.length,
        userBookingsDeleted: bookingsByUser.size,
        guestBookingsDeleted: guestBookings.length,
        creditsReimbursed: results.reduce((sum, r) => sum + (r.creditsReimbursed || 0), 0),
        emailsSent: sendEmails ? results.length + guestBookings.length : 0
      },
      results
    });

  } catch (error) {
    console.error('Error deleting bookings:', error);
    return NextResponse.json(
      { error: 'Failed to delete bookings' },
      { status: 500 }
    );
  }
}

