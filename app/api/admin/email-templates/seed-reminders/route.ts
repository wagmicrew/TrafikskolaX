import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAPI } from '@/lib/auth/server-auth';
import { db } from '@/lib/db';
import { emailTemplates, emailReceivers } from '@/lib/db/schema/email-templates';
import { eq } from 'drizzle-orm';

type SeedTemplate = {
  triggerType: string;
  subject: string;
  html: string;
  receivers: Array<'student' | 'admin' | 'teacher' | 'specific_user'>;
};

// Modern email template designs using the improved template structure
const modernTemplates: SeedTemplate[] = [
  {
    triggerType: 'new_user',
    subject: 'Välkommen till {{schoolName}}!',
    html: `
      <h1>Välkommen {{user.firstName}}!</h1>
      <p>Ditt konto hos {{schoolName}} är nu skapat. Du kan logga in och komma igång direkt.</p>
      <div style="background-color:#f9fafb; padding:16px; border-radius:8px; margin:16px 0; border-left:4px solid #dc2626;">
        <p style="margin:8px 0;"><strong>Dina inloggningsuppgifter</strong></p>
        <p style="margin:8px 0;"><strong>E‑post:</strong> {{user.email}}</p>
        <p style="margin:8px 0;"><strong>Kundnummer:</strong> {{user.customerNumber}}</p>
      </div>
      <div style="margin-top:16px;">
        <a href="{{appUrl}}/login" data-btn>Öppna kundportalen</a>
      </div>
      <p style="margin-top:16px;">Behöver du hjälp? Kontakta oss så hjälper vi dig.</p>
    `,
    receivers: ['student']
  },
  {
    triggerType: 'new_booking',
    subject: 'Bokningsbekräftelse - {{booking.lessonTypeName}}',
    html: `
      <h1>Tack för din bokning!</h1>
      <p>Hej {{user.firstName}}, din bokning är registrerad.</p>
      <div style="background-color:#f9fafb; padding:16px; border-radius:8px; margin:16px 0;">
        <p style="margin:8px 0;"><strong>Lektion:</strong> {{booking.lessonTypeName}}</p>
        <p style="margin:8px 0;"><strong>Datum:</strong> {{booking.scheduledDate}}</p>
        <p style="margin:8px 0;"><strong>Tid:</strong> {{booking.startTime}} - {{booking.endTime}}</p>
        <p style="margin:8px 0;"><strong>Pris:</strong> {{booking.totalPrice}} kr</p>
      </div>
      <div style="margin-top:12px;">
        <a href="{{appUrl}}/dashboard" data-btn>Visa bokning</a>
      </div>
      <p style="margin-top:16px;">Om du behöver omboka eller har frågor, hör av dig.</p>
    `,
    receivers: ['student', 'admin']
  },
  {
    triggerType: 'booking_confirmed',
    subject: 'Körlektion bekräftad - {{booking.lessonTypeName}}',
    html: `
      <h1>Din körlektion är bekräftad!</h1>
      <p>Hej {{user.firstName}}, din lektion är nu fullständigt bokad och bekräftad.</p>
      <div style="background-color:#dcfce7; padding:16px; border-radius:8px; margin:16px 0; border-left:4px solid #16a34a;">
        <p style="margin:8px 0;"><strong>Lektion:</strong> {{booking.lessonTypeName}}</p>
        <p style="margin:8px 0;"><strong>Datum:</strong> {{booking.scheduledDate}}</p>
        <p style="margin:8px 0;"><strong>Tid:</strong> {{booking.startTime}} - {{booking.endTime}}</p>
        <p style="margin:8px 0;"><strong>Status:</strong> ✅ Bekräftad</p>
      </div>
      <div style="margin-top:12px;">
        <a href="{{appUrl}}/dashboard" data-btn>Mina bokningar</a>
      </div>
      <p style="margin-top:16px;">Vi ser fram emot att träffa dig! Kom i tid och ha med dig körkortstillstånd.</p>
    `,
    receivers: ['student']
  },
  {
    triggerType: 'payment_confirmed',
    subject: 'Betalning bekräftad - {{booking.lessonTypeName}}',
    html: `
      <h1>Tack för din betalning!</h1>
      <p>Hej {{user.firstName}}, vi har tagit emot din betalning.</p>
      <div style="background-color:#dcfce7; padding:16px; border-radius:8px; margin:16px 0; border-left:4px solid #16a34a;">
        <p style="margin:8px 0;"><strong>Boknings‑ID:</strong> {{booking.id}}</p>
        <p style="margin:8px 0;"><strong>Typ:</strong> {{booking.lessonTypeName}}</p>
        <p style="margin:8px 0;"><strong>Datum:</strong> {{booking.scheduledDate}}</p>
        <p style="margin:8px 0;"><strong>Belopp:</strong> {{booking.totalPrice}} kr</p>
        <p style="margin:8px 0;"><strong>Status:</strong> ✅ Betald</p>
      </div>
      <div style="margin-top:12px;">
        <a href="{{appUrl}}/dashboard" data-btn>Öppna Mina sidor</a>
      </div>
      <p style="margin-top:16px;">Din bokning är nu bekräftad. Välkommen!</p>
    `,
    receivers: ['student']
  },
  {
    triggerType: 'payment_reminder',
    subject: 'Påminnelse: Slutför din bokning - {{booking.lessonTypeName}}',
    html: `
      <h1>Påminnelse om betalning</h1>
      <p>Hej {{user.firstName}}, din bokning väntar på betalning för att bekräftas.</p>
      <div style="background-color:#fef3c7; padding:16px; border-radius:8px; margin:16px 0; border-left:4px solid #f59e0b;">
        <p style="margin:8px 0;"><strong>Lektion:</strong> {{booking.lessonTypeName}}</p>
        <p style="margin:8px 0;"><strong>Datum:</strong> {{booking.scheduledDate}}</p>
        <p style="margin:8px 0;"><strong>Tid:</strong> {{booking.startTime}} - {{booking.endTime}}</p>
        <p style="margin:8px 0;"><strong>Belopp:</strong> {{booking.totalPrice}} kr</p>
        <p style="margin:8px 0;"><strong>Swish meddelande:</strong> {{booking.swishUUID}}</p>
      </div>
      <div style="margin-top:12px;">
        <a href="{{appUrl}}/betalning/swish?booking={{booking.id}}" data-btn>Betala nu</a>
      </div>
      <p style="margin-top:16px;"><strong>OBS!</strong> Din bokning kan komma att avbokas om betalning inte sker inom kort.</p>
    `,
    receivers: ['student']
  },
  {
    triggerType: 'awaiting_school_confirmation',
    subject: 'Inväntar bekräftelse - {{booking.lessonTypeName}}',
    html: `
      <h1>Din betalning inväntar bekräftelse</h1>
      <p>Hej {{user.firstName}}, tack för din Swish-betalning!</p>
      <div style="background-color:#fef3c7; padding:16px; border-radius:8px; margin:16px 0; border-left:4px solid #f59e0b;">
        <p style="margin:8px 0;"><strong>Status:</strong> Inväntar skolans bekräftelse</p>
        <p style="margin:8px 0;"><strong>Lektion:</strong> {{booking.lessonTypeName}}</p>
        <p style="margin:8px 0;"><strong>Datum:</strong> {{booking.scheduledDate}}</p>
        <p style="margin:8px 0;"><strong>Referens:</strong> {{booking.swishUUID}}</p>
      </div>
      <div style="margin-top:12px;">
        <a href="{{appUrl}}/dashboard" data-btn>Mina bokningar</a>
      </div>
      <p style="margin-top:16px;">Vi kommer att bekräfta din betalning inom kort och skicka en slutgiltig bekräftelse.</p>
    `,
    receivers: ['student']
  },
  {
    triggerType: 'swish_payment_verification',
    subject: 'Verifiera din Swish-betalning - {{booking.lessonTypeName}}',
    html: `
      <h1>Bekräfta din Swish-betalning</h1>
      <p>Hej {{user.firstName}}, vi har registrerat en betalning från dig via Swish.</p>
      <div style="background-color:#e0f2fe; padding:16px; border-radius:8px; margin:16px 0; border-left:4px solid #0284c7;">
        <p style="margin:8px 0;"><strong>Lektion:</strong> {{booking.lessonTypeName}}</p>
        <p style="margin:8px 0;"><strong>Datum:</strong> {{booking.scheduledDate}}</p>
        <p style="margin:8px 0;"><strong>Belopp:</strong> {{booking.totalPrice}} kr</p>
        <p style="margin:8px 0;"><strong>Referens:</strong> {{booking.swishUUID}}</p>
      </div>
      <div style="margin-top:12px;">
        <a href="{{appUrl}}/verifiera-betalning?booking={{booking.id}}" data-btn>Bekräfta betalning</a>
      </div>
      <p style="margin-top:16px;">Klicka på knappen ovan för att bekräfta att betalningen gäller din bokning.</p>
    `,
    receivers: ['student']
  },
  {
    triggerType: 'booking_reminder',
    subject: 'Påminnelse: Din körlektion imorgon - {{booking.lessonTypeName}}',
    html: `
      <h1>Påminnelse om din körlektion</h1>
      <p>Hej {{user.firstName}}, en påminnelse om din kommande körlektion.</p>
      <div style="background-color:#e0f2fe; padding:16px; border-radius:8px; margin:16px 0; border-left:4px solid #0284c7;">
        <p style="margin:8px 0;"><strong>Lektion:</strong> {{booking.lessonTypeName}}</p>
        <p style="margin:8px 0;"><strong>Datum:</strong> {{booking.scheduledDate}}</p>
        <p style="margin:8px 0;"><strong>Tid:</strong> {{booking.startTime}} - {{booking.endTime}}</p>
        <p style="margin:8px 0;"><strong>Status:</strong> ✅ Bekräftad</p>
      </div>
      <div style="margin-top:12px;">
        <a href="{{appUrl}}/dashboard" data-btn>Mina bokningar</a>
      </div>
      <p style="margin-top:16px;"><strong>Tips:</strong> Kom i tid och ha med dig körkortstillstånd. Vid förseningar, ring oss direkt på {{schoolPhone}}.</p>
    `,
    receivers: ['student']
  },
  {
    triggerType: 'cancelled_booking',
    subject: 'Bokning avbokad - {{booking.lessonTypeName}}',
    html: `
      <h1>Din bokning har avbokats</h1>
      <p>Hej {{user.firstName}}, din bokning har avbokats.</p>
      <div style="background-color:#fee2e2; padding:16px; border-radius:8px; margin:16px 0; border-left:4px solid #dc2626;">
        <p style="margin:8px 0;"><strong>Lektion:</strong> {{booking.lessonTypeName}}</p>
        <p style="margin:8px 0;"><strong>Datum:</strong> {{booking.scheduledDate}}</p>
        <p style="margin:8px 0;"><strong>Tid:</strong> {{booking.startTime}} - {{booking.endTime}}</p>
        <p style="margin:8px 0;"><strong>Status:</strong> ❌ Avbokad</p>
      </div>
      <div style="margin-top:12px;">
        <a href="{{appUrl}}/boka-korning" data-btn>Boka ny tid</a>
      </div>
      <p style="margin-top:16px;">Du kan boka en ny tid när som helst. Kontakta oss om du har frågor.</p>
    `,
    receivers: ['student', 'admin']
  },
  {
    triggerType: 'forgot_password',
    subject: 'Återställ ditt lösenord - {{schoolName}}',
    html: `
      <h1>Återställ ditt lösenord</h1>
      <p>Hej {{user.firstName}}, vi fick en begäran om att återställa lösenordet för ditt konto.</p>
      <div style="background-color:#f9fafb; padding:16px; border-radius:8px; margin:16px 0;">
        <p style="margin:8px 0;"><strong>E-postadress:</strong> {{user.email}}</p>
      </div>
      <div style="margin-top:12px;">
        <a href="{{appUrl}}/reset-password?token={{customData.resetToken}}" data-btn>Återställ lösenord</a>
      </div>
      <p style="margin-top:16px;">Om du inte begärde detta, kan du ignorera detta meddelande. Länken är giltig i 1 timme.</p>
    `,
    receivers: ['student']
  },
  {
    triggerType: 'new_password',
    subject: 'Nytt lösenord skapat - {{schoolName}}',
    html: `
      <h1>Ditt lösenord har ändrats</h1>
      <p>Hej {{user.firstName}}, ditt lösenord har uppdaterats.</p>
      <div style="background-color:#dcfce7; padding:16px; border-radius:8px; margin:16px 0; border-left:4px solid #16a34a;">
        <p style="margin:8px 0;"><strong>Ändrat:</strong> {{currentDate}}</p>
        <p style="margin:8px 0;"><strong>Konto:</strong> {{user.email}}</p>
      </div>
      <div style="margin-top:12px;">
        <a href="{{appUrl}}/login" data-btn>Logga in</a>
      </div>
      <p style="margin-top:16px;">Om du inte gjorde denna ändring, kontakta oss omedelbart på {{schoolPhone}}.</p>
    `,
    receivers: ['student']
  },
  {
    triggerType: 'teacher_daily_bookings',
    subject: 'Dagens bokningar - {{currentDate}}',
    html: `
      <h1>Dina bokningar för idag</h1>
      <p>Hej {{teacher.firstName}}, här är dina bokningar för idag:</p>
      <div style="background-color:#f9fafb; padding:16px; border-radius:8px; margin:16px 0;">
        {{bookingsList}}
      </div>
      <div style="margin-top:12px;">
        <a href="{{appUrl}}/dashboard/teacher" data-btn>Se alla bokningar</a>
      </div>
      <p style="margin-top:16px;">Ha en bra dag!</p>
    `,
    receivers: ['teacher']
  },
  {
    triggerType: 'handledar_booking_confirmed',
    subject: 'Handledarutbildning bekräftad - {{booking.scheduledDate}}',
    html: `
      <h1>Bekräftelse: Handledarutbildning</h1>
      <p>Hej {{user.firstName}}, en handledarutbildning har bokats.</p>
      <div style="background-color:#dcfce7; padding:16px; border-radius:8px; margin:16px 0; border-left:4px solid #16a34a;">
        <p style="margin:8px 0;"><strong>Datum:</strong> {{booking.scheduledDate}}</p>
        <p style="margin:8px 0;"><strong>Tid:</strong> {{booking.startTime}} - {{booking.endTime}}</p>
        <p style="margin:8px 0;"><strong>Typ:</strong> {{booking.lessonTypeName}}</p>
        <p style="margin:8px 0;"><strong>Status:</strong> ✅ Bekräftad</p>
      </div>
      <div style="margin-top:12px;">
        <a href="{{appUrl}}/dashboard" data-btn>Mina bokningar</a>
      </div>
      <p style="margin-top:16px;">Denna bekräftelse skickas även till handledaren.</p>
    `,
    receivers: ['student']
  }
];

export async function POST(_request: NextRequest) {
  try {
    const auth = await requireAuthAPI();
    if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });
    if (auth.user.role !== 'admin') return NextResponse.json({ error: 'Access denied' }, { status: 403 });

    const results: any[] = [];

    // Update/create all modern templates
    for (const t of modernTemplates) {
      const existing = await db
        .select()
        .from(emailTemplates)
        .where(eq(emailTemplates.triggerType, t.triggerType))
        .limit(1);

      let templateId: string;
      if (existing.length) {
        const [updated] = await db
          .update(emailTemplates)
          .set({ 
            subject: t.subject, 
            htmlContent: t.html.trim(), 
            isActive: true, 
            updatedAt: new Date() 
          })
          .where(eq(emailTemplates.id, existing[0].id))
          .returning({ id: emailTemplates.id });
        templateId = updated.id;
        results.push({ trigger: t.triggerType, action: 'updated', id: templateId });
      } else {
        const [inserted] = await db
          .insert(emailTemplates)
          .values({ 
            triggerType: t.triggerType, 
            subject: t.subject, 
            htmlContent: t.html.trim(), 
            isActive: true 
          })
          .returning({ id: emailTemplates.id });
        templateId = inserted.id;
        results.push({ trigger: t.triggerType, action: 'inserted', id: templateId });
      }

      // Clear existing receivers and add new ones
      await db.delete(emailReceivers).where(eq(emailReceivers.templateId, templateId));
      
      // Add receivers for this template
      for (const receiverType of t.receivers) {
        await db.insert(emailReceivers).values({ 
          templateId, 
          receiverType 
        });
      }
    }

    // Update any existing templates that weren't in modernTemplates to use modern wrapper
    const allTemplates = await db.select().from(emailTemplates);
    const modernTriggerTypes = modernTemplates.map(t => t.triggerType);
    const standardized: any[] = [];
    
    for (const tpl of allTemplates as any[]) {
      // Skip templates we just updated with modern designs
      if (modernTriggerTypes.includes(tpl.triggerType)) continue;
      
      const html: string = tpl.htmlContent || '';
      
      // Check if it already has modern design elements
      const hasModernDesign = html.includes('border-radius:8px') && 
                             html.includes('{{schoolPhone}}') && 
                             html.includes('{{schoolEmail}}');
      
      if (hasModernDesign) continue;
      
      // Apply modern wrapper to legacy templates
      const modernizedHtml = html.includes('data-btn') ? html : html.replace(
        /<a\s+href="([^"]*)"[^>]*>([^<]*)<\/a>/g,
        '<a href="$1" data-btn>$2</a>'
      );
      
      await db
        .update(emailTemplates)
        .set({ 
          htmlContent: modernizedHtml,
          updatedAt: new Date() 
        })
        .where(eq(emailTemplates.id, tpl.id));
      standardized.push(tpl.id);
    }

    return NextResponse.json({ 
      success: true, 
      results, 
      modernized: results.length,
      standardized: standardized.length,
      message: `Updated ${results.length} templates with modern design, standardized ${standardized.length} legacy templates`
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to seed templates' }, { status: 500 });
  }
}


