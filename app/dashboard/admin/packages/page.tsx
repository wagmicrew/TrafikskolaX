import { requireAuth } from '@/lib/auth/server-auth';
import { db } from '@/lib/db/client';
import { packages, packageContents, lessonTypes } from '@/lib/db/schema';
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
          lessonType: true
        }
      }
    },
    orderBy: (packages, { desc }) => [desc(packages.isActive), packages.name]
  });

  // Get all lesson types for the package builder
  const allLessonTypes = await db.query.lessonTypes.findMany({
    orderBy: (types, { asc }) => [asc(types.name)]
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
      stats={packageStats} 
    />
  );
}
