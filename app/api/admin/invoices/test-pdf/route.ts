import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAPI } from '@/lib/auth/server-auth';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: {
      finalY: number;
    };
  }
}

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const authUser = await requireAuthAPI('admin');
    if (!authUser) {
      return NextResponse.json({ error: 'Obehörig' }, { status: 401 });
    }

    const body = await request.json();
    const {
      companyName = 'Din Trafikskola Hässleholm',
      companyAddress = 'Storgatan 1, 281 31 Hässleholm',
      companyPhone = '040-123 45 67',
      companyEmail = 'info@dintrafikskolahlm.se'
    } = body;

    // Create PDF document
    const doc = new jsPDF();

    // Colors
    const primaryColor = [59, 130, 246]; // Blue
    const secondaryColor = [107, 114, 128]; // Gray
    const accentColor = [34, 197, 94]; // Green

    // Header
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 40, 'F');

    // Company info
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text(companyName, 20, 25);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(companyAddress, 20, 32);
    doc.text(`${companyPhone} | ${companyEmail}`, 20, 38);

    // Invoice title
    doc.setFillColor(249, 250, 251);
    doc.rect(0, 50, 210, 20, 'F');

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('FAKTURA', 20, 62);

    // Invoice details
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Fakturanummer: INV-202508-1000`, 130, 62);
    doc.text(`Datum: ${new Date().toLocaleDateString('sv-SE')}`, 130, 68);
    doc.text(`Förfallodatum: ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('sv-SE')}`, 130, 74);

    // Customer info
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Faktureras till:', 20, 90);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Test Kund', 20, 98);
    doc.text('Testgatan 123', 20, 104);
    doc.text('281 31 Hässleholm', 20, 110);
    doc.text('test@example.com', 20, 116);

    // Invoice items table
    const tableData = [
      ['Beskrivning', 'Antal', 'Enhetspris', 'Total'],
      ['Körlektion - Manuell', '1', '650,00', '650,00'],
      ['Körlektion - Automat', '2', '700,00', '1 400,00'],
      ['Teorilektion - Grundkurs', '3', '300,00', '900,00']
    ];

    // Add table
    doc.autoTable({
      startY: 130,
      head: [tableData[0]],
      body: tableData.slice(1),
      theme: 'striped',
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 10,
        cellPadding: 8
      },
      columnStyles: {
        0: { fontStyle: 'bold' },
        3: { fontStyle: 'bold', halign: 'right' }
      },
      margin: { left: 20, right: 20 }
    });

    // Total
    const finalY = doc.lastAutoTable.finalY + 20;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Total att betala:', 130, finalY);
    doc.text('SEK 2 950,00', 170, finalY);

    // Payment information
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Betalningsinformation:', 20, finalY + 20);

    doc.setFontSize(10);
    doc.text('• Betala till bankgiro: 123-4567', 20, finalY + 30);
    doc.text('• Ange fakturanummer som referens', 20, finalY + 36);
    doc.text('• Förfallodatum: ' + new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('sv-SE'), 20, finalY + 42);

    // Swish QR code placeholder
    doc.setFillColor(200, 200, 200);
    doc.rect(130, finalY + 20, 40, 40, 'F');
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(8);
    doc.text('Swish QR-kod', 140, finalY + 40);

    // Footer
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`Sida 1 av 1 | Genererad ${new Date().toLocaleString('sv-SE')}`, 20, pageHeight - 20);
    doc.text(`${companyName} | ${companyAddress} | ${companyEmail}`, 20, pageHeight - 10);

    // Convert to buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="test-faktura.pdf"'
      }
    });

  } catch (error) {
    console.error('Error generating test PDF:', error);
    return NextResponse.json({ error: 'Kunde inte generera test-PDF' }, { status: 500 });
  }
}
