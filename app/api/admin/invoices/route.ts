import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAPI } from '@/lib/auth/server-auth';
import { invoiceService } from '@/lib/services/invoice-service';

export const dynamic = 'force-dynamic';

// GET /api/admin/invoices - List all invoices with filtering
export async function GET(request: NextRequest) {
  try {
    const authUser = await requireAuthAPI('admin');
    if (!authUser) {
      return NextResponse.json({ error: 'Obehörig' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filters = {
      status: searchParams.get('status') || undefined,
      type: searchParams.get('type') || undefined,
      customerId: searchParams.get('customerId') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
    };

    const invoices = await invoiceService.getAllInvoices(filters);

    // Get stats
    const stats = await invoiceService.getInvoiceStats();

    return NextResponse.json({
      invoices,
      stats,
      pagination: {
        limit: filters.limit,
        offset: filters.offset,
        hasMore: invoices.length === filters.limit
      }
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json({ error: 'Kunde inte hämta fakturor' }, { status: 500 });
  }
}

// POST /api/admin/invoices - Create new invoice
export async function POST(request: NextRequest) {
  try {
    const authUser = await requireAuthAPI('admin');
    if (!authUser) {
      return NextResponse.json({ error: 'Obehörig' }, { status: 401 });
    }

    const body = await request.json();
    const {
      type,
      customerId,
      customerEmail,
      customerName,
      customerPhone,
      description,
      amount,
      paymentMethod,
      bookingId,
      sessionId,
      handledarBookingId,
      packageId,
      dueDate,
      notes,
      items
    } = body;

    const invoice = await invoiceService.createInvoice({
      type,
      customerId,
      customerEmail,
      customerName,
      customerPhone,
      description,
      amount: parseFloat(amount),
      paymentMethod,
      bookingId,
      sessionId,
      handledarBookingId,
      packageId,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      notes,
      items
    });

    return NextResponse.json({
      message: 'Faktura skapad framgångsrikt',
      invoice
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating invoice:', error);
    return NextResponse.json({ error: 'Kunde inte skapa faktura' }, { status: 500 });
  }
}
