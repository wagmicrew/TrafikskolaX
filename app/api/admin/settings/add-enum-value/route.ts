import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuthAPI } from '@/lib/auth/server-auth';

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuthAPI('admin');
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    console.log('Adding swish_payment_verification to email_trigger_type enum...');
    
    // Add the new enum value
    await db.execute('ALTER TYPE email_trigger_type ADD VALUE \'swish_payment_verification\';');
    
    console.log('Successfully added swish_payment_verification to email_trigger_type enum');

    return NextResponse.json({
      message: 'Successfully added swish_payment_verification to email_trigger_type enum'
    });

  } catch (error: any) {
    console.error('Error adding enum value:', error.message);
    
    if (error.message.includes('already exists')) {
      return NextResponse.json({
        message: 'Enum value already exists'
      });
    }
    
    return NextResponse.json({ error: 'Failed to add enum value' }, { status: 500 });
  }
} 