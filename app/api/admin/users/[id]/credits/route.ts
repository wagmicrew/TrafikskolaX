import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { userCredits, lessonTypes, handledarSessions } from '@/lib/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { requireAuthAPI } from '@/lib/auth/server-auth';

export const dynamic = 'force-dynamic';

// GET - Get user's credits
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const authResult = await requireAuthAPI('admin');
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log('Fetching credits for user:', id);
    if (id === 'new') {
      return NextResponse.json({ credits: [] });
    }
    
    const searchParams = new URL(request.url).searchParams;
    const creditType = searchParams.get('creditType');

    // Get all credits for the user
    let baseQuery = db
      .select({
        id: userCredits.id,
        userId: userCredits.userId,
        lessonTypeId: userCredits.lessonTypeId,
        handledarSessionId: userCredits.handledarSessionId,
        creditType: userCredits.creditType,
        creditsRemaining: userCredits.creditsRemaining,
        creditsTotal: userCredits.creditsTotal,
        packageId: userCredits.packageId,
        createdAt: userCredits.createdAt,
        updatedAt: userCredits.updatedAt,
      })
      .from(userCredits)
      .where(eq(userCredits.userId, id));

    // Apply credit type filter if specified
    if (creditType) {
      baseQuery = baseQuery.where(and(
        eq(userCredits.userId, id),
        eq(userCredits.creditType, creditType)
      ));
    }

    // Get base credits first
    const baseCredits = await baseQuery;
    console.log('Base credits found:', baseCredits.length);

    // Enrich with lesson type or handledar session names
    const enrichedCredits = await Promise.all(
      baseCredits.map(async (credit) => {
        if (credit.creditType === 'lesson' && credit.lessonTypeId) {
          const lessonType = await db
            .select({ name: lessonTypes.name })
            .from(lessonTypes)
            .where(eq(lessonTypes.id, credit.lessonTypeId))
            .limit(1);
          return {
            ...credit,
            lessonTypeName: lessonType[0]?.name || 'Unknown Lesson Type'
          };
        } else if (credit.creditType === 'handledar' && credit.handledarSessionId) {
          const session = await db
            .select({ title: handledarSessions.title })
            .from(handledarSessions)
            .where(eq(handledarSessions.id, credit.handledarSessionId))
            .limit(1);
          return {
            ...credit,
            handledarSessionTitle: session[0]?.title || 'Unknown Handledar Session'
          };
        } else if (credit.creditType === 'handledar' && !credit.handledarSessionId) {
          return {
            ...credit,
            handledarSessionTitle: 'Generic Handledar Credits'
          };
        }
        return credit;
      })
    );

    console.log('Enriched credits:', enrichedCredits.length);
    return NextResponse.json({ credits: enrichedCredits });
  } catch (error) {
    console.error('Error fetching user credits:', error);
    return NextResponse.json({ error: 'Failed to fetch user credits' }, { status: 500 });
  }
}

// POST - Add credits to user
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const authResult = await requireAuthAPI('admin');
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { lessonTypeId, handledarSessionId, creditType, amount } = body;

    // For lesson credits, lessonTypeId is required
    // For handledar credits, handledarSessionId is optional (generic credits)
    if ((creditType === 'lesson' && !lessonTypeId) || !amount || amount === 0 || !creditType) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    console.log('=== POST /api/admin/users/[id]/credits ===');
    console.log('User ID:', id);
    console.log('Request body:', body);
    console.log('Credit details:', { userId: id, creditType, lessonTypeId, handledarSessionId, amount });

    // For lesson credits, check for existing credits with same lesson type
    // For handledar credits, check for existing generic credits (no session ID)
    let whereConditions = [
      eq(userCredits.userId, id),
      eq(userCredits.creditType, creditType)
    ];

    if (creditType === 'lesson' && lessonTypeId) {
      whereConditions.push(eq(userCredits.lessonTypeId, lessonTypeId));
    } else if (creditType === 'handledar' && !handledarSessionId) {
      // Generic handledar credits have null handledarSessionId
      whereConditions.push(isNull(userCredits.handledarSessionId));
    } else if (creditType === 'handledar' && handledarSessionId) {
      whereConditions.push(eq(userCredits.handledarSessionId, handledarSessionId));
    }

    const existingCredits = await db
      .select()
      .from(userCredits)
      .where(and(...whereConditions))
      .limit(1);

    console.log('Existing credits found:', existingCredits.length);
    if (existingCredits.length > 0) {
      console.log('Existing credit details:', existingCredits[0]);
    }

    if (existingCredits.length > 0) {
// Update existing credits
      const newCreditsRemaining = existingCredits[0].creditsRemaining + amount;
      if (newCreditsRemaining < 0) {
        return NextResponse.json({ error: 'Not enough credits to deduct' }, { status: 400 });
      }

      const updated = await db
        .update(userCredits)
        .set({
          creditsRemaining: newCreditsRemaining,
          // Only increase creditsTotal when adding credits, not when deducting
          creditsTotal: amount > 0 ? existingCredits[0].creditsTotal + amount : existingCredits[0].creditsTotal,
          updatedAt: new Date(),
        })
        .where(eq(userCredits.id, existingCredits[0].id))
        .returning();

      return NextResponse.json({ 
        message: amount > 0 ? 'Credits added successfully' : 'Credits deducted successfully',
        credits: updated[0]
      });
    } else {
      // Create new credit entry
      console.log('Creating new credit entry...');
      const valuesToInsert = {
        userId: id,
        lessonTypeId: lessonTypeId || null,
        handledarSessionId: handledarSessionId || null,
        creditType,
        creditsRemaining: amount,
        creditsTotal: amount,
      };
      console.log('Values to insert:', valuesToInsert);
      
      const [newCredits] = await db
        .insert(userCredits)
        .values(valuesToInsert)
        .returning();
      
      console.log('Created new credit:', newCredits);

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

// PUT - Update credits for user
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const authResult = await requireAuthAPI('admin');
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { creditsId, creditsRemaining } = body;

    if (!creditsId || creditsRemaining < 0) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    // Update credits
    const updated = await db
      .update(userCredits)
      .set({
        creditsRemaining,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(userCredits.id, creditsId),
          eq(userCredits.userId, id)
        )
      )
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ error: 'Credits not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      message: 'Credits updated successfully',
      credits: updated[0]
    });
  } catch (error) {
    console.error('Error updating credits:', error);
    return NextResponse.json({ error: 'Failed to update credits' }, { status: 500 });
  }
}

// DELETE - Remove credits from user
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const authResult = await requireAuthAPI('admin');
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
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
          eq(userCredits.userId, id)
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
