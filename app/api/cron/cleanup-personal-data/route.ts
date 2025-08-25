import { NextRequest, NextResponse } from 'next/server';
import { PersonalDataManager } from '@/lib/utils/personal-data';

export async function POST(request: NextRequest) {
  try {
    // Basic auth check for cron requests
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET_TOKEN;

    if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[CRON] Starting automated personal data cleanup');

    const result = await PersonalDataManager.cleanupCompletedCourses();

    console.log(`[CRON] Cleanup completed. Cleaned ${result.cleaned} records.`);

    return NextResponse.json({
      success: true,
      message: `Automated cleanup: ${result.cleaned} records cleaned`,
      cleaned: result.cleaned,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[CRON] Error during automated cleanup:', error);
    return NextResponse.json(
      { error: 'Automated cleanup failed' },
      { status: 500 }
    );
  }
}
