import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAPI } from '@/lib/auth/server-auth';
import { invoiceService } from '@/lib/services/invoice-service';

export const dynamic = 'force-dynamic';

// POST /api/admin/invoices/[id]/pay - Mark invoice as paid
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await requireAuthAPI('admin');
    if (!authUser) {
      return NextResponse.json({ error: 'Obehörig' }, { status: 401 });
    }

    const resolvedParams = await params;
    const body = await request.json();
    const { paymentMethod, paymentReference } = body;

    const updatedInvoice = await invoiceService.markAsPaid(
      resolvedParams.id,
      paymentMethod,
      paymentReference
    );

    return NextResponse.json({
      message: 'Faktura markerad som betald',
      invoice: updatedInvoice
    });
  } catch (error) {
    console.error('Error marking invoice as paid:', error);
    return NextResponse.json({ error: 'Kunde inte markera faktura som betald' }, { status: 500 });
  }
}
