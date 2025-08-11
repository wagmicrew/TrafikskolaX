import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getUserFromRequest } from '@/lib/auth/jwt';

// Helper that supports Authorization header or cookie and uses app-wide JWT secret fallback
async function getUserId(request: NextRequest): Promise<string | null> {
  const user = getUserFromRequest(request);
  return user?.userId || null;
}

// GET - Fetch user profile
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        phone: users.phone,
        personalNumber: users.personalNumber,
        address: users.address,
        postalCode: users.postalCode,
        city: users.city,
        profileImage: users.profileImage,
        dateOfBirth: users.dateOfBirth,
        workplace: users.workplace,
        workPhone: users.workPhone,
        mobilePhone: users.mobilePhone,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user.length) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user: user[0] });

  } catch (error) {
    console.error('Fetch user profile error:', error);
    return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 });
  }
}

// PUT - Update user profile
export async function PUT(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate required fields
    if (!body.firstName || !body.lastName || !body.email) {
      return NextResponse.json({ 
        error: 'First name, last name, and email are required' 
      }, { status: 400 });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json({ 
        error: 'Invalid email format' 
      }, { status: 400 });
    }

    // Check if email is already taken by another user
    const existingUser = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, body.email))
      .limit(1);

    if (existingUser.length && existingUser[0].id !== userId) {
      return NextResponse.json({ 
        error: 'Email is already taken' 
      }, { status: 400 });
    }

    // Prepare update data
    const updateData: any = {
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      phone: body.phone || null,
      personalNumber: body.personalNumber || null,
      address: body.address || null,
      postalCode: body.postalCode || null,
      city: body.city || null,
      workplace: body.workplace || null,
      workPhone: body.workPhone || null,
      mobilePhone: body.mobilePhone || null,
      updatedAt: new Date(),
    };

    // Handle date of birth
    if (body.dateOfBirth) {
      updateData.dateOfBirth = new Date(body.dateOfBirth);
    }

    // Update user profile
    await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId));

    return NextResponse.json({ 
      success: true,
      message: 'Profile updated successfully' 
    });

  } catch (error) {
    console.error('Update user profile error:', error);
    
    // Handle unique constraint violations
    if (error instanceof Error && error.message.includes('unique constraint')) {
      if (error.message.includes('email')) {
        return NextResponse.json({ 
          error: 'Email is already taken' 
        }, { status: 400 });
      }
      if (error.message.includes('personal_number')) {
        return NextResponse.json({ 
          error: 'Personal number is already taken' 
        }, { status: 400 });
      }
    }
    
    return NextResponse.json({ 
      error: 'Failed to update profile' 
    }, { status: 500 });
  }
}
