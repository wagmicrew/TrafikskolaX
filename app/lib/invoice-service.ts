import { db } from '@/lib/db';
import { invoices, invoiceItems, bookings, lessonTypes, packages, teorilektioner } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';

export interface InvoiceData {
  type: 'booking' | 'package' | 'teori';
  referenceId: string;
  userId: string;
  amount: number;
  description?: string;
  items?: InvoiceItemData[];
}

export interface InvoiceItemData {
  description: string;
  quantity: number;
  unitPrice: number;
  itemType?: string;
  itemReference?: string;
}

export class InvoiceService {
  /**
   * Create an invoice for a booking
   */
  static async createBookingInvoice(bookingId: string): Promise<string | null> {
    try {
      // Get booking details
      const booking = await db
        .select({
          id: bookings.id,
          userId: bookings.userId,
          lessonTypeId: bookings.lessonTypeId,
          scheduledDate: bookings.scheduledDate,
          totalPrice: bookings.totalPrice,
          lessonTypeName: lessonTypes.name,
          lessonTypeDescription: lessonTypes.description
        })
        .from(bookings)
        .leftJoin(lessonTypes, eq(bookings.lessonTypeId, lessonTypes.id))
        .where(eq(bookings.id, bookingId))
        .limit(1);

      if (!booking.length) {
        console.error('Booking not found for invoice creation:', bookingId);
        return null;
      }

      const bookingData = booking[0];

      // Check if invoice already exists
      const existingInvoice = await db
        .select()
        .from(invoices)
        .where(and(
          eq(invoices.bookingId, bookingId),
          eq(invoices.userId, bookingData.userId)
        ))
        .limit(1);

      if (existingInvoice.length > 0) {
        return existingInvoice[0].id;
      }

      // Generate invoice number
      const invoiceNumber = await this.generateInvoiceNumber();

      // Create invoice
      const invoiceId = await db.transaction(async (tx) => {
        const [newInvoice] = await tx
          .insert(invoices)
          .values({
            invoiceNumber,
            type: 'booking',
            userId: bookingData.userId,
            bookingId,
            amount: bookingData.totalPrice,
            currency: 'SEK',
            status: 'pending',
            issuedAt: new Date(),
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            description: `Körlektion: ${bookingData.lessonTypeName} - ${new Date(bookingData.scheduledDate).toLocaleDateString('sv-SE')}`,
            createdAt: new Date(),
            updatedAt: new Date()
          })
          .returning({ id: invoices.id });

        // Create invoice item
        await tx
          .insert(invoiceItems)
          .values({
            invoiceId: newInvoice.id,
            description: bookingData.lessonTypeName,
            quantity: 1,
            unitPrice: bookingData.totalPrice,
            totalPrice: bookingData.totalPrice,
            itemType: 'lesson',
            itemReference: bookingData.lessonTypeId
          });

        return newInvoice.id;
      });

      return invoiceId;
    } catch (error) {
      console.error('Error creating booking invoice:', error);
      return null;
    }
  }

  /**
   * Create an invoice for a package purchase
   */
  static async createPackageInvoice(packageId: string): Promise<string | null> {
    try {
      // Get package details
      const packageData = await db
        .select()
        .from(packages)
        .where(eq(packages.id, packageId))
        .limit(1);

      if (!packageData.length) {
        console.error('Package not found for invoice creation:', packageId);
        return null;
      }

      const pkg = packageData[0];

      // Check if invoice already exists
      const existingInvoice = await db
        .select()
        .from(invoices)
        .where(and(
          eq(invoices.packageId, packageId),
          eq(invoices.userId, pkg.userId)
        ))
        .limit(1);

      if (existingInvoice.length > 0) {
        return existingInvoice[0].id;
      }

      // Generate invoice number
      const invoiceNumber = await this.generateInvoiceNumber();

      // Create invoice
      const invoiceId = await db.transaction(async (tx) => {
        const [newInvoice] = await tx
          .insert(invoices)
          .values({
            invoiceNumber,
            type: 'package',
            userId: pkg.userId,
            packageId,
            amount: pkg.price,
            currency: 'SEK',
            status: 'pending',
            issuedAt: new Date(),
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            description: `Lektionspaket: ${pkg.name}`,
            createdAt: new Date(),
            updatedAt: new Date()
          })
          .returning({ id: invoices.id });

        // Create invoice item
        await tx
          .insert(invoiceItems)
          .values({
            invoiceId: newInvoice.id,
            description: pkg.name,
            quantity: 1,
            unitPrice: pkg.price,
            totalPrice: pkg.price,
            itemType: 'package',
            itemReference: pkg.id
          });

        return newInvoice.id;
      });

      return invoiceId;
    } catch (error) {
      console.error('Error creating package invoice:', error);
      return null;
    }
  }

  /**
   * Create an invoice for a theory session
   */
  static async createTheoryInvoice(teoriId: string): Promise<string | null> {
    try {
      // Get theory session details
      const theoryData = await db
        .select()
        .from(teorilektioner)
        .where(eq(teorilektioner.id, teoriId))
        .limit(1);

      if (!theoryData.length) {
        console.error('Theory session not found for invoice creation:', teoriId);
        return null;
      }

      const theory = theoryData[0];

      // Check if invoice already exists
      const existingInvoice = await db
        .select()
        .from(invoices)
        .where(and(
          eq(invoices.teoriId, teoriId),
          eq(invoices.userId, theory.studentId)
        ))
        .limit(1);

      if (existingInvoice.length > 0) {
        return existingInvoice[0].id;
      }

      // Generate invoice number
      const invoiceNumber = await this.generateInvoiceNumber();

      // Create invoice
      const invoiceId = await db.transaction(async (tx) => {
        const [newInvoice] = await tx
          .insert(invoices)
          .values({
            invoiceNumber,
            type: 'teori',
            userId: theory.studentId,
            teoriId,
            amount: theory.price || 0,
            currency: 'SEK',
            status: 'pending',
            issuedAt: new Date(),
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            description: `Teorilektion: ${theory.title || 'Teorilektion'} - ${new Date(theory.scheduledDate).toLocaleDateString('sv-SE')}`,
            createdAt: new Date(),
            updatedAt: new Date()
          })
          .returning({ id: invoices.id });

        // Create invoice item
        await tx
          .insert(invoiceItems)
          .values({
            invoiceId: newInvoice.id,
            description: theory.title || 'Teorilektion',
            quantity: 1,
            unitPrice: theory.price || 0,
            totalPrice: theory.price || 0,
            itemType: 'theory',
            itemReference: theory.id
          });

        return newInvoice.id;
      });

      return invoiceId;
    } catch (error) {
      console.error('Error creating theory invoice:', error);
      return null;
    }
  }

  /**
   * Generate a unique invoice number
   */
  private static async generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');

    // Get the last invoice number for this month
    const lastInvoice = await db
      .select({ invoiceNumber: invoices.invoiceNumber })
      .from(invoices)
      .where(sql`${invoices.invoiceNumber} LIKE ${`${year}${month}%`}`)
      .orderBy(sql`${invoices.invoiceNumber} DESC`)
      .limit(1);

    let sequenceNumber = 1;
    if (lastInvoice.length > 0) {
      const lastNumber = parseInt(lastInvoice[0].invoiceNumber.slice(-4));
      sequenceNumber = lastNumber + 1;
    }

    return `${year}${month}${String(sequenceNumber).padStart(4, '0')}`;
  }

  /**
   * Get invoice by ID with full details
   */
  static async getInvoiceWithDetails(invoiceId: string, userId?: string) {
    const whereCondition = userId
      ? and(eq(invoices.id, invoiceId), eq(invoices.userId, userId))
      : eq(invoices.id, invoiceId);

    const invoice = await db
      .select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        type: invoices.type,
        amount: invoices.amount,
        currency: invoices.currency,
        status: invoices.status,
        issuedAt: invoices.issuedAt,
        dueDate: invoices.dueDate,
        paidAt: invoices.paidAt,
        description: invoices.description,
        bookingId: invoices.bookingId,
        packageId: invoices.packageId,
        teoriId: invoices.teoriId,
        lessonTypeName: lessonTypes.name,
        scheduledDate: bookings.scheduledDate,
        startTime: bookings.startTime,
        endTime: bookings.endTime,
        durationMinutes: bookings.durationMinutes,
        transmissionType: bookings.transmissionType
      })
      .from(invoices)
      .leftJoin(bookings, eq(invoices.bookingId, bookings.id))
      .leftJoin(lessonTypes, eq(bookings.lessonTypeId, lessonTypes.id))
      .where(whereCondition)
      .limit(1);

    if (!invoice.length) {
      return null;
    }

    // Get invoice items
    const items = await db
      .select()
      .from(invoiceItems)
      .where(eq(invoiceItems.invoiceId, invoiceId));

    return {
      ...invoice[0],
      items
    };
  }
}


