import { requireAuth } from '@/lib/auth/server-auth';
import { db } from '@/lib/db';
import { packages, packageContents, lessonTypes, userCredits } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import PackagesStoreClient from './packages-store-client';

export default async function PackagesStorePage({ searchParams }: { searchParams?: Record<string, string | string[]> }) {
  const user = await requireAuth('student');
  const params = searchParams || {};
  const openPayment = (Array.isArray(params.openPayment) ? params.openPayment[0] : params.openPayment) || '';

  // Fetch all active packages with their contents
  const packagesData = await db
    .select({
      id: packages.id,
      name: packages.name,
      description: packages.description,
      price: packages.price,
      priceStudent: packages.priceStudent,
      salePrice: packages.salePrice,
      isActive: packages.isActive,
    })
    .from(packages)
    .where(eq(packages.isActive, true));

  // Fetch package contents for each package
  const packagesWithContents = await Promise.all(
    packagesData.map(async (pkg) => {
      const contents = await db
        .select({
          id: packageContents.id,
          credits: packageContents.credits,
          freeText: packageContents.freeText,
          lessonTypeName: lessonTypes.name,
        })
        .from(packageContents)
        .leftJoin(lessonTypes, eq(packageContents.lessonTypeId, lessonTypes.id))
        .where(eq(packageContents.packageId, pkg.id));

      // Transform contents into features array and calculate total credits
      const features = contents.map(content => {
        if (content.freeText) {
          return content.freeText;
        }
        if (content.lessonTypeName) {
          return `${content.credits} krediter för ${content.lessonTypeName}`;
        }
        return `${content.credits} krediter`;
      });

      const totalCredits = contents.reduce((sum, content) => sum + (content.credits || 0), 0);

      return {
        ...pkg,
        features: features.length > 0 ? features : ['Inga funktioner angivna'],
        credits: totalCredits,
        image: '', // Add a default image path if needed
        isPopular: false, // You can add logic to determine this
      };
    })
  );

  // Determine if user already has active credits
  const existingCredits = await db
    .select({
      creditsRemaining: userCredits.creditsRemaining,
    })
    .from(userCredits)
    .where(eq(userCredits.userId, user.id));

  const hasActiveCredits = existingCredits.some((c) => (Number(c.creditsRemaining) || 0) > 0);

  return (
    <PackagesStoreClient 
      user={user}
      packages={packagesWithContents}
      hasActiveCredits={hasActiveCredits}
      // openPayment could be used by the client to auto-open purchase dialog
    />
  );
}
