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

// Helper function to fetch school name from database
const getSchoolName = async () => {
  try {
    const response = await fetch(`${getBaseUrl()}/api/admin/settings`);
    if (response.ok) {
      const data = await response.json();
      return data.settings?.schoolname || 'Din Trafikskola Hässleholm';
    }
  } catch (error) {
    console.error('Failed to fetch school name:', error);
  }
  return 'Din Trafikskola Hässleholm';
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

export const generateWeeklySchedulePdf = async (bookings: Booking[], title: string = 'Veckoschema') => {
  // Create a new PDF document
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let yPos = 20;

  // Get school name
  const schoolName = await getSchoolName();

  // Add school header
  doc.setFontSize(16);
  doc.setTextColor(41, 128, 185); // School blue color
  doc.text(schoolName, margin, yPos);
  yPos += 8;

  // Add title
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
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

  // Group bookings by date and filter out empty days
  const bookingsByDate: { [key: string]: Booking[] } = {};
  
  // Add bookings to their respective days
  bookings.forEach(booking => {
    const bookingDate = booking.scheduledDate.split('T')[0];
    if (!bookingsByDate[bookingDate]) {
      bookingsByDate[bookingDate] = [];
    }
    bookingsByDate[bookingDate].push(booking);
  });

  // Sort bookings within each day by start time
  Object.values(bookingsByDate).forEach(dayBookings => {
    dayBookings.sort((a, b) => a.startTime.localeCompare(b.startTime));
  });

  // Get sorted dates that have bookings
  const datesWithBookings = Object.keys(bookingsByDate)
    .filter(date => bookingsByDate[date].length > 0)
    .sort();

  if (datesWithBookings.length === 0) {
    // No bookings found
    doc.setFontSize(12);
    doc.setTextColor(128, 128, 128);
    doc.text('Inga bokningar hittades för denna vecka', margin, yPos);
    doc.save(`schema-${format(today, 'yyyy-MM-dd')}.pdf`);
    return;
  }

  // Create a section for each day with bookings
  datesWithBookings.forEach((dateKey, index) => {
    const dayBookings = bookingsByDate[dateKey];
    const dayDate = parseISO(dateKey);
    
    // Add page break if not enough space (except for first day)
    if (index > 0 && yPos > 200) {
      doc.addPage();
      yPos = 20;
    } else if (index > 0) {
      yPos += 15; // Add some space between days
    }
    
    // Day header with background
    doc.setFontSize(14);
    doc.setFillColor(41, 128, 185); // School blue
    doc.rect(margin, yPos, pageWidth - 2 * margin, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.text(
      format(dayDate, 'EEEE d MMMM yyyy', { locale: sv }),
      margin + 5,
      yPos + 7
    );
    yPos += 15;

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
        yPos = data.cursor.y + 10;
      }
    });
  });

  // Add footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Sida ${i} av ${pageCount} | Genererat: ${format(new Date(), 'yyyy-MM-dd HH:mm', { locale: sv })}`,
      margin,
      doc.internal.pageSize.getHeight() - 10
    );
  }

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
      throw new Error('Kunde inte hämta veckans bokningar');
    }
    const data = await response.json();
    return data.bookings || [];
  } catch (error) {
    console.error('Fel vid hämtning av veckans bokningar:', error);
    return [];
  }
};

// Generate daily schedule PDF with improved design
export const generateDailySchedulePdf = async (bookings: Booking[], date: string = new Date().toISOString().split('T')[0]) => {
  // Create a new PDF document
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let yPos = 20;

  // Get school name
  const schoolName = await getSchoolName();

  // Add school header
  doc.setFontSize(16);
  doc.setTextColor(41, 128, 185); // School blue color
  doc.text(schoolName, margin, yPos);
  yPos += 8;

  // Add title
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('Dagens Schema', margin, yPos);
  yPos += 10;

  // Add date
  doc.setFontSize(10);
  const formattedDate = format(parseISO(date), 'EEEE d MMMM yyyy', { locale: sv });
  doc.text(`Datum: ${formattedDate}`, margin, yPos);
  yPos += 15;

  if (bookings.length === 0) {
    // No bookings found
    doc.setFontSize(12);
    doc.setTextColor(128, 128, 128);
    doc.text('Inga bokningar hittades för denna dag', margin, yPos);
    doc.save(`schema-${date}.pdf`);
    return;
  }

  // Sort bookings by start time
  const sortedBookings = bookings.sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Prepare table data
  const tableData = sortedBookings.map(booking => [
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

  // Add footer
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text(
    `Genererat: ${format(new Date(), 'yyyy-MM-dd HH:mm', { locale: sv })}`,
    margin,
    doc.internal.pageSize.getHeight() - 10
  );

  // Save the PDF
  doc.save(`schema-${date}.pdf`);
};

// Generate future schedule PDF with improved design
export const generateFutureSchedulePdf = async (bookings: Booking[], title: string = 'Kommande Schema') => {
  // Create a new PDF document
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let yPos = 20;

  // Get school name
  const schoolName = await getSchoolName();

  // Add school header
  doc.setFontSize(16);
  doc.setTextColor(41, 128, 185); // School blue color
  doc.text(schoolName, margin, yPos);
  yPos += 8;

  // Add title
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text(title, margin, yPos);
  yPos += 10;

  // Add date range
  doc.setFontSize(10);
  const today = new Date();
  const dateRange = `Från: ${format(today, 'd MMM yyyy', { locale: sv })}`;
  doc.text(dateRange, margin, yPos);
  yPos += 15;

  // Group bookings by date and filter out empty days
  const bookingsByDate: { [key: string]: Booking[] } = {};
  
  // Add bookings to their respective days
  bookings.forEach(booking => {
    const bookingDate = booking.scheduledDate.split('T')[0];
    if (!bookingsByDate[bookingDate]) {
      bookingsByDate[bookingDate] = [];
    }
    bookingsByDate[bookingDate].push(booking);
  });

  // Sort bookings within each day by start time
  Object.values(bookingsByDate).forEach(dayBookings => {
    dayBookings.sort((a, b) => a.startTime.localeCompare(b.startTime));
  });

  // Get sorted dates that have bookings
  const datesWithBookings = Object.keys(bookingsByDate)
    .filter(date => bookingsByDate[date].length > 0)
    .sort();

  if (datesWithBookings.length === 0) {
    // No bookings found
    doc.setFontSize(12);
    doc.setTextColor(128, 128, 128);
    doc.text('Inga kommande bokningar hittades', margin, yPos);
    doc.save(`kommande-schema-${format(today, 'yyyy-MM-dd')}.pdf`);
    return;
  }

  // Create a section for each day with bookings
  datesWithBookings.forEach((dateKey, index) => {
    const dayBookings = bookingsByDate[dateKey];
    const dayDate = parseISO(dateKey);
    
    // Add page break if not enough space (except for first day)
    if (index > 0 && yPos > 200) {
      doc.addPage();
      yPos = 20;
    } else if (index > 0) {
      yPos += 15; // Add some space between days
    }
    
    // Day header with background
    doc.setFontSize(14);
    doc.setFillColor(41, 128, 185); // School blue
    doc.rect(margin, yPos, pageWidth - 2 * margin, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.text(
      format(dayDate, 'EEEE d MMMM yyyy', { locale: sv }),
      margin + 5,
      yPos + 7
    );
    yPos += 15;

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
        yPos = data.cursor.y + 10;
      }
    });
  });

  // Add footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Sida ${i} av ${pageCount} | Genererat: ${format(new Date(), 'yyyy-MM-dd HH:mm', { locale: sv })}`,
      margin,
      doc.internal.pageSize.getHeight() - 10
    );
  }

  // Save the PDF
  doc.save(`kommande-schema-${format(today, 'yyyy-MM-dd')}.pdf`);
};
