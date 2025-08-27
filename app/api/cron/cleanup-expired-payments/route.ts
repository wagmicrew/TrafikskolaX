import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookings, invoices, invoiceItems } from '@/lib/db/schema';
import { eq, and, lt } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    console.log('Starting cleanup of expired payments...');

    // Calculate cutoff time (120 minutes ago)
    const cutoffTime = new Date(Date.now() - 120 * 60 * 1000);

    // Find all pending invoices that are older than 120 minutes
    const expiredInvoices = await db
      .select({
        id: invoices.id,
        bookingId: invoices.bookingId,
        packageId: invoices.packageId,
        teoriId: invoices.teoriId,
        createdAt: invoices.createdAt,
        amount: invoices.amount,
        status: invoices.status
      })
      .from(invoices)
      .where(
        and(
          eq(invoices.status, 'pending'),
          lt(invoices.createdAt, cutoffTime)
        )
      );

    console.log(`Found ${expiredInvoices.length} expired invoices to clean up`);

    let cleanupCount = 0;

    // Process each expired invoice
    for (const invoice of expiredInvoices) {
      try {
        await db.transaction(async (tx) => {
          // 1. Cancel the invoice
          await tx
            .update(invoices)
            .set({
              status: 'cancelled',
              notes: 'Payment timeout - 120 minutes expired (automatic cleanup)',
              updatedAt: new Date()
            })
            .where(eq(invoices.id, invoice.id));

          // 2. Cancel associated booking if it exists
          if (invoice.bookingId) {
            await tx
              .update(bookings)
              .set({
                status: 'cancelled',
                paymentStatus: 'cancelled',
                notes: 'Payment timeout - 120 minutes expired (automatic cleanup)',
                updatedAt: new Date()
              })
              .where(eq(bookings.id, invoice.bookingId));
          }

          // 3. Cancel associated package purchase if it exists
          if (invoice.packageId) {
            // Note: You would need to implement package cancellation logic here
            // depending on your package schema structure
            console.log(`Package cancellation needed for package ${invoice.packageId}`);
          }

          // 4. Cancel associated theory session if it exists
          if (invoice.teoriId) {
            // Note: You would need to implement theory session cancellation logic here
            // depending on your theory session schema structure
            console.log(`Theory session cancellation needed for session ${invoice.teoriId}`);
          }

          cleanupCount++;
          console.log(`Cleaned up invoice ${invoice.id} (amount: ${invoice.amount})`);
        });
      } catch (error) {
        console.error(`Failed to cleanup invoice ${invoice.id}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Cleanup completed. Processed ${cleanupCount} expired invoices.`,
      processedCount: cleanupCount,
      totalFound: expiredInvoices.length
    });

  } catch (error) {
    console.error('Cleanup expired payments error:', error);
    return NextResponse.json(
      { error: 'Failed to process expired payments cleanup' },
      { status: 500 }
    );
  }
}

