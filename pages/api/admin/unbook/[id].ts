import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db';
import { bookings, userCredits } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  try {
    // Fetch all bookings related to the lesson type
    const existingBookings = await db
      .select()
      .from(bookings)
      .where(eq(bookings.lessonTypeId, id as string));

    // Iterate over bookings to cancel and restore credits
    for (const booking of existingBookings) {
      await db
        .update(bookings)
        .set({ 
          status: 'cancelled',
          notes: booking.notes ? `${booking.notes}\n\nCancelled: Lesson type deleted` : 'Cancelled: Lesson type deleted',
          deletedAt: new Date()
        })
        .where(eq(bookings.id, booking.id));

      // Add credits back to the user
      if (booking.userId) {
        await db
          .insert(userCredits)
          .values({ userId: booking.userId, creditsRemaining: 1, creditsTotal: 1, lessonTypeId: booking.lessonTypeId });
      }
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error unbooking:', error);
    res.status(500).json({ error: 'Failed to unbook and issue credits' });
  }
}
