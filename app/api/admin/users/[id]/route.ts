import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, bookings, userCredits, userFeedback, internalMessages, teacherAvailability, handledarBookings, packagePurchases } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { requireAuthAPI } from '@/lib/auth/server-auth';
import bcrypt from 'bcryptjs';
import { generateUserDataPdf } from '@/utils/pdfExport';

export const dynamic = 'force-dynamic';

// GET - Get single user
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authUser = await requireAuthAPI('admin');
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;
    
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!user.length) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Don't return password
    const { password, ...userWithoutPassword } = user[0];

    return NextResponse.json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}

// PUT - Update user
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authUser = await requireAuthAPI('admin');
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;
    
    const body = await request.json();

    // Only include provided fields (partial updates per-section)
    const allowedKeys = [
      'firstName', 'lastName', 'email', 'phone', 'role', 'isActive', 'inskriven', 'customPrice',
      'personalNumber', 'address', 'postalCode', 'city', 'dateOfBirth',
      'riskEducation1', 'riskEducation2', 'knowledgeTest', 'drivingTest',
      'sendInternalMessagesToEmail'
    ] as const;

    const updateData: any = { updatedAt: new Date() };

    for (const key of allowedKeys) {
      if (Object.prototype.hasOwnProperty.call(body, key)) {
        updateData[key] = body[key];
      }
    }

    // Map teacherNotes -> notes column if provided
    if (Object.prototype.hasOwnProperty.call(body, 'teacherNotes')) {
      updateData.notes = body.teacherNotes;
    }

    // Hash password only when explicitly provided
    if (Object.prototype.hasOwnProperty.call(body, 'password') && body.password) {
      updateData.password = await bcrypt.hash(body.password, 10);
    }

    // Set inskrivenDate when toggling to true
    if (Object.prototype.hasOwnProperty.call(body, 'inskriven') && body.inskriven === true) {
      updateData.inskrivenDate = new Date();
    }

    const updatedUser = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();

    if (!updatedUser.length) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Don't return password
    const { password: _, ...userWithoutPassword } = updatedUser[0];

    return NextResponse.json({ 
      message: 'User updated successfully',
      user: userWithoutPassword 
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

// DELETE - Delete user and all associated data
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authUser = await requireAuthAPI('admin');
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;
    
    // Get user data before deletion for PDF export
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!user.length) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get all user-related data for PDF export
    const userBookings = await db
      .select()
      .from(bookings)
      .where(eq(bookings.userId, id));

    const userCreditsData = await db
      .select()
      .from(userCredits)
      .where(eq(userCredits.userId, id));

    const userFeedbackData = await db
      .select()
      .from(userFeedback)
      .where(eq(userFeedback.userId, id));

    const handledarBookingsData = await db
      .select()
      .from(handledarBookings)
      .where(eq(handledarBookings.studentId, id));

    // Create PDF export with all user data
    const pdfData = {
      user: user[0],
      bookings: userBookings,
      credits: userCreditsData,
      feedback: userFeedbackData,
      handledarBookings: handledarBookingsData
    };

    // Try to generate PDF, but don't fail if it doesn't work
    let pdfGenerated = false;
    try {
      await generateUserDataPdf(pdfData, `${user[0].firstName}_${user[0].lastName}_${user[0].id}`);
      pdfGenerated = true;
    } catch (pdfError) {
      console.error('Error generating PDF:', pdfError);
      // Continue with deletion even if PDF generation fails
    }

    // Delete all associated data in the correct order (respecting foreign key constraints)
    
    // 1. Delete user feedback
    await db
      .delete(userFeedback)
      .where(eq(userFeedback.userId, id));

    // 2. Delete internal messages where user is sender or receiver
    await db
      .delete(internalMessages)
      .where(eq(internalMessages.fromUserId, id));
    
    await db
      .delete(internalMessages)
      .where(eq(internalMessages.toUserId, id));

    // 3. Delete teacher availability
    await db
      .delete(teacherAvailability)
      .where(eq(teacherAvailability.teacherId, id));

    // 4. Delete user credits (has cascade delete, but being explicit)
    await db
      .delete(userCredits)
      .where(eq(userCredits.userId, id));

    // 5. Delete handledar bookings
    await db
      .delete(handledarBookings)
      .where(eq(handledarBookings.studentId, id));

    // 6. Delete regular bookings
    await db
      .delete(bookings)
      .where(eq(bookings.userId, id));

    // 7. Delete package purchases
    await db
      .delete(packagePurchases)
      .where(eq(packagePurchases.userId, id));

    // 8. Finally delete the user
    const deletedUser = await db
      .delete(users)
      .where(eq(users.id, id))
      .returning();

    if (!deletedUser.length) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      message: 'User and all associated data deleted successfully.',
      pdfGenerated: pdfGenerated,
      pdfFileName: pdfGenerated ? `${user[0].firstName}_${user[0].lastName}_${user[0].id}.pdf` : null
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
