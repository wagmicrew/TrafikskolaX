import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/server-auth';
import { PersonalDataManager } from '@/lib/utils/personal-data';

export async function POST(request: NextRequest) {
  try {
    await requireAuth('admin');

    const result = await PersonalDataManager.cleanupCompletedCourses();

    return NextResponse.json({
      success: true,
      message: `Rensade ${result.cleaned} personnummer från avslutade kurser`,
      cleaned: result.cleaned
    });

  } catch (error) {
    console.error('Error during data cleanup:', error);
    return NextResponse.json(
      { error: 'Kunde inte rensa data' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await requireAuth('admin');

    const stats = await PersonalDataManager.getRetentionStats();

    return NextResponse.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Error getting retention stats:', error);
    return NextResponse.json(
      { error: 'Kunde inte hämta statistik' },
      { status: 500 }
    );
  }
}
