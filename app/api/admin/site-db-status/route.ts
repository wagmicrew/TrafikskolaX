import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAPI } from '@/lib/auth/server-auth';
import { logger } from '@/lib/logging/logger';
import { db } from '@/lib/db';
import { users, bookings, siteSettings } from '@/lib/db/schema';
import { count } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuthAPI('admin');
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Gather site operational status
    const siteStatus = {
      nodeVersion: process.version,
      platform: process.platform,
      architecture: process.arch,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString()
    };

    // Check database connection and get stats
    let dbStatus;
    try {
      const [userCount] = await db.select({ count: count() }).from(users);
      const [bookingCount] = await db.select({ count: count() }).from(bookings);
      const [settingCount] = await db.select({ count: count() }).from(siteSettings);
      
      dbStatus = {
        connected: true,
        host: process.env.DATABASE_HOST || 'neon-db',
        database: 'trafikskolax',
        tables: {
          users: userCount.count,
          bookings: bookingCount.count,
          settings: settingCount.count
        },
        lastChecked: new Date().toISOString()
      };
    } catch (dbError) {
      dbStatus = {
        connected: false,
        error: dbError.message,
        lastChecked: new Date().toISOString()
      };
    }

    logger.info('system', 'Site and DB status retrieved', { userId: user.id });

    return NextResponse.json({
      siteStatus,
      dbStatus,
      message: 'Site and database status retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching site and DB status:', error);
    logger.error('system', 'Failed to retrieve site/DB status', { error: error.message });
    return NextResponse.json({ error: 'Failed to retrieve site/DB status' }, { status: 500 });
  }
}

