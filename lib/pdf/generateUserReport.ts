import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { format } from 'date-fns'
import { sv } from 'date-fns/locale'

export interface UserData {
  user: any
  bookings: any[]
  credits: any[]
  feedback: any[]
  handledarBookings: any[]
}

// Generate user data PDF and return as Buffer (for server-side saving)
export async function generateUserReportBuffer(userData: UserData, fileBaseName: string): Promise<Buffer> {
  const doc = new jsPDF()
  const margin = 15
  let yPos = 20

  // Title
  doc.setFontSize(20)
  doc.setTextColor(41, 128, 185)
  doc.text('Användardata Export', margin, yPos)
  yPos += 15

  // User information section
  doc.setFontSize(16)
  doc.setTextColor(0, 0, 0)
  doc.text('Användarinformation', margin, yPos)
  yPos += 10

  const user = userData.user
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
  ]

  autoTable(doc, {
    startY: yPos,
    head: [['Fält', 'Värde']],
    body: userInfo,
    margin: { left: margin, right: margin },
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold', fontSize: 10 },
    bodyStyles: { fontSize: 9, cellPadding: 4 },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    styles: { lineColor: [200, 200, 200], lineWidth: 0.1 },
    didDrawPage: (data: any) => { yPos = data.cursor.y + 15 },
  })

  // Bookings
  if (userData.bookings.length > 0) {
    doc.setFontSize(16)
    doc.text('Bokningar', margin, yPos)
    yPos += 10

    const bookingsData = userData.bookings.map((b) => [
      b.scheduledDate ? format(new Date(b.scheduledDate), 'dd/MM/yyyy', { locale: sv }) : 'Ej angivet',
      b.startTime || 'Ej angivet',
      b.endTime || 'Ej angivet',
      b.status || 'Ej angivet',
      b.paymentStatus || 'Ej angivet',
      b.totalPrice ? `${b.totalPrice} kr` : 'Ej angivet',
    ])

    autoTable(doc, {
      startY: yPos,
      head: [['Datum', 'Start', 'Slut', 'Status', 'Betalning', 'Pris']],
      body: bookingsData,
      margin: { left: margin, right: margin },
      headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 8, cellPadding: 3 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      styles: { lineColor: [200, 200, 200], lineWidth: 0.1 },
      didDrawPage: (data: any) => { yPos = data.cursor.y + 15 },
    })
  }

  // Credits
  if (userData.credits.length > 0) {
    doc.setFontSize(16)
    doc.text('Krediter', margin, yPos)
    yPos += 10

    const creditsData = userData.credits.map((c) => [
      c.creditType,
      c.creditsRemaining?.toString?.() ?? '',
      c.creditsTotal?.toString?.() ?? '',
      c.createdAt ? format(new Date(c.createdAt), 'dd/MM/yyyy', { locale: sv }) : 'Ej angivet',
    ])

    autoTable(doc, {
      startY: yPos,
      head: [['Typ', 'Kvar', 'Totalt', 'Skapat']],
      body: creditsData,
      margin: { left: margin, right: margin },
      headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 8, cellPadding: 3 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      styles: { lineColor: [200, 200, 200], lineWidth: 0.1 },
      didDrawPage: (data: any) => { yPos = data.cursor.y + 15 },
    })
  }

  // Feedback
  if (userData.feedback.length > 0) {
    doc.setFontSize(16)
    doc.text('Feedback', margin, yPos)
    yPos += 10

    const feedbackData = userData.feedback.map((f) => [
      f.stepIdentifier || 'Generell',
      f.rating ? String(f.rating) : 'Ej angivet',
      f.valuation ? String(f.valuation) : 'Ej angivet',
      f.createdAt ? format(new Date(f.createdAt), 'dd/MM/yyyy', { locale: sv }) : 'Ej angivet',
      f.feedbackText ? `${String(f.feedbackText).substring(0, 50)}...` : 'Ingen text',
    ])

    autoTable(doc, {
      startY: yPos,
      head: [['Steg', 'Betyg', 'Värdering', 'Datum', 'Kommentar']],
      body: feedbackData,
      margin: { left: margin, right: margin },
      headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 8, cellPadding: 3 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      styles: { lineColor: [200, 200, 200], lineWidth: 0.1 },
      didDrawPage: (data: any) => { yPos = data.cursor.y + 15 },
    })
  }

  // Handledarutbildningar
  if (userData.handledarBookings.length > 0) {
    doc.setFontSize(16)
    doc.text('Handledarutbildningar', margin, yPos)
    yPos += 10

    const handledarData = userData.handledarBookings.map((b) => [
      b.scheduledDate ? format(new Date(b.scheduledDate), 'dd/MM/yyyy', { locale: sv }) : 'Ej angivet',
      b.startTime || 'Ej angivet',
      b.endTime || 'Ej angivet',
      b.status || 'Ej angivet',
      b.paymentStatus || 'Ej angivet',
      b.totalPrice ? `${b.totalPrice} kr` : 'Ej angivet',
    ])

    autoTable(doc, {
      startY: yPos,
      head: [['Datum', 'Start', 'Slut', 'Status', 'Betalning', 'Pris']],
      body: handledarData,
      margin: { left: margin, right: margin },
      headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 8, cellPadding: 3 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      styles: { lineColor: [200, 200, 200], lineWidth: 0.1 },
      didDrawPage: (data: any) => { yPos = data.cursor.y + 15 },
    })
  }

  // Summary
  doc.setFontSize(16)
  doc.text('Sammanfattning', margin, yPos)
  yPos += 10

  const summaryData = [
    ['Totalt antal bokningar', String(userData.bookings.length)],
    ['Totalt antal krediter', String(userData.credits.length)],
    ['Totalt antal feedback', String(userData.feedback.length)],
    ['Totalt antal handledarutbildningar', String(userData.handledarBookings.length)],
    ['Export datum', format(new Date(), 'dd/MM/yyyy HH:mm', { locale: sv })],
  ]

  autoTable(doc, {
    startY: yPos,
    head: [['Kategori', 'Antal']],
    body: summaryData,
    margin: { left: margin, right: margin },
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold', fontSize: 10 },
    bodyStyles: { fontSize: 9, cellPadding: 4 },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    styles: { lineColor: [200, 200, 200], lineWidth: 0.1 },
  })

  // Output as Buffer for Node
  const arrayBuffer = doc.output('arraybuffer') as ArrayBuffer
  const buffer = Buffer.from(arrayBuffer)
  return buffer
}
