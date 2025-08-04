import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { packageContents, lessonTypes } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { verifyToken as verifyJWT } from '@/lib/auth/jwt';

// GET package contents for a specific package
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyJWT(token);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id: packageId } = params;

    const contents = await db.query.packageContents.findMany({
      where: eq(packageContents.packageId, packageId),
      with: {
        lessonType: true,
        handledarSession: true
      },
      orderBy: (packageContents, { asc }) => [asc(packageContents.sortOrder)]
    });

    return NextResponse.json(contents);
  } catch (error) {
    console.error('Error fetching package contents:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

// POST add new content to package
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyJWT(token);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id: packageId } = params;
    const body = await request.json();
    const { 
      lessonTypeId, 
      handledarSessionId, 
      credits, 
      contentType, 
      freeText, 
      sortOrder 
    } = body;

    const [newContent] = await db.insert(packageContents).values({
      packageId,
      lessonTypeId: lessonTypeId || null,
      handledarSessionId: handledarSessionId || null,
      credits: credits || 0,
      contentType: contentType || 'lesson',
      freeText: freeText || null,
      sortOrder: sortOrder || 0,
    }).returning();

    // Fetch the complete content with relations
    const contentWithRelations = await db.query.packageContents.findFirst({
      where: eq(packageContents.id, newContent.id),
      with: {
        lessonType: true,
        handledarSession: true
      }
    });

    return NextResponse.json(contentWithRelations);
  } catch (error) {
    console.error('Error adding package content:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
