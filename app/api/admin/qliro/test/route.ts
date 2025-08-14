import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAPI } from '@/lib/auth/server-auth';
import { qliroService } from '@/lib/payment/qliro-service';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthAPI('admin');
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const url = new URL(request.url);
    const extended = url.searchParams.get('extended') === '1' || url.searchParams.get('debug') === '1';
    const result = await qliroService.testConnection({ extended });
    return NextResponse.json(result, { status: result.success ? 200 : 502 });
  } catch (error) {
    console.error('Qliro test error:', error);
    return NextResponse.json({ success: false, message: 'Failed to test Qliro connection' }, { status: 500 });
  }
}

export async function GET(_request: NextRequest) {
  try {
    const auth = await requireAuthAPI('admin');
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const status = await qliroService.getTestStatus();
    return NextResponse.json(status);
  } catch (error) {
    console.error('Qliro test status error:', error);
    return NextResponse.json({ passed: false, lastTestDate: null }, { status: 500 });
  }
}
