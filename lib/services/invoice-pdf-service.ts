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
import { invoiceService } from './invoice-service';

export interface CompanyInfo {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  orgNumber?: string;
  bankDetails?: string;
}

export interface InvoiceData {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerEmail: string;
  customerAddress?: string;
  customerPhone?: string;
  items: InvoiceItem[];
  total: number;
  currency: string;
  issuedDate: Date;
  dueDate?: Date;
  status: string;
  notes?: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export class InvoicePDFService {
  private companyInfo: CompanyInfo;

  constructor(companyInfo: CompanyInfo) {
    this.companyInfo = companyInfo;
  }

  async generateInvoicePDF(invoiceData: InvoiceData): Promise<Buffer> {
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
    doc.text(this.companyInfo.name, 20, 25);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    if (this.companyInfo.address) {
      doc.text(this.companyInfo.address, 20, 32);
    }

    const contactInfo = [];
    if (this.companyInfo.phone) contactInfo.push(this.companyInfo.phone);
    if (this.companyInfo.email) contactInfo.push(this.companyInfo.email);
    if (contactInfo.length > 0) {
      doc.text(contactInfo.join(' | '), 20, 38);
    }

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
    doc.text(`Fakturanummer: ${invoiceData.invoiceNumber}`, 130, 62);
    doc.text(`Datum: ${invoiceData.issuedDate.toLocaleDateString('sv-SE')}`, 130, 68);
    if (invoiceData.dueDate) {
      doc.text(`Förfallodatum: ${invoiceData.dueDate.toLocaleDateString('sv-SE')}`, 130, 74);
    }

    // Customer info
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Faktureras till:', 20, 90);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(invoiceData.customerName, 20, 98);
    if (invoiceData.customerAddress) {
      doc.text(invoiceData.customerAddress, 20, 104);
    }
    doc.text(invoiceData.customerEmail, 20, 110);
    if (invoiceData.customerPhone) {
      doc.text(invoiceData.customerPhone, 20, 116);
    }

    // Invoice items table
    const tableData = [
      ['Beskrivning', 'Antal', 'Enhetspris', 'Total'],
      ...invoiceData.items.map(item => [
        item.description,
        item.quantity.toString(),
        this.formatCurrency(item.unitPrice, invoiceData.currency),
        this.formatCurrency(item.totalPrice, invoiceData.currency)
      ])
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
    doc.text(this.formatCurrency(invoiceData.total, invoiceData.currency), 170, finalY);

    // Payment information
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Betalningsinformation:', 20, finalY + 20);

    doc.setFontSize(10);
    if (this.companyInfo.bankDetails) {
      doc.text(`• ${this.companyInfo.bankDetails}`, 20, finalY + 30);
    } else {
      doc.text('• Betala till bankgiro: Ange i inställningar', 20, finalY + 30);
    }

    doc.text(`• Ange fakturanummer ${invoiceData.invoiceNumber} som referens`, 20, finalY + 36);

    if (invoiceData.dueDate) {
      doc.text(`• Förfallodatum: ${invoiceData.dueDate.toLocaleDateString('sv-SE')}`, 20, finalY + 42);
    }

    // Payment methods
    doc.text('Betalningsalternativ:', 20, finalY + 52);
    doc.text('• Swish till angivet nummer', 20, finalY + 58);
    doc.text('• Qliro Checkout', 20, finalY + 64);
    doc.text('• Bankgiro', 20, finalY + 70);

    // Notes
    if (invoiceData.notes) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      const splitNotes = doc.splitTextToSize(`Noteringar: ${invoiceData.notes}`, 170);
      doc.text(splitNotes, 20, finalY + 80);
    }

    // Footer
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`Sida 1 av 1 | Genererad ${new Date().toLocaleString('sv-SE')}`, 20, pageHeight - 20);

    const footerInfo = [];
    if (this.companyInfo.orgNumber) {
      footerInfo.push(`Org.nr: ${this.companyInfo.orgNumber}`);
    }
    footerInfo.push(this.companyInfo.name);
    if (this.companyInfo.email) {
      footerInfo.push(this.companyInfo.email);
    }

    doc.text(footerInfo.join(' | '), 20, pageHeight - 10);

    // Convert to buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

    return pdfBuffer;
  }

  async generateInvoicePDFById(invoiceId: string): Promise<Buffer> {
    try {
      const invoice = await invoiceService.getInvoiceById(invoiceId);
      if (!invoice) {
        throw new Error('Invoice not found');
      }

      const invoiceData: InvoiceData = {
        id: invoice.id,
        invoiceNumber: invoice.invoice_number,
        customerName: invoice.customer_name || 'Okänd kund',
        customerEmail: invoice.customer_email || '',
        customerAddress: '',
        customerPhone: '',
        items: invoice.items || [],
        total: parseFloat(invoice.amount),
        currency: invoice.currency,
        issuedDate: new Date(invoice.issued_at),
        dueDate: invoice.due_date ? new Date(invoice.due_date) : undefined,
        status: invoice.status,
        notes: invoice.notes
      };

      return this.generateInvoicePDF(invoiceData);
    } catch (error) {
      console.error('Error generating PDF for invoice:', error);
      throw error;
    }
  }

  private formatCurrency(amount: number, currency: string = 'SEK'): string {
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }
}

export const invoicePDFService = new InvoicePDFService({
  name: 'Din Trafikskola Hässleholm',
  address: 'Storgatan 1, 281 31 Hässleholm',
  phone: '040-123 45 67',
  email: 'info@dintrafikskolahlm.se',
  orgNumber: '123456-7890',
  bankDetails: 'Bankgiro: 123-4567'
});
