import { requireAuth } from '@/lib/auth/server-auth';
import { db } from '@/lib/db';
import { lessonTypes, packages, packageContents, userCredits, handledarSessions } from '@/lib/db/schema';
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

  // Fetch handledar sessions for package builder
  const handledarSessionsList = await db
    .select({
      id: handledarSessions.id,
      title: handledarSessions.title,
      isActive: handledarSessions.isActive,
    })
    .from(handledarSessions)
    .orderBy(desc(handledarSessions.isActive), handledarSessions.title);

  // Transform data to handle nullable booleans and match expected types
  const transformedLessons = lessons.map(lesson => ({
    ...lesson,
    isActive: lesson.isActive ?? false,
    description: lesson.description ?? null,
  }));

  const transformedPackages = packagesList.map(pkg => ({
    ...pkg,
    isActive: pkg.isActive ?? false,
    description: pkg.description ?? undefined,
    priceStudent: pkg.priceStudent ?? undefined,
    salePrice: pkg.salePrice ?? undefined,
    contents: [], // Add missing contents property for Package interface
  }));

  const transformedSessions = handledarSessionsList.map(session => ({
    ...session,
    isActive: session.isActive ?? false,
  }));

  // Get lesson type statistics
  const lessonStats = {
    totalLessons: transformedLessons.length,
    activeLessons: transformedLessons.filter(l => l.isActive).length,
    totalPackages: transformedPackages.length,
    activePackages: transformedPackages.filter(p => p.isActive).length,
  };

  return (
    <LessonsClient
      lessons={transformedLessons}
      packages={transformedPackages}
      handledarSessions={transformedSessions}
      stats={lessonStats}
    />
  );
}
