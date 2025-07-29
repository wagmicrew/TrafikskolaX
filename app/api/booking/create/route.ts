import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookings, users, lessonTypes, userCredits, internalMessages } from '@/lib/db/schema';
import { verifyToken } from '@/lib/auth/jwt'
import { cookies } from 'next/headers';
import { eq, and, sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      lessonTypeId,
      studentId,
      alreadyPaid,
      scheduledDate,
      startTime,
      endTime,
      durationMinutes,
      transmissionType,
      totalPrice,
      paymentMethod, // swish, credits, pay_at_location
      // Guest fields
      guestName,
      guestEmail,
      guestPhone,
    } = body;

    // Validate required fields
    if (!lessonTypeId || !scheduledDate || !startTime || !endTime || !durationMinutes || !totalPrice) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let userId = null;
    let isGuestBooking = false;
    let currentUserId = null; // The person making the booking
    let currentUserRole = null;

    // Check if user is logged in
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token');
    
    if (token) {
      try {
        const payload = await verifyToken(token.value);
        currentUserId = payload.userId;
        
        // Get current user's role
        const currentUser = await db
          .select()
          .from(users)
          .where(eq(users.id, currentUserId));
        
        if (currentUser.length > 0) {
          currentUserRole = currentUser[0].role;
        }
        
        userId = payload.userId;
      } catch (error) {
        // Invalid token, continue as guest
      }
    }

    // If not logged in, validate guest fields
    if (!userId) {
      if (!guestName || !guestEmail || !guestPhone) {
        return NextResponse.json({ error: 'Guest information required' }, { status: 400 });
      }
      isGuestBooking = true;
    }

    // If booking for a student as Admin or Teacher
    if (studentId && (currentUserRole === 'admin' || currentUserRole === 'teacher')) {
      userId = studentId; // Book for the selected student
    }

    // Special handling for admin/teacher booking for students
    if (studentId && (currentUserRole === 'admin' || currentUserRole === 'teacher')) {
      // Admin or teacher booking for a student - no payment required
      const [booking] = await db
        .insert(bookings)
        .values({
          userId,
          lessonTypeId,
          scheduledDate,
          startTime,
          endTime,
          durationMinutes,
          transmissionType,
          totalPrice: alreadyPaid ? totalPrice : 0, // Set price to 0 unless already paid is selected
          status: 'confirmed',
          paymentStatus: 'paid',
          isGuestBooking: false,
          guestName: null,
          guestEmail: null,
          guestPhone: null,
          swishUUID: uuidv4(),
        })
        .returning();

      // Send notification to the student
      const studentUser = await db.select().from(users).where(eq(users.id, userId));
      if (studentUser.length > 0) {
        await sendBookingNotification(studentUser[0].email, booking, true); // Always send as "paid" for admin bookings
      }

      return NextResponse.json({ 
        booking,
        message: `Booking confirmed for student by ${currentUserRole}.`
      });
    }

    // If using credits, deduct from user's total
    if (paymentMethod === 'credits') {

    const userCredits = await db
      .select()
      .from(userCredits)
      .where(
        and(
          eq(userCredits.userId, userId!),
          eq(userCredits.lessonTypeId, lessonTypeId)
        )
      );

    const totalUserCredits = userCredits ? userCredits.reduce((sum, credit) => sum + credit.creditsRemaining, 0) : 0;

    if (totalUserCredits < durationMinutes) {
      return NextResponse.json({ error: 'Not enough credits available.' }, { status: 400 });
    }

    await db.transaction(async (trx) => {
      await trx
        .update(userCredits)
        .set({
          creditsRemaining: sql`${userCredits.creditsRemaining} - ${durationMinutes}`
        })
        .where(
          and(
            eq(userCredits.userId, userId!),
            eq(userCredits.lessonTypeId, lessonTypeId)
          )
        );

        // Create and confirm booking
        const [booking] = await trx
          .insert(bookings)
          .values({
            userId,
            lessonTypeId,
            scheduledDate,
            startTime,
            endTime,
            durationMinutes,
            transmissionType,
            totalPrice,
            status: 'confirmed',
            paymentStatus: 'paid',
            isGuestBooking,
            guestName: isGuestBooking ? guestName : null,
            guestEmail: isGuestBooking ? guestEmail : null,
            guestPhone: isGuestBooking ? guestPhone : null,
            swishUUID: uuidv4(),
          })
          .returning();

        return NextResponse.json({ 
          booking,
          message: 'Booking confirmed and paid using credits.'
        });
      });

    } else {
      // Create the booking with on_hold status
      const [booking] = await db
        .insert(bookings)
        .values({
          userId,
          lessonTypeId,
          scheduledDate,
          startTime,
          endTime,
          durationMinutes,
          transmissionType,
          totalPrice,
          status: alreadyPaid ? 'confirmed' : 'on_hold',
          paymentStatus: alreadyPaid ? 'paid' : 'unpaid',
          isGuestBooking,
          guestName: isGuestBooking ? guestName : null,
          guestEmail: isGuestBooking ? guestEmail : null,
          guestPhone: isGuestBooking ? guestPhone : null,
          swishUUID: uuidv4(),
        })
        .returning();

      // Send email with booking details and payment instructions
      if (userId) {
        const user = await db.select().from(users).where(eq(users.id, userId));

        if (user.length > 0) {
          await sendBookingNotification(user[0].email, booking, alreadyPaid);
        }
      }

      return NextResponse.json({ 
        booking,
        message: alreadyPaid ?
          'Booking confirmed and marked as paid.' :
          'Booking created with on_hold status. Please complete payment within 10 minutes.'
      });
    }
  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
  }
}

// Helper function to create user account for guest bookings
export async function createGuestUser(email: string, name: string, phone: string) {
  try {
    // Generate random password
    const password = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(password, 10);

    // Split name into first and last
    const nameParts = name.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        email: email.toLowerCase(),
        password: hashedPassword,
        firstName,
        lastName,
        phone,
        role: 'student',
        isActive: true,
      })
      .returning();

    // Send email with login credentials
    await sendWelcomeEmail(email, password);

    return newUser;
  } catch (error) {
    console.error('Error creating guest user:', error);
    throw error;
  }
}

async function sendBookingNotification(email: string, booking: any, alreadyPaid: boolean) {
  // Create transporter
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const formattedDate = format(new Date(booking.scheduledDate), 'EEEE d MMMM yyyy', { locale: sv });
  const swishNumber = process.env.NEXT_PUBLIC_SWISH_NUMBER || '1234567890';
  
  try {
    if (alreadyPaid) {
      // Send confirmation email for already paid booking
      await transporter.sendMail({
      from: '"Din Trafikskola HLM" <noreply@dintrafikskolahlm.se>',
      to: email,
      subject: '✅ Bekräftelse: Din körlektion är bokad',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h1 style="color: #16a34a; text-align: center; margin-bottom: 30px;">🎉 Din körlektion är bekräftad!</h1>
            
            <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
              <h2 style="color: #0369a1; margin-top: 0;">Bokningsdetaljer</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 8px 0; font-weight: bold;">Datum:</td><td style="padding: 8px 0;">${formattedDate}</td></tr>
                <tr><td style="padding: 8px 0; font-weight: bold;">Tid:</td><td style="padding: 8px 0;">${booking.startTime}</td></tr>
                <tr><td style="padding: 8px 0; font-weight: bold;">Varaktighet:</td><td style="padding: 8px 0;">${booking.durationMinutes} minuter</td></tr>
                <tr><td style="padding: 8px 0; font-weight: bold;">Växellåda:</td><td style="padding: 8px 0;">${booking.transmissionType === 'manual' ? 'Manuell' : 'Automat'}</td></tr>
                <tr><td style="padding: 8px 0; font-weight: bold;">Pris:</td><td style="padding: 8px 0;">${booking.totalPrice} kr</td></tr>
                <tr><td style="padding: 8px 0; font-weight: bold;">Status:</td><td style="padding: 8px 0; color: #16a34a; font-weight: bold;">✅ Bekräftad & Betald</td></tr>
              </table>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
                 style="background-color: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px rgba(220, 38, 38, 0.3);">
                📚 Gå till Min Sida
              </a>
            </div>
            
            <p style="color: #6b7280; text-align: center; margin-top: 30px;">Vi ser fram emot att träffa dig!</p>
            <p style="color: #6b7280; text-align: center;">Med vänliga hälsningar,<br><strong>Din Trafikskola HLM</strong></p>
          </div>
        </div>
      `,
    });
  } else {
    // Send payment request email
    await transporter.sendMail({
      from: '"Din Trafikskola HLM" <noreply@dintrafikskolahlm.se>',
      to: email,
      subject: '💳 Slutför din bokning - Betalning krävs',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h1 style="color: #dc2626; text-align: center; margin-bottom: 30px;">🚗 Din körlektion väntar på betalning</h1>
            
            <div style="background-color: #fff7ed; padding: 20px; border-radius: 8px; margin-bottom: 30px; border-left: 4px solid #f59e0b;">
              <h2 style="color: #92400e; margin-top: 0;">⏰ Viktigt - Betala inom 10 minuter</h2>
              <p style="color: #92400e; margin-bottom: 0;">Din bokning reserveras i 10 minuter. Betala nu för att säkra din plats!</p>
            </div>
            
            <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
              <h2 style="color: #0369a1; margin-top: 0;">Bokningsdetaljer</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 8px 0; font-weight: bold;">Datum:</td><td style="padding: 8px 0;">${formattedDate}</td></tr>
                <tr><td style="padding: 8px 0; font-weight: bold;">Tid:</td><td style="padding: 8px 0;">${booking.startTime}</td></tr>
                <tr><td style="padding: 8px 0; font-weight: bold;">Varaktighet:</td><td style="padding: 8px 0;">${booking.durationMinutes} minuter</td></tr>
                <tr><td style="padding: 8px 0; font-weight: bold;">Växellåda:</td><td style="padding: 8px 0;">${booking.transmissionType === 'manual' ? 'Manuell' : 'Automat'}</td></tr>
                <tr><td style="padding: 8px 0; font-weight: bold;">Pris:</td><td style="padding: 8px 0; font-size: 18px; color: #dc2626;"><strong>${booking.totalPrice} kr</strong></td></tr>
              </table>
            </div>
            
            <div style="background-color: #ff5722; color: white; padding: 20px; border-radius: 8px; margin-bottom: 30px; text-align: center;">
              <h2 style="margin-top: 0; color: white;">💳 Betala med Swish</h2>
              <table style="width: 100%; color: white;">
                <tr><td style="padding: 5px 0; font-weight: bold;">Swish-nummer:</td><td style="padding: 5px 0; font-family: monospace; font-size: 16px;">${swishNumber}</td></tr>
                <tr><td style="padding: 5px 0; font-weight: bold;">Belopp:</td><td style="padding: 5px 0; font-family: monospace; font-size: 16px;">${booking.totalPrice} kr</td></tr>
                <tr><td style="padding: 5px 0; font-weight: bold;">Meddelande:</td><td style="padding: 5px 0; font-family: monospace; font-size: 14px;">${booking.swishUUID}</td></tr>
              </table>
              <p style="margin-bottom: 0; font-size: 14px; opacity: 0.9;">⚠️ Använd exakt detta meddelande så vi kan koppla din betalning till din bokning</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
                 style="background-color: #16a34a; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px rgba(34, 197, 94, 0.3); margin-right: 10px;">
                ✅ Jag har betalat
              </a>
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/boka-korning" 
                 style="background-color: #6b7280; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px rgba(107, 114, 128, 0.3);">
                🔄 Boka igen
              </a>
            </div>
            
            <p style="color: #6b7280; text-align: center; margin-top: 30px; font-size: 14px;">Vi kommer att bekräfta din betalning inom kort och skicka en bekräftelse.</p>
            <p style="color: #6b7280; text-align: center;">Med vänliga hälsningar,<br><strong>Din Trafikskola HLM</strong></p>
          </div>
        </div>
      `,
    });
  }
  } catch (error) {
    console.error('Email failed, saving message internally:', error);
    await saveInternalMessage(booking.userId, booking, alreadyPaid);
  }
}

// Internal message backup
async function saveInternalMessage(userId: string | null, booking: any, alreadyPaid: boolean) {
  if (!userId) return; // Can't save internal message for guest users
  
  const formattedDate = format(new Date(booking.scheduledDate), 'EEEE d MMMM yyyy', { locale: sv });
  const swishNumber = process.env.NEXT_PUBLIC_SWISH_NUMBER || '1234567890';
  
  const subject = alreadyPaid ? 
    '✅ Din körlektion är bekräftad!' : 
    '💳 Betalning krävs för din körlektion';
    
  const message = alreadyPaid ?
    `Din körlektion ${formattedDate} kl ${booking.startTime} är bekräftad och betald. Vi ser fram emot att träffa dig!` :
    `Din körlektion ${formattedDate} kl ${booking.startTime} väntar på betalning. 
    
Swish-betalning:
• Nummer: ${swishNumber}
• Belopp: ${booking.totalPrice} kr
• Meddelande: ${booking.swishUUID}

Betala inom 10 minuter för att säkra din plats.`;

  try {
    await db.insert(internalMessages).values({
      userId,
      subject,
      message,
      messageType: 'booking',
      isRead: false,
    });
    console.log('Internal message saved for user:', userId);
  } catch (error) {
    console.error('Failed to save internal message:', error);
  }
}

async function sendWelcomeEmail(email: string, password: string) {
  try {
    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Send email
    await transporter.sendMail({
      from: '"Din Trafikskola HLM" <noreply@dintrafikskolahlm.se>',
      to: email,
      subject: 'Välkommen till Din Trafikskola HLM',
      html: `
        <h1>Välkommen till Din Trafikskola HLM!</h1>
        <p>Ditt konto har skapats. Här är dina inloggningsuppgifter:</p>
        <p><strong>E-post:</strong> ${email}</p>
        <p><strong>Lösenord:</strong> ${password}</p>
        <p>Du kan logga in på <a href="${process.env.NEXT_PUBLIC_APP_URL}/inloggning">vår webbplats</a> för att se dina bokningar och hantera ditt konto.</p>
        <p>Vi rekommenderar att du ändrar ditt lösenord efter första inloggningen.</p>
        <br>
        <p>Med vänliga hälsningar,<br>Din Trafikskola HLM</p>
      `,
    });
  } catch (error) {
    console.error('Welcome email failed:', error);
    // For welcome emails, we don't have a fallback since it's for new users
  }
}
