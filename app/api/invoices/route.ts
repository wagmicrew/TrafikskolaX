import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { cookies } from 'next/headers';
import { invoiceService } from '@/lib/services/invoice-service';

export const dynamic = 'force-dynamic';

// GET /api/invoices - Get current user's invoices
export async function GET(request: NextRequest) {
  try {
    // Get user from auth token
    const cookieStore = cookies();
    const token = cookieStore.get('auth-token');

    if (!token) {
      return NextResponse.json({ error: 'Obehörig' }, { status: 401 });
    }

    const payload = await verifyToken(token.value);
    if (!payload || !payload.userId) {
      return NextResponse.json({ error: 'Ogiltig token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;

    const invoices = await invoiceService.getInvoicesByCustomer(payload.userId, status);

    return NextResponse.json({ invoices });
  } catch (error) {
    console.error('Error fetching user invoices:', error);
    return NextResponse.json({ error: 'Kunde inte hämta fakturor' }, { status: 500 });
  }
}
