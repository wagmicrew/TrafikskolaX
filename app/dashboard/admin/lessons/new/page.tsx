import { requireAuth } from '@/lib/auth/server-auth';
import NewLessonClient from './new-lesson-client';

export const dynamic = 'force-dynamic';

export default async function NewLessonPage() {
  await requireAuth('admin');
  
  return <NewLessonClient />;
}
