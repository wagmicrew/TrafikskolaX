import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, bookings, userCredits, userFeedback, internalMessages, teacherAvailability, handledarBookings, packagePurchases, userReports } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { requireAuthAPI } from '@/lib/auth/server-auth';
import { generateUserDataPdf } from '@/utils/pdfExport';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authUser = await requireAuthAPI('admin');
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Get user data
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!user.length) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get all user-related data
    const [userBookings, userCreditsData, userFeedbackData, userHandledarBookings] = await Promise.all([
      db.select().from(bookings).where(eq(bookings.userId, id)),
      db.select().from(userCredits).where(eq(userCredits.userId, id)),
      db.select().from(userFeedback).where(eq(userFeedback.userId, id)),
      db.select().from(handledarBookings).where(eq(handledarBookings.studentId, id))
    ]);

    // Prepare PDF data
    const pdfData = {
      user: user[0],
      bookings: userBookings,
      credits: userCreditsData,
      feedback: userFeedbackData,
      handledarBookings: userHandledarBookings,
    };

    // Generate PDF buffer
    const { jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;
    const { format } = await import('date-fns');
    const { sv } = await import('date-fns/locale');

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    let yPos = 20;

    // Add title
    doc.setFontSize(20);
    doc.setTextColor(41, 128, 185);
    doc.text('Användardata Export', margin, yPos);
    yPos += 15;

    // User information section
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('Användarinformation', margin, yPos);
    yPos += 10;

    const userInfo = [
      ['Namn', `${user[0].firstName} ${user[0].lastName}`],
      ['Email', user[0].email],
      ['Telefon', user[0].phone || 'Ej angivet'],
      ['Roll', user[0].role === 'admin' ? 'Admin' : user[0].role === 'teacher' ? 'Lärare' : 'Student'],
      ['Status', user[0].isActive ? 'Aktiv' : 'Inaktiv'],
      ['Inskriven', user[0].inskriven ? 'Ja' : 'Nej'],
      ['Personnummer', user[0].personalNumber || 'Ej angivet'],
      ['Adress', user[0].address || 'Ej angivet'],
      ['Postnummer', user[0].postalCode || 'Ej angivet'],
      ['Stad', user[0].city || 'Ej angivet'],
      ['Skapad', format(new Date(user[0].createdAt), 'dd/MM/yyyy HH:mm', { locale: sv })],
    ];

    autoTable(doc, {
      startY: yPos,
      head: [['Fält', 'Värde']],
      body: userInfo,
      margin: { left: margin, right: margin },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 10
      },
      bodyStyles: {
        fontSize: 9,
        cellPadding: 4
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      styles: {
        lineColor: [200, 200, 200],
        lineWidth: 0.1
      },
      didDrawPage: (data: any) => {
        yPos = data.cursor.y + 15;
      }
    });

    // Bookings section
    if (userBookings.length > 0) {
      doc.setFontSize(16);
      doc.text('Bokningar', margin, yPos);
      yPos += 10;

      const bookingsData = userBookings.map(booking => [
        booking.scheduledDate ? format(new Date(booking.scheduledDate), 'dd/MM/yyyy', { locale: sv }) : 'Ej angivet',
        booking.startTime || 'Ej angivet',
        booking.endTime || 'Ej angivet',
        booking.status || 'Ej angivet',
        booking.paymentStatus || 'Ej angivet',
        booking.totalPrice ? `${booking.totalPrice} kr` : 'Ej angivet'
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['Datum', 'Start', 'Slut', 'Status', 'Betalning', 'Pris']],
        body: bookingsData,
        margin: { left: margin, right: margin },
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 9
        },
        bodyStyles: {
          fontSize: 8,
          cellPadding: 3
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        styles: {
          lineColor: [200, 200, 200],
          lineWidth: 0.1
        },
        didDrawPage: (data: any) => {
          yPos = data.cursor.y + 15;
        }
      });
    }

    // Credits section
    if (userCreditsData.length > 0) {
      doc.setFontSize(16);
      doc.text('Krediter', margin, yPos);
      yPos += 10;

      const creditsData = userCreditsData.map(credit => [
        credit.creditType,
        credit.creditsRemaining.toString(),
        credit.creditsTotal.toString(),
        format(new Date(credit.createdAt), 'dd/MM/yyyy', { locale: sv })
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['Typ', 'Kvar', 'Totalt', 'Skapat']],
        body: creditsData,
        margin: { left: margin, right: margin },
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 9
        },
        bodyStyles: {
          fontSize: 8,
          cellPadding: 3
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        styles: {
          lineColor: [200, 200, 200],
          lineWidth: 0.1
        },
        didDrawPage: (data: any) => {
          yPos = data.cursor.y + 15;
        }
      });
    }

    // Feedback section
    if (userFeedbackData.length > 0) {
      doc.setFontSize(16);
      doc.text('Feedback', margin, yPos);
      yPos += 10;

      const feedbackData = userFeedbackData.map(feedback => [
        feedback.stepIdentifier || 'Generell',
        feedback.rating ? feedback.rating.toString() : 'Ej angivet',
        feedback.valuation ? feedback.valuation.toString() : 'Ej angivet',
        format(new Date(feedback.createdAt), 'dd/MM/yyyy', { locale: sv }),
        feedback.feedbackText ? feedback.feedbackText.substring(0, 50) + '...' : 'Ingen text'
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['Steg', 'Betyg', 'Värdering', 'Datum', 'Kommentar']],
        body: feedbackData,
        margin: { left: margin, right: margin },
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 9
        },
        bodyStyles: {
          fontSize: 8,
          cellPadding: 3
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        styles: {
          lineColor: [200, 200, 200],
          lineWidth: 0.1
        },
        didDrawPage: (data: any) => {
          yPos = data.cursor.y + 15;
        }
      });
    }

    // Handledar bookings section
    if (userHandledarBookings.length > 0) {
      doc.setFontSize(16);
      doc.text('Handledarutbildningar', margin, yPos);
      yPos += 10;

      const handledarData = userHandledarBookings.map(booking => [
        booking.scheduledDate ? format(new Date(booking.scheduledDate), 'dd/MM/yyyy', { locale: sv }) : 'Ej angivet',
        booking.startTime || 'Ej angivet',
        booking.endTime || 'Ej angivet',
        booking.status || 'Ej angivet',
        booking.paymentStatus || 'Ej angivet',
        booking.totalPrice ? `${booking.totalPrice} kr` : 'Ej angivet'
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['Datum', 'Start', 'Slut', 'Status', 'Betalning', 'Pris']],
        body: handledarData,
        margin: { left: margin, right: margin },
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 9
        },
        bodyStyles: {
          fontSize: 8,
          cellPadding: 3
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        styles: {
          lineColor: [200, 200, 200],
          lineWidth: 0.1
        },
        didDrawPage: (data: any) => {
          yPos = data.cursor.y + 15;
        }
      });
    }

    // Summary section
    doc.setFontSize(16);
    doc.text('Sammanfattning', margin, yPos);
    yPos += 10;

    const summaryData = [
      ['Totalt antal bokningar', userBookings.length.toString()],
      ['Totalt antal krediter', userCredits.length.toString()],
      ['Totalt antal feedback', userFeedbackData.length.toString()],
      ['Totalt antal handledarutbildningar', userHandledarBookings.length.toString()],
      ['Export datum', format(new Date(), 'dd/MM/yyyy HH:mm', { locale: sv })]
    ];

    autoTable(doc, {
      startY: yPos,
      head: [['Kategori', 'Antal']],
      body: summaryData,
      margin: { left: margin, right: margin },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 10
      },
      bodyStyles: {
        fontSize: 9,
        cellPadding: 4
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      styles: {
        lineColor: [200, 200, 200],
        lineWidth: 0.1
      }
    });

    // Generate filename
    const fileName = `${user[0].firstName}_${user[0].lastName}_${user[0].id}_export`;

    // Get PDF buffer
    const pdfBuffer = doc.output('arraybuffer');

    // Set headers for PDF download
    const headers = new Headers();
    headers.set('Content-Type', 'application/pdf');
    headers.set('Content-Disposition', `attachment; filename="${fileName}.pdf"`);

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers
    });

  } catch (error) {
    console.error('Error generating user export:', error);
    return NextResponse.json({ error: 'Failed to generate user export' }, { status: 500 });
  }
}

