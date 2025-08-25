import { NextRequest, NextResponse } from 'next/server';
import { EnhancedEmailService } from '@/lib/email/enhanced-email-service';
import { getServerUser } from '@/lib/auth/server-auth';
import { db } from '@/lib/db';
import { siteSettings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lessonTypeId, lessonTypeName } = body;

    if (!lessonTypeId || !lessonTypeName) {
      return NextResponse.json(
        { error: 'Lesson type ID and name are required' },
        { status: 400 }
      );
    }

    // Include logged-in user if available (public endpoint)
    const user = await getServerUser();

    // Try template-first using EnhancedEmailService trigger
    const triggerSent = await EnhancedEmailService.sendTriggeredEmail('teori_session_request', {
      user: user
        ? {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
          }
        : undefined,
      customData: {
        lessonTypeId,
        lessonTypeName,
        requestedAt: new Date().toLocaleString('sv-SE'),
      },
      admin: { email: process.env.ADMIN_EMAIL || '' },
      school: { email: '' },
    });

    if (!triggerSent) {
      // Fallback to direct email to school
      const schoolEmailSetting = await db
        .select()
        .from(siteSettings)
        .where(eq(siteSettings.key, 'school_email'))
        .limit(1);
      const schoolEmail = schoolEmailSetting[0]?.value || 'info@dintrafikskolahlm.se';

      const userLine = user
        ? `${user.firstName} ${user.lastName} (${user.email})`
        : 'Gäst (ej inloggad)';

      const html = `
        <h2>Förfrågan om teorisession</h2>
        <p>En användare har begärt att bli meddelad när nya teorisessioner blir tillgängliga.</p>
        <ul>
          <li><strong>Lektionstyp:</strong> ${lessonTypeName}</li>
          <li><strong>Lektionstyp ID:</strong> ${lessonTypeId}</li>
          <li><strong>Användare:</strong> ${userLine}</li>
          <li><strong>Tidpunkt:</strong> ${new Date().toLocaleString('sv-SE')}</li>
        </ul>
        <p>Överväg att skapa nya sessioner för denna lektionstyp för att möta efterfrågan.</p>
      `;

      await EnhancedEmailService.sendEmail({
        to: schoolEmail,
        subject: `Förfrågan om teorisession: ${lessonTypeName}`,
        html,
        messageType: 'general',
        userId: user?.id,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Förfrågan skickad till skolan'
    });

  } catch (error) {
    console.error('Error sending teori session request:', error);
    return NextResponse.json(
      { error: 'Kunde inte skicka förfrågan' },
      { status: 500 }
    );
  }
}
