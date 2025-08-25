import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { cookies } from 'next/headers';
import { invoiceService } from '@/lib/services/invoice-service';

export const dynamic = 'force-dynamic';

// GET /api/invoices/[id] - Get specific invoice for current user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const resolvedParams = await params;
    const invoice = await invoiceService.getInvoiceById(resolvedParams.id);

    if (!invoice) {
      return NextResponse.json({ error: 'Faktura hittades inte' }, { status: 404 });
    }

    // Check if the invoice belongs to the current user
    if (invoice.customer_id !== payload.userId) {
      return NextResponse.json({ error: 'Åtkomst nekad' }, { status: 403 });
    }

    return NextResponse.json({ invoice });
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return NextResponse.json({ error: 'Kunde inte hämta faktura' }, { status: 500 });
  }
}
