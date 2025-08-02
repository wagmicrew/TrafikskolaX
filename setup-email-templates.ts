import { db } from './lib/db';
import { emailTemplates, emailReceivers } from './lib/db/schema';
import { eq } from 'drizzle-orm';

const templates = [
  {
    triggerType: 'new_user' as const,
    subject: 'Välkommen till Din Trafikskola HLM - Dina inloggningsuppgifter',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #dc2626;">Välkommen till Din Trafikskola HLM!</h1>
        <p>Ditt konto har skapats framgångsrikt. Här är dina inloggningsuppgifter:</p>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>E-post:</strong> {{user.email}}</p>
          <p><strong>Tillfälligt lösenord:</strong> {{customData.temporaryPassword}}</p>
        </div>
        <p>Vi rekommenderar att du ändrar ditt lösenord efter första inloggningen.</p>
        <p><a href="{{baseUrl}}/inloggning" style="background-color: #dc2626; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Logga in här</a></p>
        <p>Med vänliga hälsningar,<br>Din Trafikskola HLM</p>
      </div>
    `,
    receiverType: 'student' as const
  },
  {
    triggerType: 'new_booking' as const,
    subject: 'Bokningsbekräftelse - Din Trafikskola HLM',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #dc2626;">Din bokning är registrerad!</h1>
        <p>Tack för din bokning hos Din Trafikskola HLM.</p>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Bokningsdetaljer:</h3>
          <p><strong>Datum:</strong> {{booking.scheduledDate}}</p>
          <p><strong>Tid:</strong> {{booking.startTime}} - {{booking.endTime}}</p>
          <p><strong>Typ:</strong> {{booking.lessonTypeName}}</p>
          <p><strong>Pris:</strong> {{booking.totalPrice}} kr</p>
        </div>
        <p>Din bokning är nu reserverad och väntar på betalning.</p>
        <p>Med vänliga hälsningar,<br>Din Trafikskola HLM</p>
      </div>
    `,
    receiverType: 'student' as const
  },
  {
    triggerType: 'awaiting_school_confirmation' as const,
    subject: 'Inväntar bekräftelse - Din Trafikskola HLM',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #f59e0b;">Din betalning inväntar bekräftelse</h1>
        <p>Tack för din Swish-betalning!</p>
        <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Status:</strong> Inväntar skolans bekräftelse</p>
          <p><strong>Referens:</strong> {{booking.swishUUID}}</p>
        </div>
        <p>Vi kommer att bekräfta din betalning inom kort och skicka en slutgiltig bekräftelse.</p>
        <p>Om du har några frågor, kontakta oss gärna.</p>
        <p>Med vänliga hälsningar,<br>Din Trafikskola HLM</p>
      </div>
    `,
    receiverType: 'student' as const
  },
  {
    triggerType: 'payment_confirmed' as const,
    subject: 'Betalning bekräftad - Din Trafikskola HLM',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #16a34a;">Din betalning är bekräftad!</h1>
        <p>Vi har mottagit och bekräftat din betalning.</p>
        <div style="background-color: #d1fae5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Status:</strong> ✅ Betald och bekräftad</p>
          <p><strong>Belopp:</strong> {{booking.totalPrice}} kr</p>
        </div>
        <p>Din körlektion är nu fullständigt bokad och bekräftad.</p>
        <p>Med vänliga hälsningar,<br>Din Trafikskola HLM</p>
      </div>
    `,
    receiverType: 'student' as const
  },
  {
    triggerType: 'booking_confirmed' as const,
    subject: 'Körlektion bekräftad - Din Trafikskola HLM',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #16a34a;">Din körlektion är bekräftad!</h1>
        <p>Välkommen till din körlektion hos Din Trafikskola HLM.</p>
        <div style="background-color: #d1fae5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Bekräftade uppgifter:</h3>
          <p><strong>Datum:</strong> {{booking.scheduledDate}}</p>
          <p><strong>Tid:</strong> {{booking.startTime}} - {{booking.endTime}}</p>
          <p><strong>Typ:</strong> {{booking.lessonTypeName}}</p>
          <p><strong>Status:</strong> ✅ Bekräftad</p>
        </div>
        <p>Vi ser fram emot att träffa dig!</p>
        <p>Med vänliga hälsningar,<br>Din Trafikskola HLM</p>
      </div>
    `,
    receiverType: 'student' as const
  },
  {
    triggerType: 'payment_reminder' as const,
    subject: 'Påminnelse: Slutför din bokning - Din Trafikskola HLM',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #dc2626;">Påminnelse: Din bokning väntar på betalning</h1>
        <p>Din bokning är reserverad men behöver betalas för att bekräftas.</p>
        <div style="background-color: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Betalningsinformation:</h3>
          <p><strong>Swish-nummer:</strong> {{customData.swishNumber}}</p>
          <p><strong>Belopp:</strong> {{booking.totalPrice}} kr</p>
          <p><strong>Meddelande:</strong> {{booking.swishUUID}}</p>
        </div>
        <p style="color: #dc2626;"><strong>OBS!</strong> Din bokning avbokas automatiskt om betalning inte sker inom 10 minuter.</p>
        <p>Med vänliga hälsningar,<br>Din Trafikskola HLM</p>
      </div>
    `,
    receiverType: 'student' as const
  }
];

async function setupEmailTemplates() {
  try {
    for (const template of templates) {
      // Check if template already exists
      const existing = await db
        .select()
        .from(emailTemplates)
        .where(eq(emailTemplates.triggerType, template.triggerType))
        .limit(1);

      if (existing.length === 0) {
        // Create template
        const [newTemplate] = await db
          .insert(emailTemplates)
          .values({
            triggerType: template.triggerType,
            subject: template.subject,
            htmlContent: template.htmlContent,
            isActive: true
          })
          .returning();

        // Create receiver
        await db
          .insert(emailReceivers)
          .values({
            templateId: newTemplate.id,
            receiverType: template.receiverType
          });

        console.log(`Created template: ${template.triggerType}`);
      } else {
        console.log(`Template already exists: ${template.triggerType}`);
      }
    }

    console.log('\nEmail templates setup complete!');
  } catch (error) {
    console.error('Error setting up email templates:', error);
  } finally {
    process.exit();
  }
}

setupEmailTemplates();
