import { EnhancedEmailService, EmailTriggerType } from './enhanced-email-service';
import { logger } from '@/lib/logging/logger';

interface BookingEmailContext {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  booking: {
    id: string;
    scheduledDate: string;
    startTime: string;
    endTime: string;
    lessonTypeName: string;
    totalPrice: string;
    paymentMethod?: string;
    swishUUID?: string;
    paymentTime?: string;
  };
}

export async function sendBookingConfirmationEmail(context: BookingEmailContext): Promise<boolean> {
  try {
    logger.info('email', 'Sending booking confirmation email', {
      userId: context.user.id,
      bookingId: context.booking.id
    });

    const success = await EnhancedEmailService.sendTriggeredEmail(
      'booking_confirmed' as EmailTriggerType,
      {
        user: {
          id: context.user.id,
          email: context.user.email,
          firstName: context.user.firstName,
          lastName: context.user.lastName,
          role: context.user.role
        },
        booking: {
          id: context.booking.id,
          scheduledDate: context.booking.scheduledDate,
          startTime: context.booking.startTime,
          endTime: context.booking.endTime,
          lessonTypeName: context.booking.lessonTypeName,
          totalPrice: context.booking.totalPrice,
          paymentMethod: context.booking.paymentMethod
        }
      }
    );

    if (!success) {
      logger.error('email', 'Failed to send booking confirmation email', {
        userId: context.user.id,
        bookingId: context.booking.id
      });
    }

    return success;
  } catch (error) {
    logger.error('email', 'Error sending booking confirmation email', {
      error: error.message,
      userId: context.user.id,
      bookingId: context.booking.id
    });
    return false;
  }
}

export async function sendSwishPaymentConfirmationEmail(context: BookingEmailContext): Promise<boolean> {
  try {
    logger.info('email', 'Sending Swish payment confirmation email to admin', {
      bookingId: context.booking.id,
      swishRef: context.booking.swishUUID
    });

    const success = await EnhancedEmailService.sendTriggeredEmail(
      'payment_confirmed' as EmailTriggerType,
      {
        user: {
          id: context.user.id,
          email: context.user.email,
          firstName: context.user.firstName,
          lastName: context.user.lastName,
          role: context.user.role
        },
        booking: {
          id: context.booking.id,
          scheduledDate: context.booking.scheduledDate,
          startTime: context.booking.startTime,
          endTime: context.booking.endTime,
          lessonTypeName: context.booking.lessonTypeName,
          totalPrice: context.booking.totalPrice,
          paymentMethod: 'swish',
          swishUUID: context.booking.swishUUID,
          paymentTime: context.booking.paymentTime || new Date().toISOString()
        },
        // Override recipient to admin
        admin: {
          email: process.env.ADMIN_EMAIL || 'admin@dintrafikskolahlm.se'
        }
      }
    );

    if (!success) {
      logger.error('email', 'Failed to send Swish payment confirmation email', {
        bookingId: context.booking.id,
        swishRef: context.booking.swishUUID
      });
    }

    return success;
  } catch (error) {
    logger.error('email', 'Error sending Swish payment confirmation email', {
      error: error.message,
      bookingId: context.booking.id,
      swishRef: context.booking.swishUUID
    });
    return false;
  }
}
