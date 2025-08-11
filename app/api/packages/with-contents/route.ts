import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { packages, packageContents, lessonTypes } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// GET active packages with their contents, transformed for store display
export async function GET(_request: NextRequest) {
  try {
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

        const features = contents.map((content) => {
          if (content.freeText) return content.freeText;
          if (content.lessonTypeName) return `${content.credits} krediter för ${content.lessonTypeName}`;
          return `${content.credits} krediter`;
        });

        const totalCredits = contents.reduce((sum, content) => sum + (content.credits || 0), 0);

        return {
          ...pkg,
          features: features.length > 0 ? features : ['Inga funktioner angivna'],
          credits: totalCredits,
          image: '',
          isPopular: false,
        };
      })
    );

    return NextResponse.json({ packages: packagesWithContents });
  } catch (error) {
    console.error('Error fetching packages with contents:', error);
    return NextResponse.json({ error: 'Failed to fetch packages' }, { status: 500 });
  }
}




