import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { invoices, invoiceItems, bookings, lessonTypes, packages, teorilektioner } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getErrorMessage } from '@/utils/getErrorMessage';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get invoice with all related data - no authentication required for public access
    const invoice = await db
      .select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        type: invoices.type,
        amount: invoices.amount,
        currency: invoices.currency,
        status: invoices.status,
        paymentMethod: invoices.paymentMethod,
        swishUuid: invoices.swishUuid,
        qliroOrderId: invoices.qliroOrderId,
        paymentReference: invoices.paymentReference,
        issuedAt: invoices.issuedAt,
        dueDate: invoices.dueDate,
        paidAt: invoices.paidAt,
        description: invoices.description,
        notes: invoices.notes,
        bookingId: invoices.bookingId,
        packageId: invoices.packageId,
        teoriId: invoices.teoriId,
        userId: invoices.userId,
        // Booking details
        lessonTypeName: lessonTypes.name,
        scheduledDate: bookings.scheduledDate,
        startTime: bookings.startTime,
        endTime: bookings.endTime,
        durationMinutes: bookings.durationMinutes,
        transmissionType: bookings.transmissionType,
        // Package details
        packageName: packages.name
      })
      .from(invoices)
      .leftJoin(bookings, eq(invoices.bookingId, bookings.id))
      .leftJoin(lessonTypes, eq(bookings.lessonTypeId, lessonTypes.id))
      .leftJoin(packages, eq(invoices.packageId, packages.id))
      .where(eq(invoices.id, id))
      .limit(1);

    if (!invoice.length) {
      return NextResponse.json(
        { error: 'Faktura hittades inte' },
        { status: 404 }
      );
    }

    const invoiceData = invoice[0];

    // Get invoice items
    const items = await db
      .select()
      .from(invoiceItems)
      .where(eq(invoiceItems.invoiceId, id));

    return NextResponse.json({
      invoice: {
        ...invoiceData,
        items
      }
    });

  } catch (error) {
    console.error('Public invoice fetch error:', error);
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

