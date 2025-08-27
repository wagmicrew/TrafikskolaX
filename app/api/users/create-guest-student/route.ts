import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import sgMail from '@sendgrid/mail';
import crypto from 'crypto';

// Encryption function for personal IDs
function encryptPersonalId(personalId: string): string {
  const algorithm = 'aes-256-gcm';
  const key = process.env.ENCRYPTION_KEY || 'fallback-key-32-characters-long';
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipher(algorithm, key);
  let encrypted = cipher.update(personalId, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return encrypted;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, personalNumber, createdByUserId } = body;

    // Validate required fields
    if (!name || !email || !personalNumber) {
      return NextResponse.json(
        { error: 'Namn, e-post och personnummer är obligatoriska' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: 'En användare med denna e-postadress finns redan' },
        { status: 400 }
      );
    }

    // Generate a random password for the guest student
    const randomPassword = Math.random().toString(36).slice(-12) + 'Aa1!';
    const hashedPassword = await bcrypt.hash(randomPassword, 12);

    // Encrypt personal number
    const encryptedPersonalNumber = encryptPersonalId(personalNumber);

    // Split name into first and last name
    const nameParts = name.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Create the guest student account
    const newUser = await db
      .insert(users)
      .values({
        firstName,
        lastName,
        email,
        phone: phone || null,
        encryptedPersonalNumber,
        password: hashedPassword,
        role: 'student',
        isActive: true,
        emailVerified: false, // Guest students need to verify email
        createdBy: createdByUserId,
      })
      .returning();

    if (newUser.length === 0) {
      return NextResponse.json(
        { error: 'Kunde inte skapa användarkonto' },
        { status: 500 }
      );
    }

    const user = newUser[0];

    // Send welcome email with login credentials
    try {
      const sendGridApiKey = process.env.SENDGRID_API_KEY;
      if (sendGridApiKey) {
        sgMail.setApiKey(sendGridApiKey);

        const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.dintrafikskolahlm.se'}/login`;

        await sgMail.send({
          to: email,
          from: {
            email: process.env.FROM_EMAIL || 'info@dintrafikskolahlm.se',
            name: 'Din Trafikskola Hässleholm'
          },
          subject: 'Välkommen till Din Trafikskola Hässleholm - Ditt konto har skapats',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #dc2626; text-align: center;">Välkommen till Din Trafikskola Hässleholm!</h1>

              <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h2 style="color: #374151; margin-top: 0;">Ditt konto har skapats</h2>
                <p style="color: #4b5563; line-height: 1.6;">
                  Hej ${firstName}!<br><br>
                  Ett konto har skapats åt dig för att kunna boka körlektioner hos oss.
                  Här är dina inloggningsuppgifter:
                </p>

                <div style="background-color: #ffffff; padding: 15px; border-radius: 6px; border: 1px solid #d1d5db; margin: 15px 0;">
                  <strong>E-post:</strong> ${email}<br>
                  <strong>Tillfälligt lösenord:</strong> ${randomPassword}
                </div>

                <p style="color: #4b5563; line-height: 1.6;">
                  <strong>Viktigt:</strong> Vi rekommenderar att du loggar in och ändrar ditt lösenord så snart som möjligt för säkerheten.
                </p>

                <div style="text-align: center; margin: 25px 0;">
                  <a href="${loginUrl}"
                     style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                    Logga in nu
                  </a>
                </div>
              </div>

              <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #1e40af; margin-top: 0;">Vad händer nu?</h3>
                <ul style="color: #3730a3; line-height: 1.8;">
                  <li>Du kan nu logga in på vår hemsida</li>
                  <li>Boka dina körlektioner online</li>
                  <li>Följ din utbildningsprogress</li>
                  <li>Kommunicera med dina lärare</li>
                </ul>
              </div>

              <p style="color: #6b7280; font-size: 14px; text-align: center; margin-top: 30px;">
                Har du frågor? Kontakta oss på 0760-389192 eller info@dintrafikskolahlm.se
              </p>

              <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 20px;">
                Detta är ett automatiskt genererat meddelande. Vänligen svara inte på detta e-postmeddelande.
              </p>
            </div>
          `,
        });
      }
    } catch (emailError) {
      console.error('Error sending welcome email:', emailError);
      // Don't fail the registration if email fails
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
      message: 'Elevkonto skapat framgångsrikt'
    });

  } catch (error) {
    console.error('Error creating guest student:', error);
    return NextResponse.json(
      { error: 'Ett fel uppstod när kontot skulle skapas' },
      { status: 500 }
    );
  }
}
