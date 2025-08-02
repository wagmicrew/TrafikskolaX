import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { packages, packageContents, lessonTypes } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { verifyToken as verifyJWT } from '@/lib/auth/jwt';

// GET all packages with their contents
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyJWT(token);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all packages with their contents
    const allPackages = await db.query.packages.findMany({
      with: {
        contents: {
          with: {
            lessonType: true
          }
        }
      },
      orderBy: (packages, { desc }) => [desc(packages.isActive), packages.name]
    });

    return NextResponse.json(allPackages);
  } catch (error) {
    console.error('Error fetching packages:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

// POST create new package with contents
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyJWT(token);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { 
      name, 
      description, 
      price, 
      priceStudent, 
      salePrice, 
      isActive = true,
      contents 
    } = body;

    // Start a transaction
    const result = await db.transaction(async (tx) => {
      // Insert the package
      const [newPackage] = await tx.insert(packages).values({
        name: name.toString(),
        description: description?.toString() || null,
        price: price.toString(),
        priceStudent: priceStudent ? priceStudent.toString() : null,
        salePrice: salePrice ? salePrice.toString() : null,
        isActive: Boolean(isActive),
      }).returning();

      // Insert package contents if any
      if (contents && Array.isArray(contents)) {
        const packageContentsData = contents.map((content: any) => ({
          packageId: newPackage.id,
          lessonTypeId: content.lessonTypeId,
          credits: content.credits || 0,
          freeText: content.freeText || null,
        }));

        if (packageContentsData.length > 0) {
          await tx.insert(packageContents).values(packageContentsData);
        }
      }

      // Return the created package with its contents
      return tx.query.packages.findFirst({
        where: eq(packages.id, newPackage.id),
        with: {
          contents: {
            with: {
              lessonType: true
            }
          }
        }
      });
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error creating package:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

// PUT update package and its contents
export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyJWT(token);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { 
      id,
      name, 
      description, 
      price, 
      priceStudent, 
      salePrice, 
      isActive,
      contents 
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Package ID is required' }, 
        { status: 400 }
      );
    }

    // Start a transaction
    const result = await db.transaction(async (tx) => {
      // Update the package
      await tx.update(packages).set({
        name: name.toString(),
        description: description?.toString() || null,
        price: price.toString(),
        priceStudent: priceStudent ? priceStudent.toString() : null,
        salePrice: salePrice ? salePrice.toString() : null,
        isActive: Boolean(isActive),
      }).where(eq(packages.id, id));

      // Delete existing contents
      await tx.delete(packageContents).where(eq(packageContents.packageId, id));

      // Insert updated contents if any
      if (contents && Array.isArray(contents)) {
        const packageContentsData = contents.map((content: any) => ({
          packageId: id,
          lessonTypeId: content.lessonTypeId,
          credits: content.credits || 0,
          freeText: content.freeText || null,
        }));

        if (packageContentsData.length > 0) {
          await tx.insert(packageContents).values(packageContentsData);
        }
      }

      // Return the updated package with its contents
      return tx.query.packages.findFirst({
        where: eq(packages.id, id),
        with: {
          contents: {
            with: {
              lessonType: true
            }
          }
        }
      });
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating package:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

// DELETE package
export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyJWT(token);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Package ID is required' }, 
        { status: 400 }
      );
    }

    // Check if the package has any purchases
    const hasPurchases = await db.query.packagePurchases.findFirst({
      where: (purchases, { eq }) => eq(purchases.packageId, id)
    });

    if (hasPurchases) {
      // Instead of deleting, mark as inactive
      await db.update(packages)
        .set({ isActive: false })
        .where(eq(packages.id, id));
      
      return NextResponse.json({ 
        success: true, 
        message: 'Package has purchases and was deactivated instead of deleted' 
      });
    }

    // No purchases, safe to delete
    await db.delete(packages).where(eq(packages.id, id));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting package:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
