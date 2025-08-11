import { requireAuth } from '@/lib/auth/server-auth';
import LessonContentClient from './lesson-content-client';
import MissingTablesClient from './MissingTablesClient';
import { bookingSteps } from '@/lib/db/schema';
import { asc } from 'drizzle-orm';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function LessonContentPage() {
  await requireAuth('admin');

  try {
    // Load booking steps as the source of truth
    const steps = await db.select().from(bookingSteps).orderBy(asc(bookingSteps.stepNumber), asc(bookingSteps.id));
    // Transform steps into group/item structure: group by category, items are subcategory+description
    const groupMap: Record<string, { id: string; name: string; sortOrder: number; isActive: boolean } > = {};
    const groups: any[] = [];
    const items: any[] = [];
    let groupOrder = 0;
    for (const s of steps) {
      const groupKey = s.category;
      if (!groupMap[groupKey]) {
        const id = `${groupKey}`;
        const g = { id, name: groupKey, sortOrder: groupOrder++, isActive: true };
        groupMap[groupKey] = g;
        groups.push(g);
      }
      items.push({
        id: `${s.id}`,
        groupId: groupMap[groupKey].id,
        title: s.subcategory,
        description: s.description,
        durationMinutes: null,
        sortOrder: s.stepNumber,
        isActive: true,
      });
    }
    return <LessonContentClient initialGroups={groups} initialItems={items} />;
  } catch (e) {
    return <MissingTablesClient />;
  }
 
}


