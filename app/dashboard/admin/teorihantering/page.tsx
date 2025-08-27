import { requireAuth } from '@/lib/auth/server-auth';
import { db } from '@/lib/db';
import { teoriLessonTypes, teoriSessions, teoriBookings, teoriSupervisors, users } from '@/lib/db/schema';
import { eq, desc, and, gte, sql } from 'drizzle-orm';
// import TeoriHanteringClient from './teori-hantering-client';

export const dynamic = 'force-dynamic';

export default async function TeoriHanteringPage() {
  // Ensure admin access
  await requireAuth('admin');

  // Load lesson types (groups)
  const lessonTypes = await db
    .select()
    .from(teoriLessonTypes)
    .orderBy(teoriLessonTypes.sortOrder, teoriLessonTypes.name);

  // Load sessions grouped by lesson type
  const sessionsData = await db
    .select({
      id: teoriSessions.id,
      lessonTypeId: teoriSessions.lessonTypeId,
      title: teoriSessions.title,
      description: teoriSessions.description,
      date: teoriSessions.date,
      startTime: teoriSessions.startTime,
      endTime: teoriSessions.endTime,
      maxParticipants: teoriSessions.maxParticipants,
      currentParticipants: teoriSessions.currentParticipants,
      isActive: teoriSessions.isActive,
      createdAt: teoriSessions.createdAt,
      updatedAt: teoriSessions.updatedAt,
      lessonTypeName: teoriLessonTypes.name,
      lessonTypeAllowsSupervisors: teoriLessonTypes.allowsSupervisors,
      lessonTypePrice: teoriLessonTypes.price,
      lessonTypePricePerSupervisor: teoriLessonTypes.pricePerSupervisor
    })
    .from(teoriSessions)
    .leftJoin(teoriLessonTypes, eq(teoriSessions.lessonTypeId, teoriLessonTypes.id))
    .orderBy(teoriLessonTypes.sortOrder, desc(teoriSessions.date), teoriSessions.startTime);

  // Load bookings with participant and supervisor details for each session
  const bookingsData = await db
    .select({
      id: teoriBookings.id,
      sessionId: teoriBookings.sessionId,
      studentId: teoriBookings.studentId,
      status: teoriBookings.status,
      paymentStatus: teoriBookings.paymentStatus,
      paymentMethod: teoriBookings.paymentMethod,
      price: teoriBookings.price,
      createdAt: teoriBookings.createdAt,
      updatedAt: teoriBookings.updatedAt,
      // Student details
      studentFirstName: users.firstName,
      studentLastName: users.lastName,
      studentEmail: users.email,
      studentPersonalNumber: users.personalNumber
    })
    .from(teoriBookings)
    .leftJoin(users, eq(teoriBookings.studentId, users.id))
    .orderBy(teoriBookings.createdAt);

  // Load student options for adding participants
  const students = await db
    .select({
      id: users.id,
      name: sql<string>`${users.firstName} || ' ' || ${users.lastName}`,
      email: users.email,
      personalNumber: users.personalNumber
    })
    .from(users)
    .where(eq(users.role, 'student'))
    .orderBy(users.firstName, users.lastName);

  // Structure data hierarchically: lessonTypes -> sessions -> bookings with null safety
  const structuredData = lessonTypes.map(lessonType => {
    const typeSessions = sessionsData.filter(session => session.lessonTypeId === lessonType.id);

    const sessionsWithBookings = typeSessions.map(session => {
      const sessionBookings = bookingsData.filter(booking => booking.sessionId === session.id);

      return {
        ...session,
        bookings: sessionBookings || []
      };
    });

    return {
      ...lessonType,
      allowsSupervisors: lessonType.allowsSupervisors || false,
      sessions: sessionsWithBookings || []
    };
  });

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-red-600 mb-4">Teori Management Temporarily Unavailable</h1>
      <p className="text-gray-600">This page is currently being fixed. Please check back later.</p>
      <div className="mt-4 p-4 bg-yellow-100 border border-yellow-400 rounded">
        <p className="text-yellow-800">Status: Fixing syntax errors in the component file.</p>
      </div>
    </div>
  );
}
