import { EmailService } from './unified-email-service';

export interface SessionBookingData {
  sessionId: string;
  sessionTitle: string;
  sessionDate: string;
  sessionStartTime: string;
  sessionEndTime: string;
  sessionType: string;
  supervisorName: string;
  supervisorEmail: string;
  supervisorPhone?: string;
  price: number;
  paymentMethod?: string;
  swishUrl?: string;
  schoolName: string;
  schoolPhone?: string;
  schoolAddress?: string;
}

export interface SessionReminderData {
  sessionId: string;
  sessionTitle: string;
  sessionDate: string;
  sessionStartTime: string;
  sessionEndTime: string;
  supervisorName: string;
  supervisorEmail: string;
  daysUntilSession: number;
}

export interface SessionCancellationData {
  sessionId: string;
  sessionTitle: string;
  sessionDate: string;
  supervisorName: string;
  supervisorEmail: string;
  reason?: string;
}

export class SessionNotificationService {
  static async sendSessionBookingConfirmation(data: SessionBookingData) {
    try {
      const emailData = {
        to: data.supervisorEmail,
        subject: `Bokningsbekräftelse - ${data.sessionTitle}`,
        template: 'session-booking-confirmation',
        templateData: {
          supervisorName: data.supervisorName,
          sessionTitle: data.sessionTitle,
          sessionDate: data.sessionDate,
          sessionStartTime: data.sessionStartTime,
          sessionEndTime: data.sessionEndTime,
          sessionType: data.sessionType,
          price: data.price,
          paymentMethod: data.paymentMethod || 'Swish',
          swishUrl: data.swishUrl,
          schoolName: data.schoolName,
          schoolPhone: data.schoolPhone,
          schoolAddress: data.schoolAddress,
        }
      };

      await EmailService.sendEmail(emailData);
      console.log(`Session booking confirmation sent to ${data.supervisorEmail}`);
    } catch (error) {
      console.error('Failed to send session booking confirmation:', error);
    }
  }

  static async sendSessionReminder(data: SessionReminderData) {
    try {
      const emailData = {
        to: data.supervisorEmail,
        subject: `Påminnelse - ${data.sessionTitle} om ${data.daysUntilSession} dagar`,
        template: 'session-reminder',
        templateData: {
          supervisorName: data.supervisorName,
          sessionTitle: data.sessionTitle,
          sessionDate: data.sessionDate,
          sessionStartTime: data.sessionStartTime,
          sessionEndTime: data.sessionEndTime,
          daysUntilSession: data.daysUntilSession,
        }
      };

      await EmailService.sendEmail(emailData);
      console.log(`Session reminder sent to ${data.supervisorEmail}`);
    } catch (error) {
      console.error('Failed to send session reminder:', error);
    }
  }

  static async sendSessionCancellation(data: SessionCancellationData) {
    try {
      const emailData = {
        to: data.supervisorEmail,
        subject: `Avbokning - ${data.sessionTitle}`,
        template: 'session-cancellation',
        templateData: {
          supervisorName: data.supervisorName,
          sessionTitle: data.sessionTitle,
          sessionDate: data.sessionDate,
          reason: data.reason || 'Ingen specifik anledning angiven',
        }
      };

      await EmailService.sendEmail(emailData);
      console.log(`Session cancellation sent to ${data.supervisorEmail}`);
    } catch (error) {
      console.error('Failed to send session cancellation:', error);
    }
  }

  static async sendPaymentConfirmation(data: SessionBookingData) {
    try {
      const emailData = {
        to: data.supervisorEmail,
        subject: `Betalning mottagen - ${data.sessionTitle}`,
        template: 'session-payment-confirmation',
        templateData: {
          supervisorName: data.supervisorName,
          sessionTitle: data.sessionTitle,
          sessionDate: data.sessionDate,
          sessionStartTime: data.sessionStartTime,
          sessionEndTime: data.sessionEndTime,
          price: data.price,
          paymentMethod: data.paymentMethod || 'Swish',
          schoolName: data.schoolName,
        }
      };

      await EmailService.sendEmail(emailData);
      console.log(`Payment confirmation sent to ${data.supervisorEmail}`);
    } catch (error) {
      console.error('Failed to send payment confirmation:', error);
    }
  }

  static async sendSupervisorNotification(data: {
    supervisorName: string;
    supervisorEmail: string;
    sessionTitle: string;
    sessionDate: string;
    sessionStartTime: string;
    sessionEndTime: string;
    studentName?: string;
    studentEmail?: string;
  }) {
    try {
      const emailData = {
        to: data.supervisorEmail,
        subject: `Handledaruppdrag - ${data.sessionTitle}`,
        template: 'supervisor-assignment',
        templateData: {
          supervisorName: data.supervisorName,
          sessionTitle: data.sessionTitle,
          sessionDate: data.sessionDate,
          sessionStartTime: data.sessionStartTime,
          sessionEndTime: data.sessionEndTime,
          studentName: data.studentName,
          studentEmail: data.studentEmail,
        }
      };

      await EmailService.sendEmail(emailData);
      console.log(`Supervisor notification sent to ${data.supervisorEmail}`);
    } catch (error) {
      console.error('Failed to send supervisor notification:', error);
    }
  }
}
