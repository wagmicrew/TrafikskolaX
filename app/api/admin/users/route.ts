import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { requireAuthAPI } from '@/lib/auth/server-auth';
import bcrypt from 'bcryptjs';
import { generateCustomerNumber } from '@/lib/utils/customer-number';

// GET all users
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuthAPI('admin');
    
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const allUsers = await db.select().from(users);
    return NextResponse.json(allUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST create user (admin)
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuthAPI('admin');
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const body = await request.json();
    const { email, password, firstName, lastName, phone, role = 'student' } = body;

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json({ error: 'Alla obligatoriska fält måste fyllas i' }, { status: 400 });
    }

    // Ensure email unique
    const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existing.length > 0) {
      return NextResponse.json({ error: 'E-postadressen används redan' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const values: any = {
      email,
      password: hashedPassword,
      firstName,
      lastName,
      phone,
      role,
      isActive: true,
    };
    if (role === 'student') {
      values.customerNumber = await generateCustomerNumber();
    }

    const inserted = await db.insert(users).values(values).returning();
    const created = inserted[0];
    const { password: _omit, ...withoutPwd } = created as any;
    return NextResponse.json({ message: 'Användare skapad', user: withoutPwd }, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Internt serverfel' }, { status: 500 });
  }
}

// PUT update user
export async function PUT(request: NextRequest) {
  try {
    const authResult = await requireAuthAPI('admin');
    
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const body = await request.json();
    const { id, name, email, role, inskriven, customPrice, password } = body;

    const updateData: any = {
      name,
      email,
      role,
      inskriven,
      customPrice: customPrice ? parseFloat(customPrice) : null,
    };

    // Update inskrivenDate when inskriven status changes
    if (inskriven === true) {
      const existingUser = await db.select().from(users).where(eq(users.id, id)).limit(1);
      if (existingUser[0] && !existingUser[0].inskriven) {
        updateData.inskrivenDate = new Date();
      }
    } else if (inskriven === false) {
      updateData.inskrivenDate = null;
    }

    // Hash password if provided
    if (password && password.trim() !== '') {
      updateData.password = await bcrypt.hash(password, 10);
    }

    await db.update(users).set(updateData).where(eq(users.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE user
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireAuthAPI('admin');
    
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    await db.delete(users).where(eq(users.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH toggle inskriven status
export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requireAuthAPI('admin');
    
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const body = await request.json();
    const { id, inskriven } = body;

    const updateData: any = { inskriven };
    
    // Set inskrivenDate when enabling inskriven
    if (inskriven === true) {
      updateData.inskrivenDate = new Date();
    } else {
      updateData.inskrivenDate = null;
    }

    await db.update(users).set(updateData).where(eq(users.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error toggling inskriven:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
