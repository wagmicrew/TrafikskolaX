import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/server-auth';
import { db } from '@/lib/db';
import { invoices, invoiceItems, userCredits, bookings, packages } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { getErrorMessage } from '@/utils/getErrorMessage';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth('student');
    const { id } = await params;

    const body = await request.json();
    const { creditId } = body;

    if (!creditId) {
      return NextResponse.json(
        { error: 'Kredit-ID krävs' },
        { status: 400 }
      );
    }

    // Get invoice details
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

    // Check if user has available credits
    const availableCredit = await db
      .select()
      .from(userCredits)
      .where(and(
        eq(userCredits.userId, user.id),
        eq(userCredits.lessonTypeId, creditId),
        sql`${userCredits.creditsRemaining} > 0`
      ))
      .limit(1);

    if (!availableCredit.length) {
      return NextResponse.json(
        { error: 'Inga tillgängliga krediter för denna lektionstyp' },
        { status: 400 }
      );
    }

    const creditData = availableCredit[0];

    // Start transaction
    await db.transaction(async (tx) => {
      // Decrement credit
      await tx
        .update(userCredits)
        .set({
          creditsRemaining: sql`${userCredits.creditsRemaining} - 1`,
          updatedAt: new Date()
        })
        .where(eq(userCredits.id, creditData.id));

      // Update invoice status
      await tx
        .update(invoices)
        .set({
          status: 'paid',
          paymentMethod: 'credit',
          paymentReference: `Kredit - ${creditData.packageName}`,
          paidAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(invoices.id, id));

      // If this is a booking invoice, mark booking as paid
      if (invoiceData.bookingId) {
        await tx
          .update(bookings)
          .set({
            paymentStatus: 'paid',
            paymentMethod: 'credit',
            updatedAt: new Date()
          })
          .where(eq(bookings.id, invoiceData.bookingId));
      }

      // If this is a package invoice, mark package as paid
      if (invoiceData.packageId) {
        await tx
          .update(packages)
          .set({
            paymentStatus: 'paid',
            paymentMethod: 'credit',
            updatedAt: new Date()
          })
          .where(eq(packages.id, invoiceData.packageId));
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Betalning med krediter lyckades'
    });

  } catch (error) {
    console.error('Credit payment error:', error);
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

