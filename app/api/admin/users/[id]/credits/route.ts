import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { userCredits, lessonTypes } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth/server-auth';

export const dynamic = 'force-dynamic';

// GET - Get user's credits
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuth('admin');
    
    const credits = await db
      .select({
        id: userCredits.id,
        lessonTypeId: userCredits.lessonTypeId,
        creditsRemaining: userCredits.creditsRemaining,
        creditsTotal: userCredits.creditsTotal,
        packageId: userCredits.packageId,
        lessonTypeName: lessonTypes.name,
        createdAt: userCredits.createdAt,
        updatedAt: userCredits.updatedAt,
      })
      .from(userCredits)
      .leftJoin(lessonTypes, eq(userCredits.lessonTypeId, lessonTypes.id))
      .where(eq(userCredits.userId, params.id));

    return NextResponse.json({ credits });
  } catch (error) {
    console.error('Error fetching user credits:', error);
    return NextResponse.json({ error: 'Failed to fetch user credits' }, { status: 500 });
  }
}

// POST - Add credits to user
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuth('admin');
    
    const body = await request.json();
    const { lessonTypeId, amount } = body;

    if (!lessonTypeId || !amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid lesson type or amount' }, { status: 400 });
    }

    // Check if user already has credits for this lesson type
    const existingCredits = await db
      .select()
      .from(userCredits)
      .where(
        and(
          eq(userCredits.userId, params.id),
          eq(userCredits.lessonTypeId, lessonTypeId)
        )
      )
      .limit(1);

    if (existingCredits.length > 0) {
      // Update existing credits
      const updated = await db
        .update(userCredits)
        .set({
          creditsRemaining: existingCredits[0].creditsRemaining + amount,
          creditsTotal: existingCredits[0].creditsTotal + amount,
          updatedAt: new Date(),
        })
        .where(eq(userCredits.id, existingCredits[0].id))
        .returning();

      return NextResponse.json({ 
        message: 'Credits added successfully',
        credits: updated[0]
      });
    } else {
      // Create new credit entry
      const [newCredits] = await db
        .insert(userCredits)
        .values({
          userId: params.id,
          lessonTypeId,
          creditsRemaining: amount,
          creditsTotal: amount,
        })
        .returning();

      return NextResponse.json({ 
        message: 'Credits added successfully',
        credits: newCredits
      });
    }
  } catch (error) {
    console.error('Error adding credits:', error);
    return NextResponse.json({ error: 'Failed to add credits' }, { status: 500 });
  }
}

// DELETE - Remove credits from user
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuth('admin');
    
    const { searchParams } = new URL(request.url);
    const creditsId = searchParams.get('creditsId');
    const amount = parseInt(searchParams.get('amount') || '1');
    const removeAll = searchParams.get('all') === 'true';

    if (!creditsId) {
      return NextResponse.json({ error: 'Credits ID required' }, { status: 400 });
    }

    // Get current credits
    const currentCredits = await db
      .select()
      .from(userCredits)
      .where(
        and(
          eq(userCredits.id, creditsId),
          eq(userCredits.userId, params.id)
        )
      )
      .limit(1);

    if (currentCredits.length === 0) {
      return NextResponse.json({ error: 'Credits not found' }, { status: 404 });
    }

    const current = currentCredits[0];

    if (removeAll || current.creditsRemaining <= amount) {
      // Remove all credits
      await db
        .delete(userCredits)
        .where(eq(userCredits.id, creditsId));

      return NextResponse.json({ 
        message: 'All credits removed successfully'
      });
    } else {
      // Reduce credits by amount
      const updated = await db
        .update(userCredits)
        .set({
          creditsRemaining: current.creditsRemaining - amount,
          updatedAt: new Date(),
        })
        .where(eq(userCredits.id, creditsId))
        .returning();

      return NextResponse.json({ 
        message: 'Credits removed successfully',
        credits: updated[0]
      });
    }
  } catch (error) {
    console.error('Error removing credits:', error);
    return NextResponse.json({ error: 'Failed to remove credits' }, { status: 500 });
  }
}
