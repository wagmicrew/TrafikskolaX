import { requireAuth } from '@/lib/auth/server-auth';
import { db } from '@/lib/db/client';
import { packages, packageContents, lessonTypes, handledarSessions } from '@/lib/db/schema';
import { sql, desc, eq } from 'drizzle-orm';
import PackagesClient from './packages-client';

export const dynamic = 'force-dynamic';

export default async function PackagesPage() {
  // Ensure admin access
  await requireAuth('admin');

  // Fetch all packages with their contents
  const packagesList = await db.query.packages.findMany({
    with: {
      contents: {
        with: {
          lessonType: true,
          handledarSession: true
        }
      }
    },
    orderBy: (packages, { desc }) => [desc(packages.isActive), packages.name]
  });

  // Get all lesson types for the package builder
  const allLessonTypes = await db.query.lessonTypes.findMany({
    where: eq(lessonTypes.isActive, true),
    orderBy: (types, { asc }) => [asc(types.name)]
  });

  // Get all handledar sessions for the package builder
  const allHandledarSessions = await db.query.handledarSessions.findMany({
    where: eq(handledarSessions.isActive, true),
    orderBy: (sessions, { asc }) => [asc(sessions.title)]
  });

  // Calculate package statistics
  const packageStats = {
    totalPackages: packagesList.length,
    activePackages: packagesList.filter(p => p.isActive).length,
  };

  return (
    <PackagesClient 
      packages={packagesList} 
      lessonTypes={allLessonTypes}
      handledarSessions={allHandledarSessions}
      stats={packageStats} 
    />
  );
}
