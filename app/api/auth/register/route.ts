import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { createAuthResponse } from '@/lib/auth/cookies';
import { type JWTPayload } from '@/lib/auth/jwt';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { EmailService } from '@/lib/email/email-service';
import { generateCustomerNumber } from '@/lib/utils/customer-number';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, firstName, lastName, phone, personalNumber, role = 'student' } = body;

    // Validate input
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Alla obligatoriska fält måste fyllas i' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: 'En användare med denna e-postadress finns redan' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate customer number for student users
    let customerNumber = null;
    if (role === 'student') {
      customerNumber = await generateCustomerNumber();
    }

    // Create user
    const newUser = await db
      .insert(users)
      .values({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone,
        personalNumber,
        role: role as 'student' | 'teacher' | 'admin',
        customerNumber,
      })
      .returning();

    const user = newUser[0];

    // Send welcome email to new user
    try {
      await EmailService.sendTriggeredEmail('new_user', {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        customData: {
          customerNumber: user.customerNumber,
        },
      } as any);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail the registration if email fails
    }

    // Determine redirect URL based on role
    let redirectUrl = '/dashboard';
    switch (user.role) {
      case 'admin':
        redirectUrl = '/dashboard/admin';
        break;
      case 'teacher':
        redirectUrl = '/dashboard/teacher';
        break;
      case 'student':
        redirectUrl = '/dashboard/student';
        break;
      default:
        redirectUrl = '/dashboard';
    }

    // Create JWT payload
    const jwtPayload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    // Create auth response with JWT token in secure cookie
    return createAuthResponse(jwtPayload, {
      redirectUrl,
      user: {
        userId: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        customerNumber: user.customerNumber,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Ett fel uppstod vid registrering' },
      { status: 500 }
    );
  }
}
