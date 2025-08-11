import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { packagePurchases, users, packages } from '@/lib/db/schema';
import { and, or, eq, like, gte, lte, desc, sql } from 'drizzle-orm';
import { requireAuthAPI } from '@/lib/auth/server-auth';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthAPI('admin');
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const search = (searchParams.get('search') || '').trim();
    const status = (searchParams.get('status') || '').trim();
    const dateFieldParam = (searchParams.get('dateField') || 'purchase') as 'purchase' | 'paid';
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    // Detect optional columns to support legacy DBs
    let paidAtExists = false;
    let userEmailExists = false;
    try {
      const result: any = await db.execute(sql`SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'package_purchases' AND column_name = 'paid_at' LIMIT 1`);
      const rows = Array.isArray(result) ? result : (result?.rows ?? []);
      paidAtExists = rows.length > 0;
    } catch {
      paidAtExists = false;
    }
    try {
      const result2: any = await db.execute(sql`SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'package_purchases' AND column_name = 'user_email' LIMIT 1`);
      const rows2 = Array.isArray(result2) ? result2 : (result2?.rows ?? []);
      userEmailExists = rows2.length > 0;
    } catch {
      userEmailExists = false;
    }

    const dateField = dateFieldParam === 'paid' && paidAtExists ? packagePurchases.paidAt : packagePurchases.purchaseDate;

    const conditions: any[] = [eq(packagePurchases.paymentMethod, 'qliro')];

    if (status) {
      conditions.push(eq(packagePurchases.paymentStatus, status));
    }

    if (from) {
      const fromDate = new Date(from);
      if (!isNaN(fromDate.getTime())) {
        conditions.push(gte(dateField, fromDate));
      }
    }

    if (to) {
      const toDate = new Date(to);
      if (!isNaN(toDate.getTime())) {
        conditions.push(lte(dateField, toDate));
      }
    }

    if (search) {
      if (userEmailExists) {
        conditions.push(
          or(
            like(packagePurchases.id, `%${search}%`),
            like(packagePurchases.paymentReference, `%${search}%`),
            like(users.email, `%${search}%`),
            like(packagePurchases.userEmail, `%${search}%`)
          )
        );
      } else {
        conditions.push(
          or(
            like(packagePurchases.id, `%${search}%`),
            like(packagePurchases.paymentReference, `%${search}%`),
            like(users.email, `%${search}%`)
          )
        );
      }
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined as any;

    const rows = await db
      .select({
        id: packagePurchases.id,
        userEmail: userEmailExists ? packagePurchases.userEmail : users.email,
        userFirstName: users.firstName,
        userLastName: users.lastName,
        packageName: packages.name,
        pricePaid: packagePurchases.pricePaid,
        status: packagePurchases.paymentStatus,
        purchaseDate: packagePurchases.purchaseDate,
        paidAt: paidAtExists ? packagePurchases.paidAt : sql`NULL`,
        reference: packagePurchases.paymentReference,
      })
      .from(packagePurchases)
      .leftJoin(users, eq(users.id, packagePurchases.userId))
      .leftJoin(packages, eq(packages.id, packagePurchases.packageId))
      .where(whereClause)
      .orderBy(desc(dateField));

    // Build PDF
    const doc = new jsPDF();

    const title = 'Qliro Payments Export';
    doc.setFontSize(16);
    doc.text(title, 14, 16);

    const subtitleParts: string[] = [];
    if (from) subtitleParts.push(`From: ${from}`);
    if (to) subtitleParts.push(`To: ${to}`);
    subtitleParts.push(`Date: ${new Date().toISOString().slice(0, 10)}`);

    doc.setFontSize(10);
    doc.text(subtitleParts.join('    '), 14, 24);

    const body = rows.map((r) => [
      r.purchaseDate ? new Date(r.purchaseDate as unknown as string).toLocaleString('sv-SE') : '-',
      r.paidAt ? new Date(r.paidAt as unknown as string).toLocaleString('sv-SE') : '-',
      r.status || '-',
      r.packageName || '-',
      `${r.userFirstName || ''} ${r.userLastName || ''}`.trim(),
      r.userEmail || '-',
      typeof r.pricePaid === 'string' ? r.pricePaid : (r.pricePaid as unknown as number).toFixed(2),
      r.reference || '-',
      r.id,
    ]);

    autoTable(doc, {
      startY: 30,
      head: [[
        'Purchase Date',
        'Paid At',
        'Status',
        'Package',
        'User',
        'Email',
        'Amount (SEK)',
        'Reference',
        'Purchase ID',
      ]],
      body,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 30 },
        2: { cellWidth: 20 },
        3: { cellWidth: 30 },
        4: { cellWidth: 28 },
        5: { cellWidth: 35 },
        6: { cellWidth: 22 },
        7: { cellWidth: 28 },
        8: { cellWidth: 46 },
      },
      margin: { left: 14, right: 14 },
      tableWidth: 'auto',
      didDrawPage: (data) => {
        // Footer page number
        const pageCount = (doc as any).internal.getNumberOfPages();
        const pageSize = doc.internal.pageSize;
        const pageHeight = pageSize.getHeight();
        doc.setFontSize(8);
        doc.text(`Page ${data.pageNumber} of ${pageCount}`, pageSize.getWidth() - 40, pageHeight - 10);
      },
    });

    const pdfArrayBuffer = doc.output('arraybuffer');
    const pdfBuffer = Buffer.from(pdfArrayBuffer);

    const filename = `qliro-payments-${new Date().toISOString().slice(0, 10)}.pdf`;

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: new Headers({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      }),
    });
  } catch (error) {
    console.error('Error exporting Qliro payments PDF:', error);
    return NextResponse.json({ error: 'Failed to export Qliro payments PDF' }, { status: 500 });
  }
}
