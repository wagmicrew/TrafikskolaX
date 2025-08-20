import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { requireAuthAPI } from '@/lib/auth/server-auth';
import bcrypt from 'bcryptjs';
import { generateCustomerNumber } from '@/lib/utils/customer-number';
import { EmailService } from '@/lib/email/email-service';

// POST create student (admin/teacher)
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuthAPI();
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    if (authResult.user.role !== 'admin' && authResult.user.role !== 'teacher') {
      return NextResponse.json({ error: 'Admin or teacher access required' }, { status: 403 });
    }

    const body = await request.json();
    const { firstName, lastName, email, phone, personalNumber } = body;

    if (!firstName || !lastName || !email) {
      return NextResponse.json({ error: 'Förnamn, efternamn och e-post är obligatoriska' }, { status: 400 });
    }

    // Ensure email unique
    const existing = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
    if (existing.length > 0) {
      return NextResponse.json({ error: 'E-postadressen används redan' }, { status: 400 });
    }

    // Generate a random password
    const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(randomPassword, 12);
    
    // Generate customer number for student
    const customerNumber = await generateCustomerNumber();

    const values = {
      email: email.toLowerCase(),
      password: hashedPassword,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone?.trim() || undefined,
      personalNumber: personalNumber?.trim() || undefined,
      role: 'student' as 'student',
      isActive: true,
      customerNumber,
      inskriven: false,
    } as const;

    const inserted = await db.insert(users).values(values).returning();
    const created = inserted[0];
    
    // Remove password from response
    const { password: _omit, ...userWithoutPassword } = created as any;

    // Send welcome email using the email service
    try {
      await EmailService.sendTriggeredEmail('new_user', {
        user: {
          id: created.id,
          email: email,
          firstName: firstName,
          lastName: lastName,
          role: 'student'
        },
        customData: {
          password: randomPassword,
          customerNumber
        }
      });
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail the user creation if email fails
    }

    return NextResponse.json({ 
      message: 'Student skapad framgångsrikt', 
      user: userWithoutPassword 
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating student:', error);
    return NextResponse.json({ error: 'Internt serverfel' }, { status: 500 });
  }
}
