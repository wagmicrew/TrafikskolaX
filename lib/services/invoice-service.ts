import { db } from '@/lib/db';
import { invoices, invoiceItems } from '@/lib/db/schema/invoice';
import { users } from '@/lib/db/schema';
import { eq, and, desc, asc, sql } from 'drizzle-orm';

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
  items?: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
  }>;
  dueDate?: Date;
}

// Using Drizzle ORM instead of direct Pool connections

export class InvoiceService {
  async createInvoice(data: CreateInvoiceData) {
    try {
      // Generate invoice number using a simple approach
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      const invoiceNumber = `INV-${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, '0')}-${timestamp.toString().slice(-4)}${random}`;

      // Calculate total amount from items if provided
      let totalAmount = data.amount;
      if (data.items && data.items.length > 0) {
        totalAmount = data.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
      }

      // Create invoice using Drizzle
      const [invoice] = await db.insert(invoices).values({
        invoiceNumber,
        customerId: data.customerId,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        type: data.type,
        status: 'pending',
        amount: totalAmount,
        description: data.description,
        paymentMethod: data.paymentMethod,
        dueDate: data.dueDate,
        bookingId: data.bookingId
      }).returning();

      // Create invoice items if provided
      if (data.items && data.items.length > 0) {
        const itemsData = data.items.map(item => ({
          invoiceId: invoice.id,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.quantity * item.unitPrice
        }));

        await db.insert(invoiceItems).values(itemsData);
      }

      return { success: true, invoiceId: invoice.id, invoiceNumber };
    } catch (error) {
      console.error('Error creating invoice:', error);
      return { success: false, error: error.message };
    }
  }

  async getAllInvoices(filters?: {
    status?: string;
    type?: string;
    customerId?: string;
    limit?: number;
    offset?: number;
  }) {
    try {
      // Build the query with Drizzle ORM
      let whereConditions = [];

      if (filters?.status) {
        whereConditions.push(eq(invoices.status, filters.status));
      }

      if (filters?.type) {
        whereConditions.push(eq(invoices.type, filters.type));
      }

      if (filters?.customerId) {
        whereConditions.push(eq(invoices.customerId, filters.customerId));
      }

      const query = await db
        .select({
          id: invoices.id,
          invoiceNumber: invoices.invoiceNumber,
          customerId: invoices.customerId,
          customerName: invoices.customerName,
          customerEmail: invoices.customerEmail,
          customerPhone: invoices.customerPhone,
          type: invoices.type,
          status: invoices.status,
          amount: invoices.amount,
          description: invoices.description,
          paymentMethod: invoices.paymentMethod,
          createdAt: invoices.createdAt,
          updatedAt: invoices.updatedAt,
          dueDate: invoices.dueDate,
          userFirstName: users.firstName,
          userLastName: users.lastName,
          userEmail: users.email,
          itemCount: sql`COUNT(${invoiceItems.id})`
        })
        .from(invoices)
        .leftJoin(users, eq(invoices.customerId, users.id))
        .leftJoin(invoiceItems, eq(invoices.id, invoiceItems.invoiceId))
        .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
        .groupBy(invoices.id, users.firstName, users.lastName, users.email)
        .orderBy(desc(invoices.createdAt))
        .limit(filters?.limit || 50)
        .offset(filters?.offset || 0);

      return query.map(row => ({
        ...row,
        item_count: parseInt(row.itemCount) || 0
      }));
    } catch (error) {
      console.error('Error fetching invoices:', error);
      throw error;
    }
  }

  async getInvoiceById(id: string) {
    try {
      const [invoice] = await db
        .select()
        .from(invoices)
        .where(eq(invoices.id, id))
        .limit(1);

      if (!invoice) {
        return null;
      }

      // Get invoice items
      const items = await db
        .select()
        .from(invoiceItems)
        .where(eq(invoiceItems.invoiceId, id));

      return { ...invoice, items };
    } catch (error) {
      console.error('Error fetching invoice:', error);
      throw error;
    }
  }

  async updateInvoiceStatus(id: string, status: string) {
    try {
      const [updated] = await db
        .update(invoices)
        .set({
          status,
          updatedAt: new Date()
        })
        .where(eq(invoices.id, id))
        .returning();

      return { success: true, invoice: updated };
    } catch (error) {
      console.error('Error updating invoice status:', error);
      return { success: false, error: error.message };
    }
  }

  async deleteInvoice(id: string) {
    try {
      // Delete invoice items first
      await db
        .delete(invoiceItems)
        .where(eq(invoiceItems.invoiceId, id));

      // Delete the invoice
      await db
        .delete(invoices)
        .where(eq(invoices.id, id));

      return { success: true };
    } catch (error) {
      console.error('Error deleting invoice:', error);
      return { success: false, error: error.message };
    }
  }

  async getInvoiceStats() {
    try {
      const [totalInvoices] = await db
        .select({ count: sql`COUNT(*)` })
        .from(invoices);

      const [paidInvoices] = await db
        .select({ count: sql`COUNT(*)` })
        .from(invoices)
        .where(eq(invoices.status, 'paid'));

      const [pendingInvoices] = await db
        .select({ count: sql`COUNT(*)` })
        .from(invoices)
        .where(eq(invoices.status, 'pending'));

      const [overdueInvoices] = await db
        .select({ count: sql`COUNT(*)` })
        .from(invoices)
        .where(eq(invoices.status, 'overdue'));

      const [totalAmount] = await db
        .select({ sum: sql`SUM(${invoices.amount})` })
        .from(invoices);

      const [paidAmount] = await db
        .select({ sum: sql`SUM(${invoices.amount})` })
        .from(invoices)
        .where(eq(invoices.status, 'paid'));

      return {
        total: Number(totalInvoices.count || 0),
        paid: Number(paidInvoices.count || 0),
        pending: Number(pendingInvoices.count || 0),
        overdue: Number(overdueInvoices.count || 0),
        totalAmount: Number(totalAmount.sum || 0),
        paidAmount: Number(paidAmount.sum || 0)
      };
    } catch (error) {
      console.error('Error getting invoice stats:', error);
      return {
        total: 0,
        paid: 0,
        pending: 0,
        overdue: 0,
        totalAmount: 0,
        paidAmount: 0
      };
    }
  }
}

export const invoiceService = new InvoiceService();