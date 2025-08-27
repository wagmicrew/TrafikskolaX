import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/server-auth';
import { db } from '@/lib/db';
import { invoices, bookings, packages } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getErrorMessage } from '@/utils/getErrorMessage';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth('student');
    const { id } = await params;

    const body = await request.json();
    const { invoiceId } = body;

    // Verify invoice belongs to user
    const invoice = await db
      .select()
      .from(invoices)
      .where(and(eq(invoices.id, id), eq(invoices.userId, user.id)))
      .limit(1);

    if (!invoice.length) {
      return NextResponse.json(
        { error: 'Faktura hittades inte' },
        { status: 404 }
      );
    }

    const invoiceData = invoice[0];

    if (invoiceData.status === 'paid') {
      return NextResponse.json(
        { error: 'Fakturan är redan betald' },
        { status: 400 }
      );
    }

    // Start transaction
    await db.transaction(async (tx) => {
      // Update invoice status
      await tx
        .update(invoices)
        .set({
          status: 'pending',
          paymentMethod: 'pay_on_location',
          paymentReference: 'Betalning på plats',
          notes: 'Kunden önskar betala på plats vid lektionstillfället',
          updatedAt: new Date()
        })
        .where(eq(invoices.id, id));

      // If this is a booking invoice, update booking status
      if (invoiceData.bookingId) {
        await tx
          .update(bookings)
          .set({
            paymentStatus: 'pending',
            paymentMethod: 'pay_on_location',
            notes: 'Kunden önskar betala på plats',
            updatedAt: new Date()
          })
          .where(eq(bookings.id, invoiceData.bookingId));
      }

      // If this is a package invoice, update package status
      if (invoiceData.packageId) {
        await tx
          .update(packages)
          .set({
            paymentStatus: 'pending',
            paymentMethod: 'pay_on_location',
            notes: 'Kunden önskar betala på plats',
            updatedAt: new Date()
          })
          .where(eq(packages.id, invoiceData.packageId));
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Betalning markerad för platsbetalning'
    });

  } catch (error) {
    console.error('Pay on location error:', error);
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

