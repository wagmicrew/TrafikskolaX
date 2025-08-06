import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, parseISO, startOfWeek, endOfWeek, eachDayOfInterval, isWithinInterval } from 'date-fns';
import { sv } from 'date-fns/locale';

interface Booking {
  id: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  userName: string;
  userPhone?: string;
  transmissionType: string;
  lessonTypeName: string;
}

interface UserData {
  user: any;
  bookings: any[];
  credits: any[];
  feedback: any[];
  handledarBookings: any[];
};

// Helper function to get the base URL for API calls
const getBaseUrl = () => {
  // Check if we're in a browser environment
  if (typeof window !== 'undefined') {
    return '';
  }
  
  // Server-side environment - use environment variable or default
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                  process.env.VERCEL_URL || 
                  'http://localhost:3000';
  
  return baseUrl;
};

// Helper function to fetch all future bookings
export const fetchAllFutureBookings = async (userId?: string, role: 'admin' | 'teacher' = 'teacher', authToken?: string) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    let url = `${getBaseUrl()}/api/${role}/bookings`;
    const params = new URLSearchParams();
    
    if (role === 'teacher') {
      if (userId) {
        params.append('teacherId', userId);
      }
      params.append('upcoming', 'true');
    } else if (role === 'admin') {
      if (userId) {
        params.append('userId', userId);
      }
      params.append('startDate', today);
      params.append('endDate', '2099-12-31'); // Far future date
    }

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const headers: HeadersInit = {};
    if (authToken) {
      headers['Cookie'] = `auth-token=${authToken}`;
    }

    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error('Kunde inte hämta kommande bokningar');
    }
    const data = await response.json();
    return data.bookings || [];
  } catch (error) {
    console.error('Fel vid hämtning av kommande bokningar:', error);
    return [];
  }
};

export const generateWeeklySchedulePdf = (bookings: Booking[], title: string = 'Veckoschema') => {
  // Create a new PDF document
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let yPos = 20;

  // Add title
  doc.setFontSize(18);
  doc.text(title, margin, yPos);
  yPos += 10;

  // Add date range
  doc.setFontSize(10);
  const today = new Date();
  const weekStart = startOfWeek(today, { locale: sv });
  const weekEnd = endOfWeek(today, { locale: sv });
  const dateRange = `${format(weekStart, 'd MMM yyyy', { locale: sv })} - ${format(weekEnd, 'd MMM yyyy', { locale: sv })}`;
  doc.text(`Vecka: ${dateRange}`, margin, yPos);
  yPos += 15;

  // Group bookings by date
  const bookingsByDate: { [key: string]: Booking[] } = {};
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
  
  // Initialize empty arrays for each day
  weekDays.forEach(day => {
    const dateKey = format(day, 'yyyy-MM-dd');
    bookingsByDate[dateKey] = [];
  });

  // Add bookings to their respective days
  bookings.forEach(booking => {
    const bookingDate = booking.scheduledDate.split('T')[0];
    if (bookingsByDate[bookingDate]) {
      bookingsByDate[bookingDate].push(booking);
    }
  });

  // Sort bookings within each day by start time
  Object.values(bookingsByDate).forEach(dayBookings => {
    dayBookings.sort((a, b) => a.startTime.localeCompare(b.startTime));
  });

  // Create a table for each day
  weekDays.forEach((day, index) => {
    const dateKey = format(day, 'yyyy-MM-dd');
    const dayBookings = bookingsByDate[dateKey] || [];
    
    // Add day header
    if (index > 0) {
      // Add new page if not enough space
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      } else {
        yPos += 10;
      }
    }
    
    // Day header
    doc.setFontSize(14);
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');
    doc.setTextColor(0, 0, 0);
    doc.text(
      format(day, 'EEEE d MMMM yyyy', { locale: sv }),
      margin + 5,
      yPos + 6
    );
    yPos += 12;

    if (dayBookings.length === 0) {
      doc.setFontSize(10);
      doc.text('Inga lektioner inbokade', margin + 5, yPos);
      yPos += 8;
      return;
    }

    // Prepare table data
    const tableData = dayBookings.map(booking => [
      booking.startTime + ' - ' + booking.endTime,
      booking.userName,
      booking.userPhone || 'Ingen telefon',
      booking.lessonTypeName,
      booking.transmissionType || 'Ej angivet'
    ]);

    // Add table
    autoTable(doc, {
      startY: yPos,
      head: [['Tid', 'Elev', 'Telefon', 'Lektionstyp', 'Växellåda']],
      body: tableData,
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
        yPos = data.cursor.y + 10;
      }
    });
  });

  // Save the PDF
  doc.save(`schema-${format(today, 'yyyy-MM-dd')}.pdf`);
};

// Generate comprehensive user data PDF export
export const generateUserDataPdf = async (userData: UserData, fileName: string) => {
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

  const user = userData.user;
  const userInfo = [
    ['Namn', `${user.firstName} ${user.lastName}`],
    ['Email', user.email],
    ['Telefon', user.phone || 'Ej angivet'],
    ['Roll', user.role === 'admin' ? 'Admin' : user.role === 'teacher' ? 'Lärare' : 'Student'],
    ['Status', user.isActive ? 'Aktiv' : 'Inaktiv'],
    ['Inskriven', user.inskriven ? 'Ja' : 'Nej'],
    ['Personnummer', user.personalNumber || 'Ej angivet'],
    ['Adress', user.address || 'Ej angivet'],
    ['Postnummer', user.postalCode || 'Ej angivet'],
    ['Stad', user.city || 'Ej angivet'],
    ['Skapad', format(new Date(user.createdAt), 'dd/MM/yyyy HH:mm', { locale: sv })],
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
  if (userData.bookings.length > 0) {
    doc.setFontSize(16);
    doc.text('Bokningar', margin, yPos);
    yPos += 10;

    const bookingsData = userData.bookings.map(booking => [
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
  if (userData.credits.length > 0) {
    doc.setFontSize(16);
    doc.text('Krediter', margin, yPos);
    yPos += 10;

    const creditsData = userData.credits.map(credit => [
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
  if (userData.feedback.length > 0) {
    doc.setFontSize(16);
    doc.text('Feedback', margin, yPos);
    yPos += 10;

    const feedbackData = userData.feedback.map(feedback => [
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
  if (userData.handledarBookings.length > 0) {
    doc.setFontSize(16);
    doc.text('Handledarutbildningar', margin, yPos);
    yPos += 10;

    const handledarData = userData.handledarBookings.map(booking => [
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
    ['Totalt antal bokningar', userData.bookings.length.toString()],
    ['Totalt antal krediter', userData.credits.length.toString()],
    ['Totalt antal feedback', userData.feedback.length.toString()],
    ['Totalt antal handledarutbildningar', userData.handledarBookings.length.toString()],
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

  // Save the PDF
  doc.save(`${fileName}.pdf`);
};

// Helper function to fetch bookings for today
export const fetchDailyBookings = async (userId?: string, role: 'admin' | 'teacher' = 'teacher', authToken?: string) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    let url = `${getBaseUrl()}/api/${role}/bookings`;
    const params = new URLSearchParams();
    
    if (role === 'teacher') {
      if (userId) {
        params.append('teacherId', userId);
      }
      params.append('date', today);
    } else if (role === 'admin') {
      if (userId) {
        params.append('userId', userId);
      }
      params.append('startDate', today);
      params.append('endDate', today);
    }

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const headers: HeadersInit = {};
    if (authToken) {
      headers['Cookie'] = `auth-token=${authToken}`;
    }

    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error('Kunde inte hämta dagens bokningar');
    }
    const data = await response.json();
    return data.bookings || [];
  } catch (error) {
    console.error('Fel vid hämtning av dagens bokningar:', error);
    return [];
  }
};

// Helper function to fetch bookings for the current week
export const fetchWeeklyBookings = async (userId?: string, role: 'admin' | 'teacher' = 'teacher', authToken?: string) => {
  try {
    const today = new Date();
    const weekStart = startOfWeek(today, { locale: sv });
    const weekEnd = endOfWeek(today, { locale: sv });
    
    const startDate = format(weekStart, 'yyyy-MM-dd');
    const endDate = format(weekEnd, 'yyyy-MM-dd');
    
    let url = `${getBaseUrl()}/api/${role}/bookings`;
    const params = new URLSearchParams();
    
    if (role === 'teacher') {
      if (userId) {
        params.append('teacherId', userId);
      }
      // For teachers, we need to fetch each day separately or modify the API
      // For now, let's use the date range approach
      params.append('startDate', startDate);
      params.append('endDate', endDate);
    } else if (role === 'admin') {
      if (userId) {
        params.append('userId', userId);
      }
      params.append('startDate', startDate);
      params.append('endDate', endDate);
    }

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const headers: HeadersInit = {};
    if (authToken) {
      headers['Cookie'] = `auth-token=${authToken}`;
    }

    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error('Kunde inte hämta bokningar');
    }
    const data = await response.json();
    return data.bookings || [];
  } catch (error) {
    console.error('Fel vid hämtning av veckans bokningar:', error);
    return [];
  }
};
