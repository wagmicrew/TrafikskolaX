import { requireAuth } from '@/lib/auth/server-auth';
import { db } from '@/lib/db';
import { bookings, users, lessonTypes, userCredits, userFeedback, packages } from '@/lib/db/schema';
import { eq, sql, desc, and, isNull } from 'drizzle-orm';
import Link from 'next/link';
import StudentDashboardClient from './student-dashboard-client';

export default async function Studentsidan() {
  const user = await requireAuth('student');

  // Fetch user's bookings with lesson type info - show current bookings (from today)
  const today = new Date().toISOString().split('T')[0];
  const userBookings = await db
    .select({
      id: bookings.id,
      scheduledDate: bookings.scheduledDate,
      startTime: bookings.startTime,
      endTime: bookings.endTime,
      status: bookings.status,
      paymentStatus: bookings.paymentStatus,
      totalPrice: bookings.totalPrice,
      notes: bookings.notes,
      isCompleted: bookings.isCompleted,
      lessonTypeName: lessonTypes.name,
      lessonTypePrice: lessonTypes.price,
      createdAt: bookings.createdAt,
      durationMinutes: bookings.durationMinutes,
    })
    .from(bookings)
    .leftJoin(lessonTypes, eq(bookings.lessonTypeId, lessonTypes.id))
    .where(and(
      eq(bookings.userId, user.id),
      isNull(bookings.deletedAt)
    ))
    .orderBy(desc(bookings.scheduledDate))
    .limit(20);

  // Fetch user's credits
  const userCreditsData = await db
    .select({
      id: userCredits.id,
      creditsRemaining: userCredits.creditsRemaining,
      creditsTotal: userCredits.creditsTotal,
      lessonTypeName: lessonTypes.name,
      lessonTypeId: userCredits.lessonTypeId,
    })
    .from(userCredits)
    .leftJoin(lessonTypes, eq(userCredits.lessonTypeId, lessonTypes.id))
    .where(eq(userCredits.userId, user.id));

  // Fetch recent feedback
  const recentFeedback = await db
    .select({
      id: userFeedback.id,
      feedbackText: userFeedback.feedbackText,
      rating: userFeedback.rating,
      isFromTeacher: userFeedback.isFromTeacher,
      createdAt: userFeedback.createdAt,
      bookingId: userFeedback.bookingId,
    })
    .from(userFeedback)
    .where(eq(userFeedback.userId, user.id))
    .orderBy(desc(userFeedback.createdAt))
    .limit(5);


  // Calculate statistics
  const totalBookings = userBookings.length;
  const completedBookings = userBookings.filter(b => b.isCompleted).length;
  const upcomingBookings = userBookings.filter(b => 
    !b.isCompleted && new Date(b.scheduledDate) >= new Date()
  ).length;
  const totalCredits = userCreditsData.reduce((sum, c) => sum + c.creditsRemaining, 0);

  return (
    <StudentDashboardClient 
      user={user}
      bookings={userBookings}
      credits={userCreditsData}
      feedback={recentFeedback}
      stats={{
        totalBookings,
        completedBookings,
        upcomingBookings,
        totalCredits
      }}
    />
  );
}
