import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAPI } from '@/lib/auth/server-auth';
import { invoicePDFService } from '@/lib/services/invoice-pdf-service';

export const dynamic = 'force-dynamic';

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

    try {
      const pdfBuffer = await invoicePDFService.generateInvoicePDFById(resolvedParams.id);

      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="faktura-${resolvedParams.id}.pdf"`
        }
      });

    } catch (error) {
      console.error('Error generating invoice PDF:', error);
      return NextResponse.json({
        error: 'Kunde inte generera faktura-PDF'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in invoice PDF generation:', error);
    return NextResponse.json({ error: 'Internt serverfel' }, { status: 500 });
  }
}
