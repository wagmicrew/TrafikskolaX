import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAPI } from '@/lib/auth/server-auth';
import { invoiceService } from '@/lib/services/invoice-service';

export const dynamic = 'force-dynamic';

// GET /api/admin/invoices/[id] - Get specific invoice
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await requireAuthAPI('admin');
    if (!authUser) {
      return NextResponse.json({ error: 'Obehörig' }, { status: 401 });
    }

    const resolvedParams = await params;
    const invoice = await invoiceService.getInvoiceById(resolvedParams.id);

    if (!invoice) {
      return NextResponse.json({ error: 'Faktura hittades inte' }, { status: 404 });
    }

    return NextResponse.json({ invoice });
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return NextResponse.json({ error: 'Kunde inte hämta faktura' }, { status: 500 });
  }
}

// PUT /api/admin/invoices/[id] - Update invoice
export async function PUT(
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
    const {
      status,
      paymentMethod,
      swishUuid,
      qliroOrderId,
      paymentReference,
      paidAt,
      notes,
      internalNotes,
      customerName,
      customerEmail,
      customerPhone,
      description,
      dueDate
    } = body;

    const updatedInvoice = await invoiceService.updateInvoice(resolvedParams.id, {
      status,
      paymentMethod,
      swishUuid,
      qliroOrderId,
      paymentReference,
      paidAt: paidAt ? new Date(paidAt) : undefined,
      notes,
      internalNotes,
      customerName,
      customerEmail,
      customerPhone,
      description,
      dueDate: dueDate ? new Date(dueDate) : undefined
    });

    return NextResponse.json({
      message: 'Faktura uppdaterad framgångsrikt',
      invoice: updatedInvoice
    });
  } catch (error) {
    console.error('Error updating invoice:', error);
    return NextResponse.json({ error: 'Kunde inte uppdatera faktura' }, { status: 500 });
  }
}

// DELETE /api/admin/invoices/[id] - Delete invoice (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await requireAuthAPI('admin');
    if (!authUser) {
      return NextResponse.json({ error: 'Obehörig' }, { status: 401 });
    }

    const resolvedParams = await params;

    // For now, we'll just update the status to cancelled
    // In a real implementation, you might want to soft delete
    const updatedInvoice = await invoiceService.updateInvoice(resolvedParams.id, {
      status: 'cancelled'
    });

    return NextResponse.json({
      message: 'Faktura avbruten framgångsrikt',
      invoice: updatedInvoice
    });
  } catch (error) {
    console.error('Error cancelling invoice:', error);
    return NextResponse.json({ error: 'Kunde inte avbryta faktura' }, { status: 500 });
  }
}
