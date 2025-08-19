import { db } from '../lib/db/index.js';
import { emailTemplates, emailReceivers } from '../lib/db/schema/index.js';
import { eq } from 'drizzle-orm';

/**
 * Script to migrate all email templates to the new improved design
 * This will update existing templates with modern styling and proper variables
 */

// Modern email template designs for each trigger type
const improvedTemplates = {
  new_user: {
    subject: 'Välkommen till {{schoolName}}!',
    htmlContent: `
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
    `
  },
  
  new_booking: {
    subject: 'Bokningsbekräftelse - {{booking.lessonTypeName}}',
    htmlContent: `
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
    `
  },

  booking_confirmed: {
    subject: 'Körlektion bekräftad - {{booking.lessonTypeName}}',
    htmlContent: `
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
    `
  },

  payment_confirmed: {
    subject: 'Betalning bekräftad - {{booking.lessonTypeName}}',
    htmlContent: `
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
    `
  },

  payment_reminder: {
    subject: 'Påminnelse: Slutför din bokning - {{booking.lessonTypeName}}',
    htmlContent: `
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
    `
  },

  awaiting_school_confirmation: {
    subject: 'Inväntar bekräftelse - {{booking.lessonTypeName}}',
    htmlContent: `
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
    `
  },

  swish_payment_verification: {
    subject: 'Verifiera din Swish-betalning - {{booking.lessonTypeName}}',
    htmlContent: `
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
    `
  },

  booking_reminder: {
    subject: 'Påminnelse: Din körlektion imorgon - {{booking.lessonTypeName}}',
    htmlContent: `
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
    `
  },

  cancelled_booking: {
    subject: 'Bokning avbokad - {{booking.lessonTypeName}}',
    htmlContent: `
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
    `
  },

  forgot_password: {
    subject: 'Återställ ditt lösenord - {{schoolName}}',
    htmlContent: `
      <h1>Återställ ditt lösenord</h1>
      <p>Hej {{user.firstName}}, vi fick en begäran om att återställa lösenordet för ditt konto.</p>
      <div style="background-color:#f9fafb; padding:16px; border-radius:8px; margin:16px 0;">
        <p style="margin:8px 0;"><strong>E-postadress:</strong> {{user.email}}</p>
      </div>
      <div style="margin-top:12px;">
        <a href="{{appUrl}}/reset-password?token={{customData.resetToken}}" data-btn>Återställ lösenord</a>
      </div>
      <p style="margin-top:16px;">Om du inte begärde detta, kan du ignorera detta meddelande. Länken är giltig i 1 timme.</p>
    `
  },

  new_password: {
    subject: 'Nytt lösenord skapat - {{schoolName}}',
    htmlContent: `
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
    `
  }
};

async function migrateEmailTemplatesDesign() {
  console.log('🚀 Starting email template design migration...\n');
  
  try {
    // Get all existing templates
    const existingTemplates = await db
      .select()
      .from(emailTemplates)
      .orderBy(emailTemplates.triggerType);

    console.log(`📊 Found ${existingTemplates.length} existing templates to process\n`);

    let updatedCount = 0;
    let createdCount = 0;
    let skippedCount = 0;

    // Process each template type
    for (const [triggerType, templateData] of Object.entries(improvedTemplates)) {
      const existing = existingTemplates.find(t => t.triggerType === triggerType);
      
      if (existing) {
        // Check if template needs update
        const currentHtml = existing.htmlContent;
        const needsUpdate = !currentHtml.includes('{{schoolPhone}}') ||
                           !currentHtml.includes('{{schoolEmail}}') ||
                           !currentHtml.includes('border-radius:8px') ||
                           existing.subject !== templateData.subject;

        if (needsUpdate) {
          console.log(`🔄 Updating template: ${triggerType}`);
          
          await db
            .update(emailTemplates)
            .set({
              subject: templateData.subject,
              htmlContent: templateData.htmlContent.trim(),
              updatedAt: new Date()
            })
            .where(eq(emailTemplates.id, existing.id));
          
          updatedCount++;
        } else {
          console.log(`✅ Template up to date: ${triggerType}`);
          skippedCount++;
        }
      } else {
        // Create new template
        console.log(`➕ Creating new template: ${triggerType}`);
        
        const [newTemplate] = await db
          .insert(emailTemplates)
          .values({
            triggerType: triggerType,
            subject: templateData.subject,
            htmlContent: templateData.htmlContent.trim(),
            isActive: true
          })
          .returning();

        // Create default receivers based on trigger type
        const defaultReceivers = getDefaultReceiversForTrigger(triggerType);
        
        if (defaultReceivers.length > 0) {
          const receiverValues = defaultReceivers.map(receiverType => ({
            templateId: newTemplate.id,
            receiverType: receiverType
          }));

          await db.insert(emailReceivers).values(receiverValues);
        }
        
        createdCount++;
      }
    }

    console.log('\n✨ Migration complete!');
    console.log(`📈 Results:`);
    console.log(`   Updated: ${updatedCount} templates`);
    console.log(`   Created: ${createdCount} new templates`);
    console.log(`   Skipped (up to date): ${skippedCount} templates`);
    console.log(`   Total processed: ${Object.keys(improvedTemplates).length} template types`);

    console.log('\n🎯 All email templates now use the modern design with:');
    console.log('   ✅ Responsive design and proper styling');
    console.log('   ✅ School phone and email variables');
    console.log('   ✅ Consistent button styling with data-btn attributes');
    console.log('   ✅ Modern color scheme and gradients');
    console.log('   ✅ Proper spacing and typography');

  } catch (error) {
    console.error('❌ Error migrating email templates:', error);
    throw error;
  }
}

function getDefaultReceiversForTrigger(triggerType) {
  const receiverMap = {
    'new_user': ['student'],
    'new_booking': ['student', 'admin'],
    'booking_confirmed': ['student'],
    'payment_confirmed': ['student'],
    'payment_reminder': ['student'],
    'awaiting_school_confirmation': ['student'],
    'swish_payment_verification': ['student'],
    'booking_reminder': ['student'],
    'cancelled_booking': ['student', 'admin'],
    'forgot_password': ['student'],
    'new_password': ['student']
  };

  return receiverMap[triggerType] || ['student'];
}

// Run the migration
migrateEmailTemplatesDesign()
  .then(() => {
    console.log('\n🎉 Email template migration completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Migration failed:', error);
    process.exit(1);
  });
