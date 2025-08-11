import { requireAuth } from '@/lib/auth/server-auth';
import HandledarKursClient from './pageClient';
import { db } from '@/lib/db';
import { handledarSessions } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export default async function HandledarKursPage() {
  await requireAuth('admin');

  const sessions = await db
    .select({
      id: handledarSessions.id,
      title: handledarSessions.title,
      description: handledarSessions.description,
      date: handledarSessions.date,
      startTime: handledarSessions.startTime,
      endTime: handledarSessions.endTime,
      maxParticipants: handledarSessions.maxParticipants,
      currentParticipants: handledarSessions.currentParticipants,
      pricePerParticipant: handledarSessions.pricePerParticipant,
      teacherId: handledarSessions.teacherId,
      isActive: handledarSessions.isActive,
      createdAt: handledarSessions.createdAt,
    })
    .from(handledarSessions)
    .orderBy(desc(handledarSessions.date));

  return <HandledarKursClient sessions={sessions} />;
}
