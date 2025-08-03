import { requireAuth } from '@/lib/auth/server-auth';
import { db } from '@/lib/db';
import { lessonTypes } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import EditLessonClient from './edit-lesson-client';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditLessonPage({ params }: Props) {
  await requireAuth('admin');
  const { id } = await params;

  // Fetch lesson type
  const [lesson] = await db
    .select()
    .from(lessonTypes)
    .where(eq(lessonTypes.id, id))
    .limit(1);

  if (!lesson) {
    notFound();
  }

  return <EditLessonClient lesson={lesson} />;
}
