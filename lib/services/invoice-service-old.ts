import { db } from '@/lib/db';
import { invoices, invoiceItems } from '@/lib/db/schema/invoice';
import { users } from '@/lib/db/schema';
import { eq, and, desc, asc } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

export interface CreateInvoiceData {
  type: 'booking' | 'handledar' | 'package' | 'custom';
  customerId?: string;
  customerEmail?: string;
  customerName?: string;
  customerPhone?: string;
  description?: string;
  amount: number;
  paymentMethod?: 'swish' | 'qliro' | 'credits' | 'cash' | 'bank_transfer';
  bookingId?: string;
  sessionId?: string;
  handledarBookingId?: string;
  packageId?: string;
  dueDate?: Date;
  notes?: string;
  items?: InvoiceItemData[];
}

export interface InvoiceItemData {
  description: string;
  quantity: number;
  unitPrice: number;
  itemType?: string;
  itemReference?: string;
}

export interface UpdateInvoiceData {
  status?: 'pending' | 'paid' | 'overdue' | 'cancelled' | 'error';
  paymentMethod?: 'swish' | 'qliro' | 'credits' | 'cash' | 'bank_transfer';
  swishUuid?: string;
  qliroOrderId?: string;
  paymentReference?: string;
  paidAt?: Date;
  notes?: string;
  internalNotes?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  description?: string;
  dueDate?: Date;
}

// Reuse a singleton pg Pool across hot-reloads to avoid "Client has already been connected"
// Using Drizzle ORM instead of direct Pool connections

export class InvoiceService {
  // Pool is module-scoped; no per-instance connection needed

  async createInvoice(data: CreateInvoiceData) {
    try {
      // Generate invoice number using a simple approach since the generate_invoice_number function might not be available
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      const invoiceNumber = `INV-${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, '0')}-${timestamp.toString().slice(-4)}${random}`;

      // Calculate total amount from items if provided
      let totalAmount = data.amount;
      if (data.items && data.items.length > 0) {
        totalAmount = data.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
      }

      // Create invoice using Drizzle
      const [newInvoice] = await db.insert(invoices).values({
        invoiceNumber,
        type: data.type,
        customerId: data.customerId || null,
        customerEmail: data.customerEmail || null,
        customerName: data.customerName || null,
        customerPhone: data.customerPhone || null,
        description: data.description || null,
        amount: totalAmount,
        paymentMethod: data.paymentMethod || null,
        bookingId: data.bookingId || null,
        sessionId: data.sessionId || null,
        handledarBookingId: data.handledarBookingId || null,
        packageId: data.packageId || null,
        dueDate: data.dueDate ? data.dueDate.toISOString() : null,
        notes: data.notes || null
      }).returning();

      // Create invoice items if provided
      if (data.items && data.items.length > 0) {
        for (const item of data.items) {
          await db.insert(invoiceItems).values({
            invoiceId: newInvoice.id,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice,
            itemType: item.itemType || null,
            itemReference: item.itemReference || null
          });
        }
      }

      return newInvoice;
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw error;
    }
  }

  async getInvoiceById(id: string) {
    try {
      const invoiceResult = await db
        .select()
        .from(invoices)
        .leftJoin(users, eq(invoices.customerId, users.id))
        .where(eq(invoices.id, id))
        .limit(1);

      if (invoiceResult.length === 0) {
        return null;
      }

      const invoice = invoiceResult[0].invoices;
      const customer = invoiceResult[0].users;

      // Get invoice items
      const itemsResult = await db
        .select()
        .from(invoiceItems)
        .where(eq(invoiceItems.invoiceId, id))
        .orderBy(asc(invoiceItems.createdAt));

      return {
        ...invoice,
        items: itemsResult.map(item => ({
          id: item.id,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          itemType: item.itemType,
          itemReference: item.itemReference
        })),
        customer: customer ? {
          id: customer.id,
          firstName: customer.firstName,
          lastName: customer.lastName,
          email: customer.email
        } : null
      };
    } catch (error) {
      console.error('Error getting invoice:', error);
      throw error;
    }
  }

  async getInvoicesByCustomer(customerId: string, status?: string) {
    // use pool directly

    try {
      let query = `
        SELECT i.*, COUNT(ii.id) as item_count
        FROM invoices i
        LEFT JOIN invoice_items ii ON i.id = ii.invoice_id
        WHERE i.customer_id = $1
      `;
      const params = [customerId];

      if (status) {
        query += ` AND i.status = $2`;
        params.push(status);
      }

      query += ` GROUP BY i.id ORDER BY i.issued_at DESC`;

      const result = await pool.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('Error getting customer invoices:', error);
      throw error;
    }
  }

  async getAllInvoices(filters?: {
    status?: string;
    type?: string;
    customerId?: string;
    limit?: number;
    offset?: number;
  }) {
    // use pool directly

    try {
      let query = `
        SELECT i.*,
               u.first_name,
               u.last_name,
               u.email,
               COUNT(ii.id) as item_count
        FROM invoices i
        LEFT JOIN users u ON i.customer_id = u.id
        LEFT JOIN invoice_items ii ON i.id = ii.invoice_id
        WHERE 1=1
      `;
      const params = [];
      let paramIndex = 1;

      if (filters?.status) {
        query += ` AND i.status = $${paramIndex}`;
        params.push(filters.status);
        paramIndex++;
      }

      if (filters?.type) {
        query += ` AND i.type = $${paramIndex}`;
        params.push(filters.type);
        paramIndex++;
      }

      if (filters?.customerId) {
        query += ` AND i.customer_id = $${paramIndex}`;
        params.push(filters.customerId);
        paramIndex++;
      }

      query += ` GROUP BY i.id, u.id ORDER BY i.issued_at DESC`;

      if (filters?.limit) {
        query += ` LIMIT $${paramIndex}`;
        params.push(filters.limit);
        paramIndex++;
      }

      if (filters?.offset) {
        query += ` OFFSET $${paramIndex}`;
        params.push(filters.offset);
      }

      const result = await pool.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('Error getting all invoices:', error);
      throw error;
    }
  }

  async updateInvoice(id: string, data: UpdateInvoiceData) {
    // use pool directly

    try {
      const fields = [];
      const values = [];
      let paramIndex = 1;

      if (data.status !== undefined) {
        fields.push(`status = $${paramIndex}`);
        values.push(data.status);
        paramIndex++;
      }

      if (data.paymentMethod !== undefined) {
        fields.push(`payment_method = $${paramIndex}`);
        values.push(data.paymentMethod);
        paramIndex++;
      }

      if (data.swishUuid !== undefined) {
        fields.push(`swish_uuid = $${paramIndex}`);
        values.push(data.swishUuid);
        paramIndex++;
      }

      if (data.qliroOrderId !== undefined) {
        fields.push(`qliro_order_id = $${paramIndex}`);
        values.push(data.qliroOrderId);
        paramIndex++;
      }

      if (data.paymentReference !== undefined) {
        fields.push(`payment_reference = $${paramIndex}`);
        values.push(data.paymentReference);
        paramIndex++;
      }

      if (data.paidAt !== undefined) {
        fields.push(`paid_at = $${paramIndex}`);
        values.push(data.paidAt.toISOString());
        paramIndex++;
      }

      if (data.notes !== undefined) {
        fields.push(`notes = $${paramIndex}`);
        values.push(data.notes);
        paramIndex++;
      }

      if (data.internalNotes !== undefined) {
        fields.push(`internal_notes = $${paramIndex}`);
        values.push(data.internalNotes);
        paramIndex++;
      }

      if (data.customerName !== undefined) {
        fields.push(`customer_name = $${paramIndex}`);
        values.push(data.customerName);
        paramIndex++;
      }

      if (data.customerEmail !== undefined) {
        fields.push(`customer_email = $${paramIndex}`);
        values.push(data.customerEmail);
        paramIndex++;
      }

      if (data.customerPhone !== undefined) {
        fields.push(`customer_phone = $${paramIndex}`);
        values.push(data.customerPhone);
        paramIndex++;
      }

      if (data.description !== undefined) {
        fields.push(`description = $${paramIndex}`);
        values.push(data.description);
        paramIndex++;
      }

      if (data.dueDate !== undefined) {
        fields.push(`due_date = $${paramIndex}`);
        values.push(data.dueDate.toISOString());
        paramIndex++;
      }

      fields.push(`updated_at = NOW()`);

      const query = `
        UPDATE invoices
        SET ${fields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;
      values.push(id);

      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error updating invoice:', error);
      throw error;
    }
  }

  async markAsPaid(id: string, paymentMethod: string, paymentReference?: string) {
    return this.updateInvoice(id, {
      status: 'paid',
      paymentMethod: paymentMethod as any,
      paymentReference,
      paidAt: new Date()
    });
  }

  async sendReminder(id: string) {
    // use pool directly

    try {
      // Get invoice details for reminder first
      const invoice = await this.getInvoiceById(id);
      if (!invoice) {
        throw new Error('Invoice not found');
      }

      // Update reminder count and last reminder sent
      await pool.query(`
        UPDATE invoices
        SET reminder_count = reminder_count + 1,
            last_reminder_sent = NOW(),
            updated_at = NOW()
        WHERE id = $1
      `, [id]);

      // Send payment reminder email
      try {
        const { EnhancedEmailService } = await import('@/lib/email/enhanced-email-service');

        const context = {
          user: {
            id: invoice.customer_id || '',
            email: invoice.customer_email || '',
            firstName: invoice.customer_name || '',
            lastName: '',
            role: 'student'
          },
          invoice: {
            id: invoice.id,
            invoiceNumber: invoice.invoice_number,
            amount: invoice.amount,
            currency: invoice.currency,
            dueDate: invoice.due_date,
            issuedDate: invoice.issued_at,
            description: invoice.description,
            status: invoice.status
          }
        };

        const emailSent = await EnhancedEmailService.sendTriggeredEmail('payment_reminder', context);

        if (emailSent) {
          console.log(`Payment reminder email sent for invoice ${invoice.invoice_number}`);
        } else {
          console.warn(`Failed to send payment reminder email for invoice ${invoice.invoice_number}`);
        }
      } catch (emailError) {
        console.error('Error sending payment reminder email:', emailError);
        // Don't throw error here - we still want to return the invoice even if email fails
      }

      return invoice;
    } catch (error) {
      console.error('Error sending reminder:', error);
      throw error;
    }
  }

  async getOverdueInvoices() {
    // use pool directly

    try {
      const result = await pool.query(`
        SELECT i.*, u.first_name, u.last_name, u.email
        FROM invoices i
        LEFT JOIN users u ON i.customer_id = u.id
        WHERE i.status = 'pending'
        AND i.due_date < NOW()
        AND i.is_active = true
        ORDER BY i.due_date ASC
      `);

      return result.rows;
    } catch (error) {
      console.error('Error getting overdue invoices:', error);
      throw error;
    }
  }

  async getInvoiceStats() {
    // use pool directly

    try {
      const result = await pool.query(`
        SELECT
          COUNT(*) as total_invoices,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
          COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_count,
          COUNT(CASE WHEN status = 'overdue' THEN 1 END) as overdue_count,
          COALESCE(SUM(CASE WHEN status = 'paid' THEN amount END), 0) as total_paid,
          COALESCE(SUM(CASE WHEN status = 'pending' THEN amount END), 0) as total_pending
        FROM invoices
        WHERE is_active = true
      `);

      return result.rows[0];
    } catch (error) {
      console.error('Error getting invoice stats:', error);
      throw error;
    }
  }
}

export const invoiceService = new InvoiceService();
