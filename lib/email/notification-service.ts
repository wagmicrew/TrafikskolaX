import { db } from '@/lib/db';
import { users, bookings, packages, packagePurchases, handledarBookings } from '@/lib/db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import { EnhancedEmailService, type EmailContext } from './enhanced-email-service';
import { format, startOfDay, endOfDay } from 'date-fns';
import { sv } from 'date-fns/locale';

export class NotificationService {
  /**
   * Send new user registration notification
   */
  static async onUserRegistered(userId: string): Promise<boolean> {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId)
      });

      if (!user) return false;

      const context: EmailContext = {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        },
        customData: {
          registrationDate: format(new Date(), 'd MMMM yyyy', { locale: sv })
        }
      };

      return await EnhancedEmailService.sendTriggeredEmail('new_user', context);
    } catch (error) {
      console.error('Error in onUserRegistered:', error);
      return false;
    }
  }

  /**
   * Send new booking notification
   */
  static async onNewBooking(bookingId: string): Promise<boolean> {
    try {
      const booking = await db.query.bookings.findFirst({
        where: eq(bookings.id, bookingId),
        with: {
          user: true,
          lessonType: true
        }
      });

      if (!booking || !booking.user) return false;

      const context: EmailContext = {
        user: {
          id: booking.user.id,
          email: booking.user.email,
          firstName: booking.user.firstName,
          lastName: booking.user.lastName,
          role: booking.user.role
        },
        booking: {
          id: booking.id,
          scheduledDate: format(new Date(booking.scheduledDate), 'd MMMM yyyy', { locale: sv }),
          startTime: booking.startTime,
          endTime: booking.endTime,
          lessonTypeName: booking.lessonType?.name || 'Körlektion',
          totalPrice: booking.totalPrice.toString(),
          paymentMethod: booking.paymentMethod || undefined
        },
        customData: {
          needsPayment: booking.paymentStatus !== 'paid',
          paymentDeadline: format(
            new Date(new Date().setDate(new Date().getDate() + 2)), 
            'd MMMM yyyy', 
            { locale: sv }
          )
        }
      };

      return await EnhancedEmailService.sendTriggeredEmail('new_booking', context);
    } catch (error) {
      console.error('Error in onNewBooking:', error);
      return false;
    }
  }

  /**
   * Send booking confirmation notification
   */
  static async onBookingConfirmed(bookingId: string): Promise<boolean> {
    try {
      const booking = await db.query.bookings.findFirst({
        where: eq(bookings.id, bookingId),
        with: {
          user: true,
          lessonType: true,
          teacher: true
        }
      });

      if (!booking || !booking.user) return false;

      const context: EmailContext = {
        user: {
          id: booking.user.id,
          email: booking.user.email,
          firstName: booking.user.firstName,
          lastName: booking.user.lastName,
          role: booking.user.role
        },
        booking: {
          id: booking.id,
          scheduledDate: format(new Date(booking.scheduledDate), 'EEEE d MMMM yyyy', { locale: sv }),
          startTime: booking.startTime,
          endTime: booking.endTime,
          lessonTypeName: booking.lessonType?.name || 'Körlektion',
          totalPrice: booking.totalPrice.toString(),
          paymentMethod: booking.paymentMethod || undefined
        },
        teacher: booking.teacher ? {
          id: booking.teacher.id,
          email: booking.teacher.email,
          firstName: booking.teacher.firstName,
          lastName: booking.teacher.lastName
        } : undefined
      };

      return await EnhancedEmailService.sendTriggeredEmail('booking_confirmed', context);
    } catch (error) {
      console.error('Error in onBookingConfirmed:', error);
      return false;
    }
  }

  /**
   * Send payment needed notification
   */
  static async onPaymentNeeded(bookingId: string): Promise<boolean> {
    try {
      const booking = await db.query.bookings.findFirst({
        where: eq(bookings.id, bookingId),
        with: {
          user: true,
          lessonType: true
        }
      });

      if (!booking || !booking.user) return false;

      const context: EmailContext = {
        user: {
          id: booking.user.id,
          email: booking.user.email,
          firstName: booking.user.firstName,
          lastName: booking.user.lastName,
          role: booking.user.role
        },
        booking: {
          id: booking.id,
          scheduledDate: format(new Date(booking.scheduledDate), 'd MMMM yyyy', { locale: sv }),
          startTime: booking.startTime,
          endTime: booking.endTime,
          lessonTypeName: booking.lessonType?.name || 'Körlektion',
          totalPrice: booking.totalPrice.toString()
        },
        customData: {
          paymentDeadline: format(
            new Date(new Date().setDate(new Date().getDate() + 2)), 
            'd MMMM yyyy', 
            { locale: sv }
          )
        }
      };

      return await EnhancedEmailService.sendTriggeredEmail('payment_reminder', context);
    } catch (error) {
      console.error('Error in onPaymentNeeded:', error);
      return false;
    }
  }

  /**
   * Send payment confirmation
   */
  static async onPaymentConfirmed(
    paymentId: string, 
    paymentType: 'booking' | 'package' | 'handledar',
    amount: number
  ): Promise<boolean> {
    try {
      let user, bookingDetails, itemName, itemDescription, itemDate, itemTime;
      const formattedAmount = amount.toFixed(2);

      switch (paymentType) {
        case 'booking':
          const booking = await db.query.bookings.findFirst({
            where: eq(bookings.id, paymentId),
            with: {
              user: true,
              lessonType: true
            }
          });

          if (!booking || !booking.user) return false;

          user = booking.user;
          itemName = booking.lessonType?.name || 'Körlektion';
          itemDate = format(new Date(booking.scheduledDate), 'd MMMM yyyy', { locale: sv });
          itemTime = `${booking.startTime} - ${booking.endTime}`;
          break;

        case 'package':
          const packagePurchase = await db.query.packagePurchases.findFirst({
            where: eq(packagePurchases.id, paymentId),
            with: {
              user: true,
              package: true
            }
          });

          if (!packagePurchase || !packagePurchase.user || !packagePurchase.package) return false;

          user = packagePurchase.user;
          itemName = packagePurchase.package.name;
          itemDescription = packagePurchase.package.description || '';
          break;

        case 'handledar':
          const handledarBooking = await db.query.handledarBookings.findFirst({
            where: eq(handledarBookings.id, paymentId),
            with: {
              session: true
            }
          });

          if (!handledarBooking || !handledarBooking.studentId) return false;

          const userData = await db.query.users.findFirst({
            where: eq(users.id, handledarBooking.studentId)
          });

          if (!userData) return false;

          user = userData;
          itemName = handledarBooking.session?.title || 'Handledarutbildning';
          itemDate = handledarBooking.session?.date 
            ? format(new Date(handledarBooking.session.date), 'd MMMM yyyy', { locale: sv })
            : '';
          itemTime = handledarBooking.session?.startTime 
            ? `${handledarBooking.session.startTime} - ${handledarBooking.session.endTime}`
            : '';
          break;

        default:
          return false;
      }

      const context: EmailContext = {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        },
        customData: {
          amount: formattedAmount,
          paymentDate: format(new Date(), 'd MMMM yyyy', { locale: sv }),
          itemName,
          itemDescription,
          itemDate,
          itemTime
        }
      };

      return await EnhancedEmailService.sendTriggeredEmail('payment_confirmed', context);
    } catch (error) {
      console.error('Error in onPaymentConfirmed:', error);
      return false;
    }
  }

  /**
   * Send daily booking summary
   */
  static async sendDailyBookingSummary(): Promise<boolean> {
    try {
      const today = new Date();
      const startOfToday = startOfDay(today);
      const endOfToday = endOfDay(today);

      // Get all bookings for today
      const todaysBookings = await db.query.bookings.findMany({
        where: and(
          gte(bookings.scheduledDate, startOfToday.toISOString().split('T')[0]),
          lte(bookings.scheduledDate, endOfToday.toISOString().split('T')[0])
        ),
        with: {
          user: true,
          lessonType: true,
          teacher: true
        },
        orderBy: (bookings, { asc }) => [asc(bookings.startTime)]
      });

      if (todaysBookings.length === 0) {
        console.log('No bookings found for today');
        return true;
      }

      // Format booking details for the email
      const bookingDetails = todaysBookings.map(booking => ({
        time: `${booking.startTime} - ${booking.endTime}`,
        student: booking.user ? `${booking.user.firstName} ${booking.user.lastName}` : 'Gäst',
        type: booking.lessonType?.name || 'Körlektion',
        teacher: booking.teacher ? `${booking.teacher.firstName} ${booking.teacher.lastName}` : 'Ej tilldelad',
        status: booking.status,
        paymentStatus: booking.paymentStatus
      }));

      const context: EmailContext = {
        customData: {
          date: format(today, 'EEEE d MMMM yyyy', { locale: sv }),
          bookingCount: todaysBookings.length,
          bookingDetails: bookingDetails.map(b => ({
            ...b,
            status: this.translateStatus(b.status || ''),
            paymentStatus: this.translatePaymentStatus(b.paymentStatus || '')
          }))
        }
      };

      return await EnhancedEmailService.sendTriggeredEmail('teacher_daily_bookings', context);
    } catch (error) {
      console.error('Error in sendDailyBookingSummary:', error);
      return false;
    }
  }

  /**
   * Helper to translate status to Swedish
   */
  private static translateStatus(status: string): string {
    const translations: Record<string, string> = {
      'pending': 'Väntar på bekräftelse',
      'confirmed': 'Bekräftad',
      'completed': 'Genomförd',
      'cancelled': 'Inställd',
      'no_show': 'Inställd',
      'moved': 'Flyttad'
    };
    return translations[status] || status;
  }

  /**
   * Helper to translate payment status to Swedish
   */
  private static translatePaymentStatus(status: string): string {
    const translations: Record<string, string> = {
      'pending': 'Väntar på betalning',
      'paid': 'Betald',
      'failed': 'Misslyckad',
      'refunded': 'Återbetald',
      'partially_refunded': 'Delvis återbetald',
      'cancelled': 'Inställd'
    };
    return translations[status] || status;
  }
}
