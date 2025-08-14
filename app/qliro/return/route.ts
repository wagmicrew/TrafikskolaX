import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookings, packagePurchases } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ref = searchParams.get('ref') || '';
    const status = (searchParams.get('status') || '').toLowerCase();

    // If we got a merchant reference (booking_*, package_*), mark accordingly
    if (ref.startsWith('booking_')) {
      const bookingId = ref.replace('booking_', '');
      if (status === 'paid' || status === 'completed') {
        await db.update(bookings).set({ paymentStatus: 'paid', status: 'confirmed', updatedAt: new Date() }).where(eq(bookings.id, bookingId));
      }
      // Redirect to thank-you page regardless; UI will show success/failure toast
      const url = new URL('/payments/qliro/thank-you', request.nextUrl.origin);
      url.searchParams.set('ref', ref);
      if (status) url.searchParams.set('status', status);
      return NextResponse.redirect(url);
    }
    if (ref.startsWith('package_')) {
      const purchaseId = ref.replace('package_', '');
      if (status === 'paid' || status === 'completed') {
        await db.update(packagePurchases).set({ paymentStatus: 'paid', paidAt: new Date() }).where(eq(packagePurchases.id, purchaseId));
      }
      const url = new URL('/payments/qliro/thank-you', request.nextUrl.origin);
      url.searchParams.set('ref', ref);
      if (status) url.searchParams.set('status', status);
      return NextResponse.redirect(url);
    }

    // Fallback: redirect to dashboard
    return NextResponse.redirect(new URL('/dashboard/student', request.nextUrl.origin));
  } catch (e) {
    return NextResponse.redirect(new URL('/dashboard/student', request.nextUrl.origin));
  }
}



