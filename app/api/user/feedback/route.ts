import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { userFeedback, bookingSteps, users } from '@/lib/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

// Helper function to validate JWT and get user ID
async function getUserFromToken(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    return decoded.userId;
  } catch (error) {
    return null;
  }
}

// GET - Fetch user's feedback for education steps
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all feedback for the user, grouped by step identifier
    const feedbackData = await db
      .select({
        stepIdentifier: userFeedback.stepIdentifier,
        valuation: userFeedback.valuation,
        feedbackText: userFeedback.feedbackText,
        isFromTeacher: userFeedback.isFromTeacher,
        createdAt: userFeedback.createdAt,
      })
      .from(userFeedback)
      .where(eq(userFeedback.userId, userId))
      .orderBy(desc(userFeedback.createdAt));

    // Group feedback by step identifier and get the latest valuation
    const stepFeedback = feedbackData.reduce((acc, feedback) => {
      const stepId = feedback.stepIdentifier;
      if (!stepId) return acc;
      
      if (!acc[stepId] || feedback.createdAt > acc[stepId].createdAt) {
        acc[stepId] = feedback;
      }
      return acc;
    }, {} as Record<string, typeof feedbackData[0]>);

    // Also fetch all booking steps for reference
    const steps = await db
      .select()
      .from(bookingSteps)
      .orderBy(bookingSteps.stepNumber);

    return NextResponse.json({ 
      feedback: stepFeedback,
      steps: steps
    });

  } catch (error) {
    console.error('Fetch user feedback error:', error);
    return NextResponse.json({ error: 'Failed to fetch feedback' }, { status: 500 });
  }
}
