import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { emailTemplates, emailReceivers } from '@/lib/db/schema/email-templates';
import { eq } from 'drizzle-orm';
import { requireAuthAPI } from '@/lib/auth/server-auth';

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuthAPI('admin');
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    console.log('Updating Swish payment verification template receiver type...');
    
    // Find the existing template
    const existingTemplate = await db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.triggerType, 'swish_payment_verification' as any))
      .limit(1);

    if (existingTemplate.length === 0) {
      return NextResponse.json({ 
        error: 'Swish payment verification template not found. Please add it first.' 
      }, { status: 404 });
    }

    const template = existingTemplate[0];

    // Delete existing admin receiver
    await db
      .delete(emailReceivers)
      .where(eq(emailReceivers.templateId, template.id));

    // Add school receiver
    await db
      .insert(emailReceivers)
      .values({
        templateId: template.id,
        receiverType: 'school'
      });

    console.log('Successfully updated Swish payment verification template to use school receiver');
    
    return NextResponse.json({ 
      message: 'Successfully updated Swish payment verification template to use school receiver',
      templateId: template.id
    });

  } catch (error) {
    console.error('Error updating Swish payment template receiver:', error);
    return NextResponse.json({ error: 'Failed to update template receiver' }, { status: 500 });
  }
} 