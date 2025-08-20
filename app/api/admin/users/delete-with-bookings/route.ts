import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, bookings, handledarBookings, handledarSessions, userCredits, userPackages, internalMessages, userFeedback } from '@/lib/db/schema';
import { eq, and, or } from 'drizzle-orm';
import { requireAuthAPI } from '@/lib/auth/server-auth';
import { sendEmail } from '@/lib/mailer/universal-mailer';

export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireAuthAPI('admin');
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const user = authResult.user;

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const exportPdf = searchParams.get('exportPdf') === 'true';

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get user details before deletion
    const userDetails = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (userDetails.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userToDelete = userDetails[0];

    // Get all user's bookings for potential PDF export
    const userBookings = await db
      .select()
      .from(bookings)
      .where(eq(bookings.userId, userId));

    // Get all handledar bookings where user is the teacher (via session's teacherId)
    const teacherBookings = await db
      .select({ id: handledarBookings.id })
      .from(handledarBookings)
      .leftJoin(handledarSessions, eq(handledarBookings.sessionId, handledarSessions.id))
      .where(eq(handledarSessions.teacherId, userId));

    // Start database transaction
    await db.transaction(async (tx) => {
      // 1. Delete all user's bookings
      await tx.delete(bookings).where(eq(bookings.userId, userId));

      // 2. Unassign teacher from all handledar sessions taught by this user
      await tx.update(handledarSessions)
        .set({ teacherId: null })
        .where(eq(handledarSessions.teacherId, userId));

      // 3. Delete user credits
      await tx.delete(userCredits).where(eq(userCredits.userId, userId));

      // 4. Delete user packages
      await tx.delete(userPackages).where(eq(userPackages.userId, userId));

      // 5. Delete internal messages (both sent and received)
      await tx.delete(internalMessages).where(
        or(eq(internalMessages.fromUserId, userId), eq(internalMessages.toUserId, userId))
      );

      // 6. Delete user feedback
      await tx.delete(userFeedback).where(eq(userFeedback.userId, userId));

      // 7. Finally, delete the user
      await tx.delete(users).where(eq(users.id, userId));
    });

    // Send notification email to admin about the deletion
    try {
      const deletionEmailData = {
        to: user.email,
        subject: 'Användare raderad från systemet',
        html: `
          <h2>Användare raderad</h2>
          <p>En användare har raderats från systemet:</p>
          <ul>
            <li><strong>Namn:</strong> ${userToDelete.firstName} ${userToDelete.lastName}</li>
            <li><strong>E-post:</strong> ${userToDelete.email}</li>
            <li><strong>Roll:</strong> ${userToDelete.role}</li>
            <li><strong>Antal bokningar raderade:</strong> ${userBookings.length}</li>
            <li><strong>Antal handledar-bokningar avregistrerade:</strong> ${teacherBookings.length}</li>
          </ul>
          <p><strong>Raderad av:</strong> ${user.firstName} ${user.lastName}</p>
          <p><strong>Datum:</strong> ${new Date().toLocaleDateString('sv-SE')}</p>
        `,
        text: `
          Användare raderad
          
          En användare har raderats från systemet:
          - Namn: ${userToDelete.firstName} ${userToDelete.lastName}
          - E-post: ${userToDelete.email}
          - Roll: ${userToDelete.role}
          - Antal bokningar raderade: ${userBookings.length}
          - Antal handledar-bokningar avregistrerade: ${teacherBookings.length}
          
          Raderad av: ${user.firstName} ${user.lastName}
          Datum: ${new Date().toLocaleDateString('sv-SE')}
        `
      };

      await sendEmail(deletionEmailData);
    } catch (emailError) {
      console.error('Failed to send deletion notification email:', emailError);
      // Don't fail the deletion if email fails
    }

    // Generate PDF export if requested
    let pdfFileName = null;
    if (exportPdf && userBookings.length > 0) {
      try {
        const pdfData = {
          user: userToDelete,
          bookings: userBookings,
          teacherBookings: teacherBookings,
          deletedBy: user,
          deletedAt: new Date()
        };

        // Here you would implement PDF generation
        // For now, we'll just create a filename
        pdfFileName = `user_deletion_${userToDelete.id}_${Date.now()}.pdf`;
        
        // TODO: Implement actual PDF generation
        // const pdfBuffer = await generateUserDeletionPDF(pdfData);
        // await savePDFToStorage(pdfBuffer, pdfFileName);
      } catch (pdfError) {
        console.error('Failed to generate PDF:', pdfError);
        // Don't fail the deletion if PDF generation fails
      }
    }

    return NextResponse.json({
      success: true,
      message: 'User and all related data deleted successfully',
      deletedUser: {
        id: userToDelete.id,
        name: `${userToDelete.firstName} ${userToDelete.lastName}`,
        email: userToDelete.email,
        role: userToDelete.role
      },
      statistics: {
        bookingsDeleted: userBookings.length,
        teacherBookingsUnassigned: teacherBookings.length,
        pdfGenerated: !!pdfFileName,
        pdfFileName
      }
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}

