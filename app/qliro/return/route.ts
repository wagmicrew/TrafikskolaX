import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookings, packagePurchases, handledarBookings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ref = searchParams.get('ref') || '';
    const status = (searchParams.get('status') || '').toLowerCase();

    // Get the correct base URL for redirects
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                   process.env.NEXTAUTH_URL || 
                   'https://www.dintrafikskolahlm.se';

    // If we got a merchant reference (booking_*, handledar_*, package_*), mark accordingly
    if (ref.startsWith('booking_')) {
      const bookingId = ref.replace('booking_', '');
      if (status === 'paid' || status === 'completed') {
        await db.update(bookings).set({ paymentStatus: 'paid', status: 'confirmed', updatedAt: new Date() }).where(eq(bookings.id, bookingId));
      }
      // Redirect to booking confirmation page (same as Swish confirmation)
      const url = new URL(`/booking/confirmation/${bookingId}`, baseUrl);
      url.searchParams.set('payment_method', 'qliro');
      url.searchParams.set('status', status === 'paid' || status === 'completed' ? 'success' : 'failed');
      return NextResponse.redirect(url);
    }
    if (ref.startsWith('handledar_')) {
      const handledarBookingId = ref.replace('handledar_', '');
      if (status === 'paid' || status === 'completed') {
        await db.update(handledarBookings).set({ paymentStatus: 'paid', updatedAt: new Date() }).where(eq(handledarBookings.id, handledarBookingId));
      }
      // Redirect to handledar booking confirmation page
      const url = new URL(`/handledar/confirmation/${handledarBookingId}`, baseUrl);
      url.searchParams.set('payment_method', 'qliro');
      url.searchParams.set('status', status === 'paid' || status === 'completed' ? 'success' : 'failed');
      return NextResponse.redirect(url);
    }
    if (ref.startsWith('package_')) {
      const purchaseId = ref.replace('package_', '');
      if (status === 'paid' || status === 'completed') {
        await db.update(packagePurchases).set({ paymentStatus: 'paid', paidAt: new Date() }).where(eq(packagePurchases.id, purchaseId));
      }
      // Redirect to package purchase confirmation page
      const url = new URL(`/packages-store/confirmation/${purchaseId}`, baseUrl);
      url.searchParams.set('payment_method', 'qliro');
      url.searchParams.set('status', status === 'paid' || status === 'completed' ? 'success' : 'failed');
      return NextResponse.redirect(url);
    }

    // Fallback: redirect to dashboard
    return NextResponse.redirect(new URL('/dashboard/student', baseUrl));
  } catch (e) {
    console.error('Qliro return error:', e);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                   process.env.NEXTAUTH_URL || 
                   'https://www.dintrafikskolahlm.se';
    return NextResponse.redirect(new URL('/dashboard/student', baseUrl));
  }
}



