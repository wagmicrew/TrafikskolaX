import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { packageContents } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { verifyToken as verifyJWT } from '@/lib/auth/jwt';

// PUT update specific package content
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; contentId: string } }
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

    const { id: packageId, contentId } = params;
    const body = await request.json();
    const { 
      lessonTypeId, 
      handledarSessionId, 
      credits, 
      contentType, 
      freeText, 
      sortOrder 
    } = body;

    // Update the content
    await db.update(packageContents)
      .set({
        lessonTypeId: lessonTypeId || null,
        handledarSessionId: handledarSessionId || null,
        credits: credits || 0,
        contentType: contentType || 'lesson',
        freeText: freeText || null,
        sortOrder: sortOrder || 0,
      })
      .where(
        and(
          eq(packageContents.id, contentId),
          eq(packageContents.packageId, packageId)
        )
      );

    // Fetch the updated content with relations
    const updatedContent = await db.query.packageContents.findFirst({
      where: eq(packageContents.id, contentId),
      with: {
        lessonType: true,
        handledarSession: true
      }
    });

    if (!updatedContent) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    return NextResponse.json(updatedContent);
  } catch (error) {
    console.error('Error updating package content:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

// DELETE specific package content
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; contentId: string } }
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

    const { id: packageId, contentId } = params;

    // Delete the content
    const deletedContent = await db.delete(packageContents)
      .where(
        and(
          eq(packageContents.id, contentId),
          eq(packageContents.packageId, packageId)
        )
      )
      .returning();

    if (deletedContent.length === 0) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Package content deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting package content:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
