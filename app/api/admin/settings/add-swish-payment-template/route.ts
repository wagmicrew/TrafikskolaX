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

    console.log('Adding Swish payment verification email template...');
    
    // Check if template already exists
    const existingTemplate = await db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.triggerType, 'swish_payment_verification'))
      .limit(1);

    if (existingTemplate.length > 0) {
      return NextResponse.json({ 
        message: 'Swish payment verification email template already exists', 
        templateId: existingTemplate[0].id 
      });
    }

    // Insert the email template
    const [template] = await db
      .insert(emailTemplates)
      .values({
        triggerType: 'swish_payment_verification',
        subject: 'Swish betalning väntar på verifiering - {{schoolName}}',
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Swish betalning väntar på verifiering</h2>
            <p>Hej!</p>
            <p>En Swish betalning har gjorts för följande bokning och väntar på verifiering:</p>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Bokningsinformation:</h3>
              <p><strong>Boknings-ID:</strong> {{booking.id}}</p>
              <p><strong>Typ:</strong> {{booking.lessonTypeName}}</p>
              <p><strong>Datum:</strong> {{booking.scheduledDate}}</p>
              <p><strong>Tid:</strong> {{booking.startTime}} - {{booking.endTime}}</p>
              <p><strong>Belopp:</strong> {{booking.totalPrice}} SEK</p>
              <p><strong>Swish UUID:</strong> {{booking.swishUUID}}</p>
            </div>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Kundinformation:</h3>
              <p><strong>Namn:</strong> {{user.firstName}} {{user.lastName}}</p>
              <p><strong>E-post:</strong> {{user.email}}</p>
            </div>
            <p>Vänligen kontrollera Swish-appen för att verifiera betalningen och bekräfta bokningen.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{appUrl}}/dashboard/admin/bookings" 
                 style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Gå till admin-panel
              </a>
            </div>
            <p style="color: #666; font-size: 12px;">Detta är ett automatiskt meddelande från {{schoolName}}.</p>
          </div>
        `,
        isActive: true
      })
      .returning();

    // Add school as receiver
    await db
      .insert(emailReceivers)
      .values({
        templateId: template.id,
        receiverType: 'school'
      });

    console.log('Swish payment verification email template added successfully');
    console.log('Template ID:', template.id);
    
    return NextResponse.json({ 
      message: 'Swish payment verification email template added successfully', 
      templateId: template.id 
    });

  } catch (error) {
    console.error('Error adding Swish payment email template:', error);
    return NextResponse.json({ error: 'Failed to add email template' }, { status: 500 });
  }
} 