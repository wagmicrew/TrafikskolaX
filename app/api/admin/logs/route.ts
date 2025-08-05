import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAPI } from '@/lib/auth/server-auth';
import { logger } from '@/lib/logging/logger';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuthAPI('admin');
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    // Log the admin access for audit trail
    logger.info('system', 'Admin accessed logs interface', {
      userId: authResult.user?.id,
      userEmail: authResult.user?.email
    });

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const category = searchParams.get('category');
    const filename = searchParams.get('filename');
    const lines = searchParams.get('lines');

    switch (action) {
      case 'files':
        const files = logger.getLogFiles();
        const stats = logger.getLogStats();
        return NextResponse.json({ files, stats });

      case 'read':
        if (!filename) {
          return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
        }
        const maxLines = lines ? parseInt(lines) : undefined;
        const logEntries = logger.readLogFile(filename, maxLines);
        return NextResponse.json({ logs: logEntries });

      case 'stats':
        const logStats = logger.getLogStats();
        return NextResponse.json(logStats);

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error handling logs request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireAuthAPI('admin');
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    logger.clearLogs(category || undefined);

    return NextResponse.json({ 
      success: true, 
      message: category ? `Cleared logs for category: ${category}` : 'Cleared all logs' 
    });
  } catch (error) {
    console.error('Error clearing logs:', error);
    return NextResponse.json({ error: 'Failed to clear logs' }, { status: 500 });
  }
}
