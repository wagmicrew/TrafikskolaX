import { randomBytes } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { requireAuthAPI } from '@/lib/auth/server-auth';
import { EmailService } from '@/lib/email/email-service';

export async function POST(request: NextRequest) {
  try {
    // Ensure admin access
    const authResult = await requireAuthAPI('admin');
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Generate a random password
    const password = randomBytes(8).toString('hex');
    const hashedPassword = await hash(password, 10);

    // Update user with new password
    const result = await db
      .update(users)
      .set({
        password: hashedPassword,
      })
      .where(eq(users.id, userId))
      .returning({ id: users.id, email: users.email, firstName: users.firstName, lastName: users.lastName, role: users.role });

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Send email with new password
    try {
      await EmailService.sendTriggeredEmail('new_password', {
        user: {
          id: result[0].id,
          email: result[0].email,
          firstName: result[0].firstName,
          lastName: result[0].lastName,
          role: result[0].role,
        },
        customData: {
          temporaryPassword: password,
        },
      });
    } catch (emailError) {
      console.error('Failed to send password email:', emailError);
      // Don't fail the password generation if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Password generated successfully',
      user: result[0],
    });
  } catch (error) {
    console.error('Password generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate password' },
      { status: 500 }
    );
  }
}
