import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuthAPI } from '@/lib/auth/server-auth';

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuthAPI('admin');
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    console.log('Adding school to email_receiver_type enum...');

    // Add school to email_receiver_type enum
    await db.execute(
      "ALTER TYPE email_receiver_type ADD VALUE 'school'"
    );

    console.log('Successfully added school to email_receiver_type enum');

    return NextResponse.json({
      message: 'Successfully added school to email_receiver_type enum'
    });

  } catch (error) {
    console.error('Error adding school to email_receiver_type enum:', error);
    
    // Check if the error is because the value already exists
    if (error instanceof Error && error.message.includes('already exists')) {
      return NextResponse.json({
        message: 'School value already exists in email_receiver_type enum'
      });
    }
    
    return NextResponse.json({ error: 'Failed to add school to email_receiver_type enum' }, { status: 500 });
  }
} 