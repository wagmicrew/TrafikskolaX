import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { internalMessages, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { bookingId, userId } = await request.json();
    const { id } = await params;

    // Get user info for message
    const user = await db
      .select({
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (user.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get all admin and teacher users to send message to
    const adminsAndTeachers = await db
      .select({
        id: users.id,
      })
      .from(users)
      .where(eq(users.role, 'admin'));

    // Create internal messages for all admins
    const messages = adminsAndTeachers.map(admin => ({
      fromUserId: userId,
      toUserId: admin.id,
      subject: 'Betalningsbekräftelse från student',
      message: `Studenten ${user[0].firstName} ${user[0].lastName} (${user[0].email}) har bekräftat betalning för bokning ${id}. Vänligen verifiera betalningen i Swish och uppdatera bokningsstatus.`,
      messageType: 'payment_confirmation',
      bookingId: id,
    }));

    if (messages.length > 0) {
      await db.insert(internalMessages).values(messages);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Betalningsbekräftelse skickad till administratörer' 
    });
  } catch (error) {
    console.error('Error sending payment confirmation:', error);
    return NextResponse.json(
      { error: 'Ett fel uppstod vid skickande av betalningsbekräftelse' }, 
      { status: 500 }
    );
  }
}
