import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { sendTestEmail } from '@/lib/email/notifications';

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token');

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const payload = await verifyToken(token.value);
    const currentUser = await db
      .select()
      .from(users)
      .where(eq(users.id, payload.userId))
      .limit(1);

    if (!currentUser.length || currentUser[0].role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { email, userId } = body;

    if (!email && !userId) {
      return NextResponse.json({ error: 'Email or userId is required' }, { status: 400 });
    }

    let targetEmail = email;

    // If userId is provided, get the user's email
    if (userId && !email) {
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user.length) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      targetEmail = user[0].email;
    }

    // Send test email
    await sendTestEmail(targetEmail);

    return NextResponse.json({ 
      success: true, 
      message: `Test email sent successfully to ${targetEmail}` 
    });

  } catch (error) {
    console.error('Error sending test email:', error);
    return NextResponse.json({ 
      error: 'Failed to send test email',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
