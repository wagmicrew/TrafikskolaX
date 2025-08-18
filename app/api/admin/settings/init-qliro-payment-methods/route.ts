import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAPI } from '@/lib/auth/server-auth';
import { db } from '@/lib/db';
import { siteSettings } from '@/lib/db/schema';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthAPI('admin');
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const paymentMethodSettings = [
      { key: 'qliro_payment_invoice', value: 'true', category: 'payment', description: 'Enable Qliro Invoice payment method' },
      { key: 'qliro_payment_campaign', value: 'false', category: 'payment', description: 'Enable Qliro Campaign payment method' },
      { key: 'qliro_payment_partpayment_account', value: 'false', category: 'payment', description: 'Enable Qliro Part Payment Account' },
      { key: 'qliro_payment_partpayment_fixed', value: 'false', category: 'payment', description: 'Enable Qliro Part Payment Fixed' },
      { key: 'qliro_payment_creditcards', value: 'true', category: 'payment', description: 'Enable Qliro Credit Cards payment method' },
      { key: 'qliro_payment_free', value: 'false', category: 'payment', description: 'Enable Qliro Free payment method' },
      { key: 'qliro_payment_trustly_direct', value: 'false', category: 'payment', description: 'Enable Qliro Trustly Direct payment method' },
      { key: 'qliro_payment_swish', value: 'false', category: 'payment', description: 'Enable Qliro Swish payment method' }
    ];

    const results = [];
    
    for (const setting of paymentMethodSettings) {
      try {
        await db.insert(siteSettings).values({
          key: setting.key,
          value: setting.value,
          category: setting.category,
          description: setting.description,
          createdAt: new Date(),
          updatedAt: new Date()
        }).onConflictDoNothing();
        
        results.push({ key: setting.key, status: 'added' });
      } catch (error) {
        results.push({ key: setting.key, status: 'error', error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Qliro payment method settings initialized',
      results 
    });
  } catch (error) {
    console.error('Error initializing Qliro payment method settings:', error);
    return NextResponse.json({ 
      error: 'Failed to initialize payment method settings',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
