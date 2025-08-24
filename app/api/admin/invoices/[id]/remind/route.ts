import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAPI } from '@/lib/auth/server-auth';
import { invoiceService } from '@/lib/services/invoice-service';

export const dynamic = 'force-dynamic';

// POST /api/admin/invoices/[id]/remind - Send reminder for invoice
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
    const invoice = await invoiceService.sendReminder(resolvedParams.id);

    return NextResponse.json({
      message: 'Påminnelse skickad',
      invoice
    });
  } catch (error) {
    console.error('Error sending reminder:', error);
    return NextResponse.json({ error: 'Kunde inte skicka påminnelse' }, { status: 500 });
  }
}
