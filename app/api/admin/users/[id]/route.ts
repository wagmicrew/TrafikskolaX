import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, bookings, userCredits, userFeedback, internalMessages, teacherAvailability, handledarBookings, packagePurchases, userReports } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { requireAuthAPI } from '@/lib/auth/server-auth';
import bcrypt from 'bcryptjs';
import { generateUserReportBuffer } from '@/lib/pdf/generateUserReport';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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
    const authRes = await requireAuthAPI('admin');
    if (!('success' in authRes) || !authRes.success) {
      return NextResponse.json({ error: authRes.error }, { status: authRes.status });
    }
    const adminUser = authRes.user;
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

    // Read body for export flag (optional)
    let exportPdf = true;
    try {
      const body = await request.json().catch(() => null);
      if (body && typeof body.exportPdf === 'boolean') exportPdf = body.exportPdf;
    } catch {}

    // Prepare PDF data
    const pdfData = {
      user: user[0],
      bookings: userBookings,
      credits: userCreditsData,
      feedback: userFeedbackData,
      handledarBookings: handledarBookingsData,
    };

    // Generate and persist PDF securely (non-public folder)
    let pdfGenerated = false;
    let reportId: string | null = null;
    let pdfFileName: string | null = null;
    if (exportPdf) {
      try {
        const buffer = await generateUserReportBuffer(
          pdfData,
          `${user[0].firstName}_${user[0].lastName}_${user[0].id}`
        );
        const reportsDir = path.join(process.cwd(), 'storage', 'reports');
        await fs.promises.mkdir(reportsDir, { recursive: true });
        const timestamp = new Date()
          .toISOString()
          .replace(/[:.]/g, '-')
          .replace('T', '_')
          .replace('Z', '');
        pdfFileName = `${timestamp}_${user[0].firstName}_${user[0].lastName}_${user[0].id}.pdf`;
        const filePath = path.join(reportsDir, pdfFileName);
        await fs.promises.writeFile(filePath, buffer);

        // Store metadata in DB
        const [report] = await db
          .insert(userReports)
          .values({
            userId: user[0].id,
            createdBy: adminUser.id,
            fileName: pdfFileName,
            filePath,
            fileSize: buffer.length,
            mimeType: 'application/pdf',
            deletedUserEmail: user[0].email,
            deletedUserName: `${user[0].firstName} ${user[0].lastName}`,
          })
          .returning({ id: userReports.id });
        reportId = report?.id || null;
        pdfGenerated = true;
      } catch (pdfError) {
        console.error('Error generating/saving PDF:', pdfError);
        // Continue with deletion even if PDF generation fails
      }
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

    // 8. Delete user reports
    await db
      .delete(userReports)
      .where(eq(userReports.userId, id));

    // 9. Finally delete the user
    const deletedUser = await db
      .delete(users)
      .where(eq(users.id, id))
      .returning();

    if (!deletedUser.length) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      message: 'User and all associated data deleted successfully.',
      pdfGenerated,
      pdfFileName,
      reportId,
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
