import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { 
  users, 
  bookings, 
  userFeedback, 
  handledarBookings, 
  packages, 
  lessonTypes,
  messages,
  notifications,
  transactions,
  paymentHistory,
  creditHistory,
  userCredits,
  userPackages,
  userSessions
} from '@/lib/db/schema';
import { eq, and, ne } from 'drizzle-orm';
import { generateRandomPassword, sendEmail } from '@/lib/utils';
import { hash } from 'bcryptjs';

export async function POST() {
  try {
    // Generate a random password
    const newPassword = generateRandomPassword(12);
    const hashedPassword = await hash(newPassword, 10);

    // Start a transaction
    await db.transaction(async (tx) => {
      // Delete all data from specified tables
      await tx.delete(bookings);
      await tx.delete(userFeedback);
      await tx.delete(handledarBookings);
      await tx.delete(packages);
      await tx.delete(lessonTypes);
      await tx.delete(messages);
      await tx.delete(notifications);
      await tx.delete(transactions);
      await tx.delete(paymentHistory);
      await tx.delete(creditHistory);
      await tx.delete(userCredits);
      await tx.delete(userPackages);
      await tx.delete(userSessions);
      
      // Delete all non-admin users
      await tx.delete(users).where(ne(users.email, 'admin@dintrafikskolahlm.se'));
      
      // Create or update admin user
      const [adminUser] = await tx
        .insert(users)
        .values({
          email: 'admin@dintrafikskolahlm.se',
          password: hashedPassword,
          firstName: 'Admin',
          lastName: 'User',
          role: 'admin',
          emailVerified: true,
          isActive: true,
        })
        .onConflictDoUpdate({
          target: users.email,
          set: { 
            password: hashedPassword,
            role: 'admin',
            isActive: true,
            updatedAt: new Date()
          },
        })
        .returning();

      // Create default lesson types
      const defaultLessonTypes = [
        { name: 'Körlektion', duration: 45, price: 80000, description: 'Standard körlektion' },
        { name: 'Risktvåan', duration: 60, price: 100000, description: 'Risktvåan utbildning' },
        { name: 'Halkbana', duration: 60, price: 90000, description: 'Halkbanekörning' },
      ];

      await tx.insert(lessonTypes).values(defaultLessonTypes);

      // Create default packages
      const defaultPackages = [
        { 
          name: 'Startpaket', 
          description: '5 körlektioner', 
          price: 350000,
          credits: 5,
          isActive: true,
          validDays: 180
        },
        { 
          name: 'Standardpaket', 
          description: '10 körlektioner', 
          price: 650000,
          credits: 10,
          isActive: true,
          validDays: 365
        },
        { 
          name: 'Förarprovspaket', 
          description: '2 körlektioner + förarprov', 
          price: 250000,
          credits: 2,
          isActive: true,
          validDays: 90,
          includesExam: true
        },
      ];

      await tx.insert(packages).values(defaultPackages);

      // Send email with new password
      await sendEmail({
        to: 'johaswe@gmail.com',
        subject: 'New Admin Password for TrafikskolaX',
        html: `
          <h1>Site Reset Complete</h1>
          <p>The site has been reset to factory settings.</p>
          <p>New admin credentials:</p>
          <p>Email: admin@dintrafikskolahlm.se</p>
          <p>Password: ${newPassword}</p>
          <p>Please change this password after logging in.</p>
        `,
      });
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Site reset successfully',
      password: newPassword // Only for development, remove in production
    });

  } catch (error) {
    console.error('Error resetting site:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reset site' },
      { status: 500 }
    );
  }
}
