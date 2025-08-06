import { NextResponse } from 'next/server';
import { requireAuthAPI } from '@/lib/auth/server-auth';
import { db } from '@/lib/db';
import { siteSettings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: Request) {
  try {
    const user = await requireAuthAPI('admin');

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if school_phonenumber setting already exists
    const existingSetting = await db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.key, 'school_phonenumber'))
      .limit(1);

    if (existingSetting.length > 0) {
      return NextResponse.json({ 
        message: 'School phonenumber setting already exists',
        exists: true 
      });
    }

    // Insert the school_phonenumber setting
    await db.insert(siteSettings).values({
      key: 'school_phonenumber',
      value: '',
      category: 'general',
      description: 'School phone number for contact information'
    });

    return NextResponse.json({ 
      message: 'School phonenumber setting added successfully',
      exists: false 
    });
  } catch (error) {
    console.error('Error adding school phonenumber setting:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 