import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookings, users, lessonTypes, userCredits, internalMessages, handledarSessions, handledarBookings, siteSettings, teacherAvailability } from '@/lib/db/schema';
import { verifyToken } from '@/lib/auth/jwt'
import { cookies } from 'next/headers';
import { eq, and, sql, or, ne } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import sgMail from '@sendgrid/mail';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';

// Helper function to get SendGrid API key from database
async function getSendGridApiKey(): Promise<string> {
  try {
    const setting = await db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.key, 'sendgrid_api_key'))
      .limit(1);
    
    if (setting.length > 0 && setting[0].value) {
      return setting[0].value;
    }
    
    // Fallback to environment variable if not in database
    return process.env.SENDGRID_API_KEY || '';
  } catch (error) {
    console.error('Error fetching SendGrid API key from database:', error);
    // Fallback to environment variable on error
    return process.env.SENDGRID_API_KEY || '';
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      sessionType,
      sessionId,
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

    // Validate required fields - different validation for handledar vs regular lessons
    if (sessionType === 'handledar') {
      if (!sessionId || !scheduledDate || !startTime || !durationMinutes || !totalPrice) {
        return NextResponse.json({ error: 'Missing required fields for handledar session' }, { status: 400 });
      }
    } else {
      if (!sessionId || !scheduledDate || !startTime || !endTime || !durationMinutes || !totalPrice) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      }
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
      
      // Check if email already exists
      const existingUser = await db.select().from(users).where(eq(users.email, guestEmail.toLowerCase())).limit(1);
      if (existingUser.length > 0) {
        return NextResponse.json({
          error: 'Email already exists. Would you like to connect this booking to your account or use a different email?',
          userExists: true,
          existingEmail: guestEmail
        }, { status: 400 });
      }
      
      // Create a guest user account
      const newUser = await createGuestUser(guestEmail, guestName, guestPhone);
      userId = newUser.id;
      isGuestBooking = true;
    }

    // If booking for a student as Admin or Teacher
    if (studentId && currentUserRole && ['admin', 'teacher'].includes(currentUserRole)) {
      userId = studentId; // Book for the selected student
    }
    // Special handling for admin/teacher booking for students
    if (studentId && (currentUserRole === 'admin' || currentUserRole === 'teacher')) {
      if (sessionType === 'handledar') {
        // Handle admin or teacher booking for handledarkurs
        const [session] = await db
          .select()
          .from(handledarSessions)
          .where(
            and(
              eq(handledarSessions.id, sessionId!),
              eq(handledarSessions.isActive, true)
            )
          );

        if (!session || session.currentParticipants >= session.maxParticipants) {
          return NextResponse.json({ error: 'No available spots for the session.' }, { status: 400 });
        }

        // Update session participant count
        await db
          .update(handledarSessions)
          .set({ currentParticipants: sql`${handledarSessions.currentParticipants} + 1` })
          .where(eq(handledarSessions.id, sessionId!));

        // Create booking
        const [booking] = await db
          .insert(handledarBookings)
          .values({
            sessionId,
            studentId: userId,
            supervisorName: guestName || '',
            supervisorEmail: guestEmail || '',
            supervisorPhone: guestPhone || '',
            price: totalPrice,
            paymentStatus: 'paid',
            status: 'confirmed',
            bookedBy: currentUserId,
            swishUUID: uuidv4(),
          })
          .returning();

        // Send notification
        await sendBookingNotification(guestEmail || '', booking, true);

        return NextResponse.json({ 
          booking,
          message: `Handledar session booking confirmed for student by ${currentUserRole}.`
        });
      } else {
        // Admin or teacher booking for a student - no payment required
        const [booking] = await db
          .insert(bookings)
          .values({
            userId,
            lessonTypeId: sessionId!,
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
    }

    // Handle different session types
    if (sessionType === 'handledar') {
      // Ensure guests can't book handledar sessions
      if (isGuestBooking) {
        return NextResponse.json({ error: 'Guests must register to book handledar sessions.' }, { status: 400 });
      }
      // Handle handledarkurs booking
      const [session] = await db
        .select()
        .from(handledarSessions)
        .where(
          and(
            eq(handledarSessions.id, sessionId!),
            eq(handledarSessions.isActive, true)
          )
        );

      if (!session || session.currentParticipants >= session.maxParticipants) {
        return NextResponse.json({ error: 'No available spots for the session.' }, { status: 400 });
      }

      // If using credits, deduct from user's handledar credits
      if (paymentMethod === 'credits' && userId) {
        // If sessionId is handledarutbildning-group, ask user to select a specific session
        if (sessionId === 'handledarutbildning-group') {
          return NextResponse.json({
            error: 'Select a specific session from the available options',
            requireSessionSelection: true
          }, { status: 400 });
        }

        const userCreditRecords = await db
          .select()
          .from(userCredits)
          .where(
            and(
              eq(userCredits.userId, userId),
              eq(userCredits.creditType, 'handledar')
            )
          );

        const totalUserCredits = userCreditRecords ? userCreditRecords.reduce((sum, credit) => sum + credit.creditsRemaining, 0) : 0;

        if (totalUserCredits < 1) {
          return NextResponse.json({ error: 'Not enough handledar credits available.' }, { status: 400 });
        }

        // Process handledar booking actions without using transaction
          // Deduct 1 credit from the first available credit record
          const firstCreditRecord = userCreditRecords.find(record => record.creditsRemaining > 0);
          if (firstCreditRecord) {
            await db
              .update(userCredits)
              .set({
                creditsRemaining: firstCreditRecord.creditsRemaining - 1,
                updatedAt: new Date()
              })
              .where(eq(userCredits.id, firstCreditRecord.id));
          }

          // Update session participant count
          await db
            .update(handledarSessions)
            .set({ currentParticipants: sql`${handledarSessions.currentParticipants} + 1` })
            .where(eq(handledarSessions.id, sessionId!));

          // Create booking with confirmed status
          const [booking] = await db
            .insert(handledarBookings)
            .values({
              sessionId,
              studentId: userId,
              supervisorName: guestName || '',
              supervisorEmail: guestEmail || '',
              supervisorPhone: guestPhone || '',
              price: totalPrice,
              paymentStatus: 'paid',
              status: 'confirmed',
              bookedBy: currentUserId || userId,
              swishUUID: uuidv4(),
              paymentMethod: 'credits'
            })
            .returning();

          // Send notification
          const notificationEmail = guestEmail || (userId ? (await db.select().from(users).where(eq(users.id, userId)))[0]?.email : null);
          if (notificationEmail) {
            await sendBookingNotification(notificationEmail, { 
              ...booking, 
              scheduledDate: session.date,
              startTime: session.startTime,
              durationMinutes: session.endTime ? 
                (new Date(`1970-01-01T${session.endTime}`).getTime() - new Date(`1970-01-01T${session.startTime}`).getTime()) / (1000 * 60) :
                durationMinutes
            }, true);
          }

          return NextResponse.json({ 
            booking,
            message: 'Handledar session booking confirmed and paid using credits.'
          });
      } else {
        // Regular payment flow
        // Update session participant count
        await db
          .update(handledarSessions)
          .set({ currentParticipants: sql`${handledarSessions.currentParticipants} + 1` })
          .where(eq(handledarSessions.id, sessionId!));

        // Create booking
        const [booking] = await db
          .insert(handledarBookings)
          .values({
            sessionId,
            studentId: userId,
            supervisorName: guestName || '',
            supervisorEmail: guestEmail || '',
            supervisorPhone: guestPhone || '',
            price: totalPrice,
            paymentStatus: alreadyPaid ? 'paid' : 'pending',
            status: alreadyPaid ? 'confirmed' : 'pending',
            bookedBy: currentUserId || userId,
            swishUUID: uuidv4(),
          })
          .returning();

        // Send notification
        const notificationEmail = guestEmail || (userId ? (await db.select().from(users).where(eq(users.id, userId)))[0]?.email : null);
          if (notificationEmail) {
            await sendBookingNotification(notificationEmail, { 
              ...booking, 
              scheduledDate: session.date,
              startTime: session.startTime,
              durationMinutes: session.endTime ? 
                (new Date(`1970-01-01T${session.endTime}`).getTime() - new Date(`1970-01-01T${session.startTime}`).getTime()) / (1000 * 60) :
                durationMinutes
            }, alreadyPaid);
          }

          return NextResponse.json({ 
            booking,
            message: alreadyPaid ?
              'Handledar session booking confirmed and marked as paid.' :
              'Handledar session booking created. Please complete payment within 10 minutes.'
          });
      }
    } else {
      // Handle regular lesson booking
      
      // If using credits, deduct from user's total
      if (paymentMethod === 'credits') {
        // Check for credits - if lessonTypeId is null, check for handledar credits
        const userCreditRecords = await db
          .select()
          .from(userCredits)
          .where(
            and(
              eq(userCredits.userId, userId!),
              or(
                eq(userCredits.lessonTypeId, sessionId!),
                and(
                  eq(userCredits.lessonTypeId, null),
                  eq(userCredits.creditType, 'handledar')
                )
              )
            )
          );

        const totalUserCredits = userCreditRecords ? userCreditRecords.reduce((sum, credit) => sum + credit.creditsRemaining, 0) : 0;

        if (totalUserCredits < 1) {
          return NextResponse.json({ error: 'Not enough credits available.' }, { status: 400 });
        }

        // Process booking actions without using transaction
          // Deduct 1 credit from the first available credit record
          const firstCreditRecord = userCreditRecords.find(record => record.creditsRemaining > 0);
          if (firstCreditRecord) {
          await db
            .update(userCredits)
            .set({
              creditsRemaining: firstCreditRecord.creditsRemaining - 1,
              updatedAt: new Date()
            })
            .where(eq(userCredits.id, firstCreditRecord.id));
          }

          // Find available teacher for this time slot
          const availableTeacher = await findAvailableTeacher(db, scheduledDate, startTime, endTime);

          // Create and confirm booking
          const [booking] = await db
            .insert(bookings)
            .values({
              userId,
              lessonTypeId: sessionId!,
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
              teacherId: availableTeacher?.id,
              paymentMethod: 'credits'
            })
            .returning();

          // Send email notification
          const userEmail = isGuestBooking ? guestEmail : (userId ? (await db.select().from(users).where(eq(users.id, userId)))[0]?.email : null);
          if (userEmail) {
            await sendBookingNotification(userEmail, booking, true);
          }

          return NextResponse.json({ 
            booking,
            message: 'Booking confirmed and paid using credits.'
          });
      } else {
        // Create the booking with on_hold status
        const [booking] = await db
          .insert(bookings)
          .values({
            userId,
            lessonTypeId: sessionId!,
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
            await sendBookingNotification(user[0].email, booking, alreadyPaid, false, paymentMethod);
          }
        } else if (isGuestBooking && guestEmail) {
          await sendBookingNotification(guestEmail, booking, alreadyPaid, false, paymentMethod);
        }

        return NextResponse.json({ 
          booking,
          message: alreadyPaid ?
            'Booking confirmed and marked as paid.' :
            'Booking created with on_hold status. Please complete payment within 10 minutes.'
        });
      }
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

    // Send welcome email to new guest user
    const { EmailService } = await import('@/lib/email/email-service');
    try {
      await EmailService.sendTriggeredEmail('new_user', {
        user: {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          role: newUser.role
        },
        customData: {
          temporaryPassword: password
        }
      });
    } catch (emailError) {
      console.error('Failed to send welcome email to guest:', emailError);
    }

    return newUser;
  } catch (error) {
    console.error('Error creating guest user:', error);
    throw error;
  }
}

async function sendBookingNotification(email: string, booking: any, alreadyPaid: boolean, isHandledar: boolean = false, paymentMethod?: string) {
  // Always save internal message
  await saveInternalMessage(booking.userId, booking, alreadyPaid, isHandledar);
  
  // Use new email template service
  const { EmailService } = await import('@/lib/email/email-service');
  
  // Get user details for email context
  let userDetails = null;
  if (booking.userId) {
    const [user] = await db.select().from(users).where(eq(users.id, booking.userId)).limit(1);
    userDetails = user;
  }
  
  // Get lesson type details if not handledar
  let lessonType = null;
  if (booking.lessonTypeId) {
    [lessonType] = await db.select().from(lessonTypes).where(eq(lessonTypes.id, booking.lessonTypeId)).limit(1);
  }
  
  const emailContext = {
    user: userDetails ? {
      id: userDetails.id,
      email: userDetails.email,
      firstName: userDetails.firstName,
      lastName: userDetails.lastName,
      role: userDetails.role
    } : {
      id: '',
      email: email,
      firstName: booking.guestName?.split(' ')[0] || 'Guest',
      lastName: booking.guestName?.split(' ').slice(1).join(' ') || '',
      role: 'student'
    },
    booking: {
      id: booking.id,
      scheduledDate: format(new Date(booking.scheduledDate), 'yyyy-MM-dd'),
      startTime: booking.startTime,
      endTime: booking.endTime,
      lessonTypeName: lessonType?.name || 'Handledarutbildning',
      totalPrice: booking.totalPrice?.toString() || booking.price?.toString() || '0',
      swishUUID: booking.swishUUID,
      paymentMethod: paymentMethod || booking.paymentMethod
    },
    customData: {
      swishNumber: process.env.NEXT_PUBLIC_SWISH_NUMBER || '1234567890'
    }
  };
  
  // Send appropriate email based on payment status and method
  if (alreadyPaid) {
    await EmailService.sendTriggeredEmail('payment_confirmed', emailContext);
    await EmailService.sendTriggeredEmail('booking_confirmed', emailContext);
  } else if (paymentMethod === 'swish' || booking.paymentMethod === 'swish') {
    await EmailService.sendTriggeredEmail('new_booking', emailContext);
    await EmailService.sendTriggeredEmail('awaiting_school_confirmation', emailContext);
  } else {
    await EmailService.sendTriggeredEmail('new_booking', emailContext);
    await EmailService.sendTriggeredEmail('payment_reminder', emailContext);
  }
  
  return;
  
  // Keep the old implementation as fallback
  const apiKey = await getSendGridApiKey();
  if (!apiKey) {
    console.error('SendGrid API key not found');
    return;
  }
  sgMail.setApiKey(apiKey);

  // Parse the date string to ensure it's valid
  const dateValue = booking.scheduledDate;
  let bookingDate;
  
  // Handle different date formats that might come from the database
  if (typeof dateValue === 'string') {
    // If it's already a string in YYYY-MM-DD format, parse it
    bookingDate = new Date(dateValue + 'T00:00:00');
  } else if (dateValue instanceof Date) {
    bookingDate = dateValue;
  } else {
    // Fallback to today's date if parsing fails
    bookingDate = new Date();
  }
  
  const formattedDate = format(bookingDate, 'EEEE d MMMM yyyy', { locale: sv });
  const swishNumber = process.env.NEXT_PUBLIC_SWISH_NUMBER || '1234567890';
  
  // Get the current domain from request headers or environment
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://localhost:3000';
  const bookingUrl = isHandledar ? 
    `${baseUrl}/dashboard/student` : 
    `${baseUrl}/dashboard/student/bookings/${booking.id}`;
  
  try {
    if (alreadyPaid) {
      // Send confirmation email for already paid booking
      await sgMail.send({
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
              <a href="${bookingUrl}" 
                 style="background-color: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px rgba(220, 38, 38, 0.3);">
                📚 Visa min bokning
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
    await sgMail.send({
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
async function saveInternalMessage(userId: string | null, booking: any, alreadyPaid: boolean, isHandledar: boolean = false) {
  if (!userId) return; // Can't save internal message for guest users
  
  const formattedDate = format(new Date(booking.scheduledDate), 'EEEE d MMMM yyyy', { locale: sv });
  const swishNumber = process.env.NEXT_PUBLIC_SWISH_NUMBER || '1234567890';
  
  // Get the current domain from environment
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://localhost:3000';
  const bookingUrl = isHandledar ? 
    `${baseUrl}/dashboard/student` : 
    `${baseUrl}/dashboard/student/bookings/${booking.id}`;
  
  const subject = alreadyPaid ? 
    '✅ Din körlektion är bekräftad!' : 
    '💳 Betalning krävs för din körlektion';
    
  const message = alreadyPaid ?
    `Din körlektion ${formattedDate} kl ${booking.startTime} är bekräftad och betald. Vi ser fram emot att träffa dig!
    
Se din bokning här: ${bookingUrl}` :
    `Din körlektion ${formattedDate} kl ${booking.startTime} väntar på betalning. 
    
Swish-betalning:
• Nummer: ${swishNumber}
• Belopp: ${booking.totalPrice} kr
• Meddelande: ${booking.swishUUID}

Betala inom 10 minuter för att säkra din plats.

Se din bokning här: ${bookingUrl}`;

  try {
    await db.insert(internalMessages).values({
      fromUserId: userId,
      toUserId: userId, // User sends message to themselves
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
    // Get SendGrid API key from database and initialize
    const apiKey = await getSendGridApiKey();
    if (!apiKey) {
      console.error('SendGrid API key not found, cannot send welcome email');
      return;
    }
    sgMail.setApiKey(apiKey);

    // Send email using SendGrid
    await sgMail.send({
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

// Helper function to find available teacher for a time slot
async function findAvailableTeacher(trx: any, scheduledDate: string, startTime: string, endTime: string) {
  try {
    // Get day of week (0-6 where 0 is Sunday)
    const date = new Date(scheduledDate);
    const dayOfWeek = date.getDay();
    
    // Convert time strings to minutes for comparison
    const timeToMinutes = (time: string) => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };
    
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);
    
    // Find all teachers
    const teachers = await trx
      .select()
      .from(users)
      .where(
        and(
          eq(users.role, 'teacher'),
          eq(users.isActive, true)
        )
      );
    
    if (teachers.length === 0) {
      return null;
    }
    
    // If only one teacher, assign to them
    if (teachers.length === 1) {
      return teachers[0];
    }
    
    // Find teachers available for this time slot
    const availableTeachers = [];
    
    for (const teacher of teachers) {
      // Check teacher availability schedule
      const availability = await trx
        .select()
        .from(teacherAvailability)
        .where(
          and(
            eq(teacherAvailability.teacherId, teacher.id),
            eq(teacherAvailability.dayOfWeek, dayOfWeek),
            eq(teacherAvailability.isActive, true)
          )
        );
      
      // Check if teacher has availability for this day and time
      const isAvailable = availability.some(slot => {
        const slotStartMinutes = timeToMinutes(slot.startTime);
        const slotEndMinutes = timeToMinutes(slot.endTime);
        return startMinutes >= slotStartMinutes && endMinutes <= slotEndMinutes;
      });
      
      if (isAvailable) {
        // Check if teacher has conflicting bookings
        const conflictingBookings = await trx
          .select()
          .from(bookings)
          .where(
            and(
              eq(bookings.teacherId, teacher.id),
              eq(bookings.scheduledDate, scheduledDate),
              or(
                and(
                  sql`${bookings.startTime} < ${endTime}`,
                  sql`${bookings.endTime} > ${startTime}`
                )
              ),
              ne(bookings.status, 'cancelled')
            )
          );
        
        if (conflictingBookings.length === 0) {
          availableTeachers.push(teacher);
        }
      }
    }
    
    // If no teachers are available based on schedule, try to find one without conflicts
    if (availableTeachers.length === 0) {
      for (const teacher of teachers) {
        const conflictingBookings = await trx
          .select()
          .from(bookings)
          .where(
            and(
              eq(bookings.teacherId, teacher.id),
              eq(bookings.scheduledDate, scheduledDate),
              or(
                and(
                  sql`${bookings.startTime} < ${endTime}`,
                  sql`${bookings.endTime} > ${startTime}`
                )
              ),
              ne(bookings.status, 'cancelled')
            )
          );
        
        if (conflictingBookings.length === 0) {
          availableTeachers.push(teacher);
        }
      }
    }
    
    if (availableTeachers.length === 0) {
      return null;
    }
    
    // Find teacher with least bookings for load balancing
    let selectedTeacher = availableTeachers[0];
    let minBookings = Infinity;
    
    for (const teacher of availableTeachers) {
      const bookingCount = await trx
        .select({ count: sql`count(*)` })
        .from(bookings)
        .where(
          and(
            eq(bookings.teacherId, teacher.id),
            eq(bookings.scheduledDate, scheduledDate),
            ne(bookings.status, 'cancelled')
          )
        );
      
      const count = Number(bookingCount[0]?.count || 0);
      if (count < minBookings) {
        minBookings = count;
        selectedTeacher = teacher;
      }
    }
    
    return selectedTeacher;
  } catch (error) {
    console.error('Error finding available teacher:', error);
    return null;
  }
}
