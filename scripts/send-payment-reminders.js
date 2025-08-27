import { db } from '../lib/db.js';
import { bookings, users, lessonTypes, siteSettings } from '../lib/db/schema.js';
import { eq, and, lt } from 'drizzle-orm';
import { subHours } from 'date-fns';
import sgMail from '@sendgrid/mail';

// Set up SendGrid
async function getSendGridApiKey() {
  try {
    const setting = await db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.key, 'sendgrid_api_key'))
      .limit(1);

    if (setting.length > 0 && setting[0].value) {
      return setting[0].value;
    }

    return process.env.SENDGRID_API_KEY || '';
  } catch (error) {
    console.error('Error fetching SendGrid API key from database:', error);
    return process.env.SENDGRID_API_KEY || '';
  }
}

async function sendPaymentReminderEmail(booking, user, lessonType, settings) {
  const apiKey = await getSendGridApiKey();
  if (!apiKey) {
    console.error('SendGrid API key not found');
    return false;
  }

  sgMail.setApiKey(apiKey);

  const schoolName = settings.schoolname || settings.site_name || 'Din Trafikskola Hässleholm';
  const schoolPhone = settings.school_phonenumber || '';
  const swishNumber = settings.swish_number || '';

  const paymentUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.dintrafikskolahlm.se'}/booking/payment/${booking.id}`;

  const msg = {
    from: '"Din Trafikskola HLM" <noreply@dintrafikskolahlm.se>',
    to: user.email,
    subject: '🔔 Påminnelse: Din körlektion väntar på betalning',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h1 style="color: #f59e0b; text-align: center; margin-bottom: 30px;">🔔 Betalningspåminnelse</h1>

          <div style="background-color: #fff7ed; padding: 20px; border-radius: 8px; margin-bottom: 30px; border-left: 4px solid #f59e0b;">
            <h2 style="color: #92400e; margin-top: 0;">Din körlektion väntar på betalning</h2>
            <p style="color: #92400e; margin-bottom: 0;">Din bokning är reserverad men har ännu inte betalats. Vänligen slutför betalningen för att säkra din plats.</p>
          </div>

          <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
            <h2 style="color: #0369a1; margin-top: 0;">Bokningsdetaljer</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; font-weight: bold;">Lektionstyp:</td><td style="padding: 8px 0;">${lessonType?.name || 'Körlektion'}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Datum:</td><td style="padding: 8px 0;">${new Date(booking.scheduledDate).toLocaleDateString('sv-SE')}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Tid:</td><td style="padding: 8px 0;">${booking.startTime} - ${booking.endTime}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Pris:</td><td style="padding: 8px 0; font-size: 18px; color: #dc2626;"><strong>${booking.totalPrice} kr</strong></td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Boknings-ID:</td><td style="padding: 8px 0; font-family: monospace;">${booking.id}</td></tr>
            </table>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${paymentUrl}"
               style="background-color: #059669; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px rgba(5, 150, 105, 0.3);">
              💳 Slutför betalning nu
            </a>
          </div>

          <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
            <h3 style="color: #92400e; margin-top: 0;">Snabb betalning med Swish:</h3>
            <table style="width: 100%; color: #92400e;">
              <tr><td style="padding: 5px 0; font-weight: bold;">Swish-nummer:</td><td style="padding: 5px 0; font-family: monospace;">${swishNumber}</td></tr>
              <tr><td style="padding: 5px 0; font-weight: bold;">Belopp:</td><td style="padding: 5px 0; font-family: monospace;">${booking.totalPrice} kr</td></tr>
              <tr><td style="padding: 5px 0; font-weight: bold;">Meddelande:</td><td style="padding: 5px 0; font-family: monospace; font-size: 14px;">${booking.swishUUID}</td></tr>
            </table>
          </div>

          <p style="color: #6b7280; text-align: center; margin-top: 30px; font-size: 14px;">
            Om du redan har betalat kan du ignorera detta meddelande.<br>
            Frågor? Kontakta oss på ${schoolPhone || '0760-389192'}.
          </p>

          <p style="color: #6b7280; text-align: center;">Med vänliga hälsningar,<br><strong>${schoolName}</strong></p>
        </div>
      </div>
    `
  };

  try {
    await sgMail.send(msg);
    console.log(`Payment reminder sent to ${user.email} for booking ${booking.id}`);
    return true;
  } catch (error) {
    console.error(`Failed to send payment reminder to ${user.email}:`, error);
    return false;
  }
}

async function sendPaymentReminders() {
  console.log('🔍 Checking for unpaid bookings older than 5 hours...');

  const fiveHoursAgo = subHours(new Date(), 5);

  try {
    // Get unpaid bookings older than 5 hours
    const unpaidBookings = await db
      .select({
        booking: bookings,
        user: users,
        lessonType: lessonTypes
      })
      .from(bookings)
      .leftJoin(users, eq(bookings.userId, users.id))
      .leftJoin(lessonTypes, eq(bookings.lessonTypeId, lessonTypes.id))
      .where(
        and(
          eq(bookings.paymentStatus, 'unpaid'),
          eq(bookings.status, 'temp'),
          lt(bookings.createdAt, fiveHoursAgo)
        )
      );

    console.log(`📧 Found ${unpaidBookings.length} unpaid bookings older than 5 hours`);

    if (unpaidBookings.length === 0) {
      console.log('✅ No payment reminders needed');
      return;
    }

    // Get site settings for email templates
    const settingsRows = await db.select().from(siteSettings);
    const settings = settingsRows.reduce((acc, cur) => {
      acc[cur.key] = cur.value;
      return acc;
    }, {});

    let successCount = 0;
    let failureCount = 0;

    // Send reminders
    for (const record of unpaidBookings) {
      const { booking, user, lessonType } = record;

      if (!user || !user.email) {
        console.log(`⚠️ Skipping booking ${booking.id} - no user email found`);
        continue;
      }

      console.log(`📧 Sending payment reminder for booking ${booking.id} to ${user.email}`);

      const success = await sendPaymentReminderEmail(booking, user, lessonType, settings);

      if (success) {
        successCount++;
      } else {
        failureCount++;
      }

      // Add a small delay to avoid overwhelming the email service
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`✅ Payment reminders sent: ${successCount} successful, ${failureCount} failed`);

  } catch (error) {
    console.error('❌ Error sending payment reminders:', error);
  }
}

// Run the script
console.log('🚀 Starting payment reminder service...');
await sendPaymentReminders();
console.log('✨ Payment reminder service completed');

process.exit(0);
