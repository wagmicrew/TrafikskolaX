import { requireAuth } from '@/lib/auth/server-auth';
import { db } from '@/lib/db';
import { lessonTypes, packages, packageContents, userCredits } from '@/lib/db/schema';
import { sql, desc, eq } from 'drizzle-orm';
import LessonsClient from './lessons-client';

export const dynamic = 'force-dynamic';

export default async function LessonsPage() {
  // Ensure admin access
  await requireAuth('admin');

  // Fetch lesson types with usage statistics
  const lessons = await db
    .select({
      id: lessonTypes.id,
      name: lessonTypes.name,
      description: lessonTypes.description,
      durationMinutes: lessonTypes.durationMinutes,
      price: lessonTypes.price,
      priceStudent: lessonTypes.priceStudent,
      salePrice: lessonTypes.salePrice,
      isActive: lessonTypes.isActive,
      createdAt: lessonTypes.createdAt,
      bookingCount: sql<number>`(
        SELECT COUNT(*) FROM bookings 
        WHERE bookings.lesson_type_id = ${lessonTypes.id}
      )`,
    })
    .from(lessonTypes)
    .orderBy(desc(lessonTypes.isActive), lessonTypes.name);

  // Fetch packages with contents
  const packagesList = await db
    .select({
      id: packages.id,
      name: packages.name,
      description: packages.description,
      price: packages.price,
      priceStudent: packages.priceStudent,
      salePrice: packages.salePrice,
      isActive: packages.isActive,
      createdAt: packages.createdAt,
      purchaseCount: sql<number>`(
        SELECT COUNT(*) FROM package_purchases 
        WHERE package_purchases.package_id = ${packages.id}
      )`,
    })
    .from(packages)
    .orderBy(desc(packages.isActive), packages.name);

  // Get lesson type statistics
  const lessonStats = {
    totalLessons: lessons.length,
    activeLessons: lessons.filter(l => l.isActive).length,
    totalPackages: packagesList.length,
    activePackages: packagesList.filter(p => p.isActive).length,
  };

  return (
    <LessonsClient
      lessons={lessons}
      packages={packagesList}
      stats={lessonStats}
    />
  );
}
