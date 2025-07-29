import { requireAuth } from '@/lib/auth/server-auth';
import { db } from '@/lib/db';
import { packages, packageContents, lessonTypes } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import PackagesStoreClient from './packages-store-client';

export default async function PackagesStorePage() {
  const user = await requireAuth('student');

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

      return {
        ...pkg,
        contents,
      };
    })
  );

  return (
    <PackagesStoreClient 
      user={user}
      packages={packagesWithContents}
    />
  );
}
