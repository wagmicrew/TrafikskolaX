import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/server-auth';
import { db } from '@/lib/db';
import { users, bookings, handledarBookings } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    // Ensure admin access
    await requireAuth('admin');

    const { teacherId } = await request.json();

    if (!teacherId) {
      return NextResponse.json(
        { error: 'Teacher ID is required' },
        { status: 400 }
      );
    }

    // Check if teacher exists and is actually a teacher
    const teacher = await db
      .select()
      .from(users)
      .where(and(eq(users.id, teacherId), eq(users.role, 'teacher')))
      .limit(1);

    if (teacher.length === 0) {
      return NextResponse.json(
        { error: 'Teacher not found or user is not a teacher' },
        { status: 404 }
      );
    }

    // Start a transaction
    await db.transaction(async (tx) => {
      // 1. Unassign teacher from all regular bookings
      await tx
        .update(bookings)
        .set({ teacherId: null })
        .where(eq(bookings.teacherId, teacherId));

      // 2. Unassign teacher from all handledar bookings
      await tx
        .update(handledarBookings)
        .set({ teacherId: null })
        .where(eq(handledarBookings.teacherId, teacherId));

      // 3. Delete the teacher user
      await tx
        .delete(users)
        .where(eq(users.id, teacherId));
    });

    return NextResponse.json({
      message: 'Teacher removed successfully',
      teacherId,
      unassignedBookings: true
    });

  } catch (error) {
    console.error('Error removing teacher:', error);
    return NextResponse.json(
      { error: 'Failed to remove teacher' },
      { status: 500 }
    );
  }
}
