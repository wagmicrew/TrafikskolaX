import { requireAuth } from '@/lib/auth/server-auth';
import HandledarKursClient from './pageClient';
import { db } from '@/lib/db';
import { handledarSessions } from '@/lib/db/schema';
import { desc, sql } from 'drizzle-orm';

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
      maxParticipants: sql<number>`COALESCE(${handledarSessions.maxParticipants}, 0)`,
      currentParticipants: sql<number>`COALESCE(${handledarSessions.currentParticipants}, 0)`,
      pricePerParticipant: handledarSessions.pricePerParticipant,
      teacherId: handledarSessions.teacherId,
      isActive: handledarSessions.isActive,
      createdAt: sql<string>`CAST(${handledarSessions.createdAt} AS TEXT)`,
    })
    .from(handledarSessions)
    .orderBy(desc(handledarSessions.date));

  return <HandledarKursClient sessions={sessions} />;
}
