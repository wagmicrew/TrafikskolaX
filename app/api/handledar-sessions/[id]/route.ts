import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { handledarSessions, handledarBookings, internalMessages, users } from '@/lib/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { requireAuthAPI, getServerUser } from '@/lib/auth/server-auth';

// GET endpoint to fetch a specific handledar session by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const sessionId = resolvedParams.id;

    // Fetch the session data
    const session = await db
      .select()
      .from(handledarSessions)
      .where(eq(handledarSessions.id, sessionId))
      .limit(1);

    if (!session || session.length === 0) {
      return NextResponse.json({ error: 'Handledar session not found' }, { status: 404 });
    }

    // Get the count of bookings for this session
    const bookingsCount = await db
      .select({ count: handledarBookings.id })
      .from(handledarBookings)
      .where(eq(handledarBookings.sessionId, sessionId))
      .execute();

    return NextResponse.json({
      session: session[0],
      bookingsCount: bookingsCount.length || 0
    });
  } catch (error) {
    console.error('Error fetching handledar session:', error);
    return NextResponse.json({ error: 'Failed to fetch handledar session' }, { status: 500 });
  }
}

// DELETE endpoint to delete a handledar session
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate and authorize (only admins should be able to delete sessions)
    const authResult = await requireAuthAPI('admin');
    
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    
    const currentUser = authResult.user;

    // We already verified the user is an admin in the requireAuthAPI call
    // No need to check again

    const sessionId = params.id;

    // Check if session exists
    const existingSession = await db
      .select()
      .from(handledarSessions)
      .where(eq(handledarSessions.id, sessionId))
      .limit(1);

    if (!existingSession || existingSession.length === 0) {
      return NextResponse.json({ error: 'Handledar session not found' }, { status: 404 });
    }

    // Check if the session has any bookings
    const existingBookings = await db
      .select()
      .from(handledarBookings)
      .where(eq(handledarBookings.sessionId, sessionId))
      .limit(1);

    if (existingBookings && existingBookings.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete handledar session with active bookings. Please cancel all bookings first.' },
        { status: 400 }
      );
    }

    // Delete the session
    await db
      .delete(handledarSessions)
      .where(eq(handledarSessions.id, sessionId));

    // Find admin user to send notification to
    const adminUsers = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.role, 'admin'))
      .limit(1);
    
    const adminUserId = adminUsers.length > 0 ? adminUsers[0].id : currentUser.id; // Fall back to self if no admin

    // Create an internal message about the deletion
    await db.insert(internalMessages).values({
      fromUserId: currentUser.id,
      toUserId: adminUserId,
      subject: 'Handledar Session Deleted',
      message: `Handledar Session ID: ${sessionId} was deleted by ${currentUser.firstName || currentUser.email || 'User'} (${currentUser.id})`,
      messageType: 'handledar_session_deleted',
    });

    return NextResponse.json({ 
      message: 'Handledar session deleted successfully',
      sessionId
    });
  } catch (error) {
    console.error('Error deleting handledar session:', error);
    return NextResponse.json(
      { error: 'Failed to delete handledar session' },
      { status: 500 }
    );
  }
}
