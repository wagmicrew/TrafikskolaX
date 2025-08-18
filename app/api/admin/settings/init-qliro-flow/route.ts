import { NextResponse } from 'next/server';
import { requireAuthAPI } from '@/lib/auth/server-auth';
import { db } from '@/lib/db';
import { siteSettings } from '@/lib/db/schema';

export async function POST() {
  try {
    const user = await requireAuthAPI('admin');
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Insert or update the qliro_checkout_flow setting
    await db.insert(siteSettings).values({
      key: 'qliro_checkout_flow',
      value: 'window',
      description: 'Qliro checkout flow type: window (new window) or popup (modal popup)',
      createdAt: new Date(),
      updatedAt: new Date()
    }).onConflictDoUpdate({
      target: siteSettings.key,
      set: {
        description: 'Qliro checkout flow type: window (new window) or popup (modal popup)',
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'qliro_checkout_flow setting added/updated successfully' 
    });
    
  } catch (error) {
    console.error('Error adding qliro_checkout_flow setting:', error);
    return NextResponse.json({ 
      error: 'Failed to add setting',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
