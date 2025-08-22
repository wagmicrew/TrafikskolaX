import { requireAuth } from '@/lib/auth/server-auth';
import { db } from '@/lib/db';
import { packages, packageContents, lessonTypes, userCredits } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import PackagesStoreClient from './packages-store-client';

export default async function PackagesStorePage({ searchParams }: { searchParams?: Promise<Record<string, string | string[]>> }) {
  const user = await requireAuth('student');
  const resolvedSearchParams = await searchParams;
  const params = resolvedSearchParams || {};


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

  // Transform packages data to handle nullable fields
  const transformedPackagesData = packagesData.map(pkg => ({
    ...pkg,
    description: pkg.description ?? undefined,
    priceStudent: pkg.priceStudent ?? undefined,
    salePrice: pkg.salePrice ?? undefined,
    isActive: pkg.isActive ?? false,
  }));

  // Fetch package contents for each package
  const packagesWithContents = await Promise.all(
    transformedPackagesData.map(async (pkg) => {
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
        description: pkg.description || 'Ingen beskrivning tillgänglig',
        price: Number(pkg.price),
        priceStudent: pkg.priceStudent ? Number(pkg.priceStudent) : undefined,
        salePrice: pkg.salePrice ? Number(pkg.salePrice) : undefined,
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

  // Transform AuthUser to match PackagesStoreClient's User interface
  const transformedUser = {
    id: user.id,
    email: user.email,
    name: `${user.firstName} ${user.lastName}`,
    role: user.role,
  };

  return (
    <PackagesStoreClient
      user={transformedUser}
      packages={packagesWithContents}
      hasActiveCredits={hasActiveCredits}
      // openPayment could be used by the client to auto-open purchase dialog
    />
  );
}
