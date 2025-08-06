import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { emailTemplates, emailReceivers } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { sendMail } from '@/lib/mailer/universal-mailer';

type EmailTriggerType = 
  | 'new_user'
  | 'new_booking'
  | 'booking_confirmed'
  | 'payment_reminder'
  | 'payment_confirmed'
  | 'teacher_daily_bookings';

interface NotificationRequest {
  triggerType: EmailTriggerType;
  userId?: string;
  bookingId?: string;
  paymentId?: string;
  customData?: Record<string, any>;
}

export async function POST(request: Request) {
  try {
    const { triggerType, userId, bookingId, paymentId, customData }: NotificationRequest = await request.json();

    // Get active template for this trigger
    const templates = await db
      .select()
      .from(emailTemplates)
      .where(
        and(
          eq(emailTemplates.triggerType, triggerType),
          eq(emailTemplates.isActive, true)
        )
      )
      .limit(1);

    if (templates.length === 0) {
      console.log(`No active template found for trigger: ${triggerType}`);
      return NextResponse.json({ success: false, message: 'No active template found' });
    }

    const template = templates[0];
    
    // Get receivers for this template
    const receivers = await db
      .select()
      .from(emailReceivers)
      .where(eq(emailReceivers.templateId, template.id));

    if (receivers.length === 0) {
      console.log(`No receivers found for template: ${template.id}`);
      return NextResponse.json({ success: false, message: 'No receivers configured' });
    }

    // Get user data if userId is provided
    let userData = null;
    if (userId) {
      const user = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.id, userId),
      });
      if (user) {
        userData = {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        };
      }
    }

    // Get booking data if bookingId is provided
    let bookingData = null;
    if (bookingId) {
      const booking = await db.query.bookings.findFirst({
        where: (bookings, { eq }) => eq(bookings.id, bookingId),
        with: {
          lessonType: true,
          teacher: true,
        },
      });
      
      if (booking) {
        bookingData = {
          id: booking.id,
          scheduledDate: booking.scheduledDate,
          startTime: booking.startTime,
          endTime: booking.endTime,
          status: booking.status,
          paymentStatus: booking.paymentStatus,
          totalPrice: booking.totalPrice,
          lessonTypeName: booking.lessonType?.name || 'Körlektion',
          teacherName: booking.teacher 
            ? `${booking.teacher.firstName} ${booking.teacher.lastName}` 
            : 'Ingen lärare tilldelad',
        };
      }
    }

    // Process template with data
    let emailContent = template.htmlContent;
    let emailSubject = template.subject;

    // Replace placeholders with actual data
    const replacements: Record<string, string> = {
      '{{appUrl}}': process.env.NEXT_PUBLIC_APP_URL || 'https://dintrafikskolahlm.se',
      '{{schoolName}}': 'Din Trafikskola HLM',
      '{{currentYear}}': new Date().getFullYear().toString(),
      ...customData,
    };

    // Add user data if available
    if (userData) {
      replacements['{{user.firstName}}'] = userData.firstName || '';
      replacements['{{user.lastName}}'] = userData.lastName || '';
      replacements['{{user.fullName}}'] = `${userData.firstName || ''} ${userData.lastName || ''}`.trim();
      replacements['{{user.email}}'] = userData.email || '';
    }

    // Add booking data if available
    if (bookingData) {
      replacements['{{booking.id}}'] = bookingData.id;
      replacements['{{booking.scheduledDate}}'] = new Date(bookingData.scheduledDate).toLocaleDateString('sv-SE');
      replacements['{{booking.startTime}}'] = bookingData.startTime;
      replacements['{{booking.endTime}}'] = bookingData.endTime;
      replacements['{{booking.lessonTypeName}}'] = bookingData.lessonTypeName;
      replacements['{{booking.totalPrice}}'] = bookingData.totalPrice.toString();
      replacements['{{booking.status}}'] = bookingData.status;
      replacements['{{booking.paymentStatus}}'] = bookingData.paymentStatus;
      replacements['{{booking.teacherName}}'] = bookingData.teacherName;
    }

    // Apply all replacements
    Object.entries(replacements).forEach(([key, value]) => {
      const regex = new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      emailContent = emailContent.replace(regex, value);
      emailSubject = emailSubject.replace(regex, value);
    });

    // Send emails to all receivers
    const sendPromises = receivers.map(async (receiver) => {
      let toEmail = '';
      
      // Determine recipient email based on receiver type
      switch (receiver.receiverType) {
        case 'student':
          toEmail = userData?.email || '';
          break;
        case 'teacher':
          // For teacher_daily_bookings, we might not have a specific teacher
          if (triggerType === 'teacher_daily_bookings' && customData?.teacherEmail) {
            toEmail = customData.teacherEmail;
          } else if (bookingData?.teacherEmail) {
            toEmail = bookingData.teacherEmail;
          }
          break;
        case 'admin':
          toEmail = process.env.ADMIN_EMAIL || 'admin@dintrafikskolahlm.se';
          break;
        case 'specific_user':
          // For specific users, we'd need to look up the email
          // This is a simplified example
          toEmail = receiver.specificEmail || '';
          break;
      }

      if (!toEmail) {
        console.log(`No email address found for receiver type: ${receiver.receiverType}`);
        return false;
      }

      try {
        await sendMail({
          to: toEmail,
          subject: emailSubject,
          html: emailContent,
        });
        return true;
      } catch (error) {
        console.error(`Failed to send email to ${toEmail}:`, error);
        return false;
      }
    });

    const results = await Promise.all(sendPromises);
    const successCount = results.filter(Boolean).length;
    const totalCount = results.length;

    return NextResponse.json({
      success: true,
      message: `Sent ${successCount} of ${totalCount} notifications`,
      successCount,
      totalCount,
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to send notification' },
      { status: 500 }
    );
  }
}

// Helper function to send a test email
export async function GET() {
  return NextResponse.json({ message: 'Use POST to send notifications' });
}
