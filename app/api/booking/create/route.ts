import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookings, users, lessonTypes } from '@/lib/db/schema';
import { verifyToken } from '@/lib/auth/jwt'
import { cookies } from 'next/headers';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      lessonTypeId,
      scheduledDate,
      startTime,
      endTime,
      durationMinutes,
      transmissionType,
      totalPrice,
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

    // Check if user is logged in
    const cookieStore = cookies();
    const token = cookieStore.get('auth-token');
    
    if (token) {
      try {
        const payload = await verifyToken(token.value);
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
        status: 'on_hold',
        paymentStatus: 'unpaid',
        isGuestBooking,
        guestName: isGuestBooking ? guestName : null,
        guestEmail: isGuestBooking ? guestEmail : null,
        guestPhone: isGuestBooking ? guestPhone : null,
      })
      .returning();

    return NextResponse.json({ 
      booking,
      message: 'Booking created with on_hold status. Please complete payment within 10 minutes.'
    });
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

async function sendWelcomeEmail(email: string, password: string) {
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
}
