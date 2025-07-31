import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookings, users, lessonTypes, cars } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { requireAuthAPI } from '@/lib/auth/server-auth';

export const dynamic = 'force-dynamic';

// GET - Get single booking with related data
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuthAPI('admin');
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;
    
    const booking = await db
      .select({
        id: bookings.id,
        scheduledDate: bookings.scheduledDate,
        startTime: bookings.startTime,
        endTime: bookings.endTime,
        durationMinutes: bookings.durationMinutes,
        transmissionType: bookings.transmissionType,
        status: bookings.status,
        paymentStatus: bookings.paymentStatus,
        paymentMethod: bookings.paymentMethod,
        totalPrice: bookings.totalPrice,
        notes: bookings.notes,
        isGuestBooking: bookings.isGuestBooking,
        guestName: bookings.guestName,
        guestEmail: bookings.guestEmail,
        guestPhone: bookings.guestPhone,
        isCompleted: bookings.isCompleted,
        completedAt: bookings.completedAt,
        feedbackReady: bookings.feedbackReady,
        invoiceNumber: bookings.invoiceNumber,
        invoiceDate: bookings.invoiceDate,
        createdAt: bookings.createdAt,
        updatedAt: bookings.updatedAt,
        // User info
        userName: sql`COALESCE(${users.firstName} || ' ' || ${users.lastName}, ${bookings.guestName})`,
        userEmail: sql`COALESCE(${users.email}, ${bookings.guestEmail})`,
        userPhone: sql`COALESCE(${users.phone}, ${bookings.guestPhone})`,
        userId: bookings.userId,
        // Lesson type info
        lessonTypeName: lessonTypes.name,
        lessonTypePrice: lessonTypes.price,
        // Teacher info
        teacherName: sql`${users.firstName} || ' ' || ${users.lastName}`,
        teacherId: bookings.teacherId,
        // Car info
        carName: cars.name,
        carId: bookings.carId,
      })
      .from(bookings)
      .leftJoin(users, eq(bookings.userId, users.id))
      .leftJoin(lessonTypes, eq(bookings.lessonTypeId, lessonTypes.id))
      .leftJoin(cars, eq(bookings.carId, cars.id))
      .where(eq(bookings.id, id))
      .limit(1);

    if (!booking.length) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    return NextResponse.json({ booking: booking[0] });
  } catch (error) {
    console.error('Error fetching booking:', error);
    return NextResponse.json({ error: 'Failed to fetch booking' }, { status: 500 });
  }
}

// PUT - Update booking
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuthAPI('admin');
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;
    
    const body = await request.json();
    const {
      scheduledDate,
      startTime,
      endTime,
      durationMinutes,
      transmissionType,
      status,
      paymentStatus,
      paymentMethod,
      totalPrice,
      notes,
      teacherId,
      carId,
      isCompleted,
      feedbackReady,
      invoiceNumber,
      invoiceDate
    } = body;

    const updateData: any = {
      scheduledDate,
      startTime,
      endTime,
      durationMinutes,
      transmissionType,
      status,
      paymentStatus,
      paymentMethod,
      totalPrice,
      notes,
      teacherId,
      carId,
      isCompleted,
      feedbackReady,
      invoiceNumber,
      invoiceDate,
      updatedAt: new Date(),
    };

    // Set completion date if marking as completed
    if (isCompleted && !updateData.completedAt) {
      updateData.completedAt = new Date();
    }

    const updatedBooking = await db
      .update(bookings)
      .set(updateData)
      .where(eq(bookings.id, id))
      .returning();

    if (!updatedBooking.length) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      message: 'Booking updated successfully',
      booking: updatedBooking[0] 
    });
  } catch (error) {
    console.error('Error updating booking:', error);
    return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
  }
}

// DELETE - Delete booking (soft delete)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuthAPI('admin');
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;
    
    // Soft delete by setting deletedAt timestamp
    const deletedBooking = await db
      .update(bookings)
      .set({ 
        deletedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(bookings.id, id))
      .returning();

    if (!deletedBooking.length) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      message: 'Booking deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting booking:', error);
    return NextResponse.json({ error: 'Failed to delete booking' }, { status: 500 });
  }
}
