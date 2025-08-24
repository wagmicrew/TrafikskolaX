import { db } from '@/lib/db';
import { invoiceService } from './invoice-service';
import { eq, and } from 'drizzle-orm';

export interface BookingData {
  id: string;
  studentId: string;
  teacherId?: string;
  bookingDate: Date;
  lessonTypeId?: string;
  carId?: string;
  totalPrice: number;
  status: string;
  lessonType?: {
    name: string;
    price: number;
  };
}

export interface PackageData {
  id: string;
  studentId: string;
  packageId: string;
  totalPrice: number;
  status: string;
  package?: {
    name: string;
    lessonTypeId: string;
  };
}

export interface SessionBookingData {
  id: string;
  studentId?: string;
  sessionId: string;
  totalPrice: number;
  status: string;
  session?: {
    title: string;
    sessionTypeId: string;
  };
}

export class BookingInvoiceService {
  /**
   * Create an invoice for a regular booking
   */
  async createBookingInvoice(booking: BookingData, studentEmail?: string, studentName?: string) {
    try {
      const description = booking.lessonType
        ? `Körlektion: ${booking.lessonType.name}`
        : `Körlektion - ${new Date(booking.bookingDate).toLocaleDateString('sv-SE')}`;

      const items = [{
        description: description,
        quantity: 1,
        unitPrice: booking.totalPrice,
        itemType: 'lesson',
        itemReference: booking.lessonTypeId || booking.id
      }];

      // Set due date (30 days from now by default)
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);

      const invoice = await invoiceService.createInvoice({
        type: 'booking',
        customerId: booking.studentId,
        customerEmail: studentEmail,
        customerName: studentName,
        description: `Faktura för körlektion`,
        amount: booking.totalPrice,
        bookingId: booking.id,
        dueDate: dueDate,
        items: items
      });

      return invoice;
    } catch (error) {
      console.error('Error creating booking invoice:', error);
      throw error;
    }
  }

  /**
   * Create an invoice for a package purchase
   */
  async createPackageInvoice(packagePurchase: PackageData, studentEmail?: string, studentName?: string) {
    try {
      const description = packagePurchase.package
        ? `Lektionspaket: ${packagePurchase.package.name}`
        : `Lektionspaket`;

      const items = [{
        description: description,
        quantity: 1,
        unitPrice: packagePurchase.totalPrice,
        itemType: 'package',
        itemReference: packagePurchase.packageId
      }];

      // Set due date (30 days from now by default)
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);

      const invoice = await invoiceService.createInvoice({
        type: 'package',
        customerId: packagePurchase.studentId,
        customerEmail: studentEmail,
        customerName: studentName,
        description: `Faktura för lektionspaket`,
        amount: packagePurchase.totalPrice,
        packageId: packagePurchase.id,
        dueDate: dueDate,
        items: items
      });

      return invoice;
    } catch (error) {
      console.error('Error creating package invoice:', error);
      throw error;
    }
  }

  /**
   * Create an invoice for a session booking (handledar, teori, etc.)
   */
  async createSessionInvoice(sessionBooking: SessionBookingData, studentEmail?: string, studentName?: string) {
    try {
      const description = sessionBooking.session
        ? `Session: ${sessionBooking.session.title}`
        : `Sessionbokning`;

      const items = [{
        description: description,
        quantity: 1,
        unitPrice: sessionBooking.totalPrice,
        itemType: 'session',
        itemReference: sessionBooking.sessionId
      }];

      // Set due date (30 days from now by default)
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);

      const invoice = await invoiceService.createInvoice({
        type: 'handledar', // Default to handledar type, can be updated based on session type
        customerId: sessionBooking.studentId,
        customerEmail: studentEmail,
        customerName: studentName,
        description: `Faktura för session`,
        amount: sessionBooking.totalPrice,
        sessionId: sessionBooking.sessionId,
        dueDate: dueDate,
        items: items
      });

      return invoice;
    } catch (error) {
      console.error('Error creating session invoice:', error);
      throw error;
    }
  }

  /**
   * Mark an invoice as paid when payment is confirmed
   */
  async markInvoicePaid(invoiceId: string, paymentMethod: string, paymentReference?: string) {
    try {
      const updatedInvoice = await invoiceService.markAsPaid(invoiceId, paymentMethod, paymentReference);

      // Here you could trigger additional actions like:
      // - Update booking status
      // - Send confirmation email
      // - Update student credits
      // - etc.

      return updatedInvoice;
    } catch (error) {
      console.error('Error marking invoice as paid:', error);
      throw error;
    }
  }

  /**
   * Handle payment confirmation from external providers (Swish, Qliro, etc.)
   */
  async handlePaymentConfirmation(paymentReference: string, paymentMethod: string, amount: number) {
    try {
      // Find invoice by payment reference
      // This would need to be implemented based on how you store payment references
      // For now, we'll implement a basic version

      console.log(`Payment confirmed: ${paymentReference}, method: ${paymentMethod}, amount: ${amount}`);

      // You would typically:
      // 1. Find the invoice by payment reference
      // 2. Verify the amount matches
      // 3. Mark as paid
      // 4. Trigger any follow-up actions

      return { success: true, message: 'Payment processed successfully' };
    } catch (error) {
      console.error('Error handling payment confirmation:', error);
      throw error;
    }
  }

  /**
   * Get overdue invoices that need reminders
   */
  async getOverdueInvoicesForReminders() {
    try {
      return await invoiceService.getOverdueInvoices();
    } catch (error) {
      console.error('Error getting overdue invoices:', error);
      throw error;
    }
  }

  /**
   * Send payment reminder for an invoice
   */
  async sendPaymentReminder(invoiceId: string) {
    try {
      const invoice = await invoiceService.sendReminder(invoiceId);

      // Here you could integrate with your email service to send actual reminders
      console.log(`Payment reminder sent for invoice ${invoiceId}`);

      return invoice;
    } catch (error) {
      console.error('Error sending payment reminder:', error);
      throw error;
    }
  }

  /**
   * Get invoice statistics
   */
  async getInvoiceStatistics() {
    try {
      return await invoiceService.getInvoiceStats();
    } catch (error) {
      console.error('Error getting invoice statistics:', error);
      throw error;
    }
  }

  /**
   * Cancel an invoice (e.g., when booking is cancelled)
   */
  async cancelInvoice(invoiceId: string, reason?: string) {
    try {
      const updatedInvoice = await invoiceService.updateInvoice(invoiceId, {
        status: 'cancelled',
        notes: reason
      });

      return updatedInvoice;
    } catch (error) {
      console.error('Error cancelling invoice:', error);
      throw error;
    }
  }

  /**
   * Get all unpaid invoices for a customer
   */
  async getUnpaidInvoicesForCustomer(customerId: string) {
    try {
      return await invoiceService.getInvoicesByCustomer(customerId, 'pending');
    } catch (error) {
      console.error('Error getting unpaid invoices for customer:', error);
      throw error;
    }
  }
}

export const bookingInvoiceService = new BookingInvoiceService();
