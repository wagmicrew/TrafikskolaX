import { db } from '@/lib/db';
import { bookings, users, lessonTypes, userCredits } from '@/lib/db/schema';
import { eq, and, gte, lte, gt, lt, sql } from 'drizzle-orm';
import { EnhancedEmailService } from './enhanced-email-service';
import { format, addDays, subDays, startOfDay, endOfDay } from 'date-fns';

export class EmailCronService {
  /**
   * Send booking reminders for lessons happening tomorrow
   */
  static async sendBookingReminders() {
    try {
      const tomorrow = addDays(new Date(), 1);
      const tomorrowStart = startOfDay(tomorrow);
      const tomorrowEnd = endOfDay(tomorrow);

      // Get all confirmed bookings for tomorrow
      const tomorrowBookings = await db.query.bookings.findMany({
        where: and(
          eq(bookings.status, 'confirmed'),
          eq(bookings.paymentStatus, 'paid'),
          gte(bookings.scheduledDate, tomorrowStart.toISOString()),
          lte(bookings.scheduledDate, tomorrowEnd.toISOString())
        ),
        with: {
          user: true,
          lessonType: true
        }
      });

      // Send reminder for each booking
      for (const booking of tomorrowBookings) {
        if (!booking.user) continue;

        const emailContext = {
          user: {
            id: booking.user.id,
            email: booking.user.email,
            firstName: booking.user.firstName,
            lastName: booking.user.lastName,
            role: booking.user.role
          },
          booking: {
            id: booking.id,
            scheduledDate: format(new Date(booking.scheduledDate), 'yyyy-MM-dd'),
            startTime: booking.startTime,
            endTime: booking.endTime,
            lessonTypeName: booking.lessonType?.name || 'Unknown',
            totalPrice: booking.totalPrice.toString()
          }
        };

        await EnhancedEmailService.sendTriggeredEmail('booking_reminder', emailContext);
      }

      console.log(`Sent ${tomorrowBookings.length} booking reminders`);
    } catch (error) {
      console.error('Error sending booking reminders:', error);
    }
  }

  /**
   * Send daily booking summary to teachers
   */
  static async sendTeacherDailyBookings() {
    try {
      const today = new Date();
      const todayStart = startOfDay(today);
      const todayEnd = endOfDay(today);

      // Get all teachers
      const teachers = await db.query.users.findMany({
        where: eq(users.role, 'teacher')
      });

      for (const teacher of teachers) {
        // Get teacher's bookings for today
        const teacherBookings = await db.query.bookings.findMany({
          where: and(
            eq(bookings.teacherId, teacher.id),
            eq(bookings.status, 'confirmed'),
            gte(bookings.scheduledDate, todayStart.toISOString()),
            lte(bookings.scheduledDate, todayEnd.toISOString())
          ),
          with: {
            user: true,
            lessonType: true
          },
          orderBy: (bookings, { asc }) => [asc(bookings.startTime)]
        });

        if (teacherBookings.length === 0) continue;

        // Build bookings list HTML
        let bookingsList = '<ul>';
        for (const booking of teacherBookings) {
          bookingsList += `
            <li>
              <strong>${booking.startTime} - ${booking.endTime}</strong><br>
              Student: ${booking.user?.firstName} ${booking.user?.lastName}<br>
              Lektion: ${booking.lessonType?.name}<br>
              Växellåda: ${booking.transmissionType === 'manual' ? 'Manuell' : 'Automat'}
            </li>
          `;
        }
        bookingsList += '</ul>';

        const emailContext = {
          teacher: {
            id: teacher.id,
            email: teacher.email,
            firstName: teacher.firstName,
            lastName: teacher.lastName
          },
          customData: {
            currentDate: format(today, 'yyyy-MM-dd'),
            bookingsList
          }
        };

        await EnhancedEmailService.sendTriggeredEmail('teacher_daily_bookings', emailContext);
      }

      console.log(`Sent daily bookings to ${teachers.length} teachers`);
    } catch (error) {
      console.error('Error sending teacher daily bookings:', error);
    }
  }

  /**
   * Send credit reminders to students who have credits but haven't booked
   */
  static async sendCreditReminders() {
    try {
      // Find students with credits who haven't booked in 30 days
      const thirtyDaysAgo = subDays(new Date(), 30);
      
      const studentsWithCredits = await db
        .select({
          userId: userCredits.userId,
          totalCredits: sql<number>`sum(${userCredits.creditsRemaining})`,
          user: users
        })
        .from(userCredits)
        .innerJoin(users, eq(userCredits.userId, users.id))
        .where(gt(userCredits.creditsRemaining, 0))
        .groupBy(userCredits.userId, users.id)
        .having(sql`sum(${userCredits.creditsRemaining}) > 0`);

      for (const record of studentsWithCredits) {
        if (!record.user) continue;

        // Check last booking
        const lastBooking = await db.query.bookings.findFirst({
          where: eq(bookings.userId, record.userId),
          orderBy: (bookings, { desc }) => [desc(bookings.createdAt)]
        });

        // Skip if booked recently
        if (lastBooking && new Date(lastBooking.createdAt) > thirtyDaysAgo) {
          continue;
        }

        const emailContext = {
          user: {
            id: record.user.id,
            email: record.user.email,
            firstName: record.user.firstName,
            lastName: record.user.lastName,
            role: record.user.role
          },
          customData: {
            creditsRemaining: record.totalCredits.toString()
          }
        };

        await EnhancedEmailService.sendTriggeredEmail('credits_reminder', emailContext);
      }

      console.log('Credit reminders sent');
    } catch (error) {
      console.error('Error sending credit reminders:', error);
    }
  }

  /**
   * Send feedback reminders to teachers for completed bookings
   */
  static async sendTeacherFeedbackReminders() {
    try {
      const threeDaysAgo = subDays(new Date(), 3);
      
      // Find completed bookings without feedback
      const bookingsNeedingFeedback = await db.query.bookings.findMany({
        where: and(
          eq(bookings.isCompleted, true),
          eq(bookings.feedbackReady, false),
          lte(bookings.completedAt, threeDaysAgo)
        ),
        with: {
          user: true,
          teacher: true,
          lessonType: true
        }
      });

      // Group by teacher
      const bookingsByTeacher = bookingsNeedingFeedback.reduce((acc, booking) => {
        if (!booking.teacher) return acc;
        
        const teacherId = booking.teacher.id;
        if (!acc[teacherId]) {
          acc[teacherId] = {
            teacher: booking.teacher,
            bookings: []
          };
        }
        acc[teacherId].bookings.push(booking);
        return acc;
      }, {} as Record<string, { teacher: any; bookings: any[] }>);

      // Send reminder to each teacher
      for (const [teacherId, data] of Object.entries(bookingsByTeacher)) {
        const emailContext = {
          teacher: {
            id: data.teacher.id,
            email: data.teacher.email,
            firstName: data.teacher.firstName,
            lastName: data.teacher.lastName
          },
          customData: {
            bookingCount: data.bookings.length.toString(),
            bookingsList: data.bookings.map(b => 
              `${b.user?.firstName} ${b.user?.lastName} - ${format(new Date(b.scheduledDate), 'yyyy-MM-dd')}`
            ).join(', ')
          }
        };

        await EnhancedEmailService.sendTriggeredEmail('teacher_feedback_reminder', emailContext);
      }

      console.log(`Sent feedback reminders to ${Object.keys(bookingsByTeacher).length} teachers`);
    } catch (error) {
      console.error('Error sending teacher feedback reminders:', error);
    }
  }
}
