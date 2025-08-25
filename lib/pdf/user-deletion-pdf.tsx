import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// Define types for the PDF data
export interface UserDeletionPDFData {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    personalNumber?: string;
    address?: string;
    postalCode?: string;
    city?: string;
    role: string;
    customerNumber?: string;
    inskriven: boolean;
    workplace?: string;
    workPhone?: string;
    mobilePhone?: string;
    createdAt: Date;
  };
  bookings: Array<{
    id: string;
    scheduledDate: string;
    startTime: string;
    endTime: string;
    durationMinutes: number;
    status: string;
    paymentStatus: string;
    paymentMethod?: string;
    totalPrice: string;
    notes?: string;
    isCompleted: boolean;
    completedAt?: Date;
    invoiceNumber?: string;
    invoiceDate?: Date;
    swishUUID?: string;
    createdAt: Date;
    lessonTypeName?: string;
  }>;
  teacherBookings: Array<{ id: string }>;
  deletedBy: {
    firstName: string;
    lastName: string;
    email: string;
  };
  deletedAt: Date;
}

// Create styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 30,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    borderBottom: 2,
    borderBottomColor: '#2563eb',
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 10,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 10,
    borderBottom: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 5,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  label: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#374151',
    width: 120,
  },
  value: {
    fontSize: 10,
    color: '#6b7280',
    flex: 1,
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    padding: 8,
    borderBottom: 1,
    borderBottomColor: '#e2e8f0',
  },
  tableHeaderCell: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#374151',
    flex: 1,
    textAlign: 'left',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 6,
    borderBottom: 1,
    borderBottomColor: '#f1f5f9',
  },
  tableCell: {
    fontSize: 8,
    color: '#6b7280',
    flex: 1,
    textAlign: 'left',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 8,
    color: '#9ca3af',
    borderTop: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 10,
  },
  summaryBox: {
    backgroundColor: '#f8fafc',
    padding: 15,
    borderRadius: 5,
    border: 1,
    borderColor: '#e2e8f0',
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  summaryLabel: {
    fontSize: 10,
    color: '#374151',
  },
  summaryValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1e40af',
  },
  warningBox: {
    backgroundColor: '#fef3c7',
    padding: 10,
    borderRadius: 5,
    border: 1,
    borderColor: '#f59e0b',
    marginBottom: 15,
  },
  warningText: {
    fontSize: 10,
    color: '#92400e',
    textAlign: 'center',
  },
});

// PDF Document Component
export const UserDeletionPDF: React.FC<{ data: UserDeletionPDFData }> = ({ data }) => {
  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('sv-SE');
  };

  const formatDateTime = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString('sv-SE');
  };

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `${num.toFixed(2)} SEK`;
  };

  const totalBookingValue = data.bookings.reduce((sum, booking) => {
    return sum + parseFloat(booking.totalPrice || '0');
  }, 0);

  const completedBookings = data.bookings.filter(b => b.isCompleted).length;
  const paidBookings = data.bookings.filter(b => b.paymentStatus === 'paid').length;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>TrafikskolaX - Användarradering</Text>
          <Text style={styles.subtitle}>
            Detaljerad rapport över raderad användare och tillhörande data
          </Text>
        </View>

        {/* Warning Box */}
        <View style={styles.warningBox}>
          <Text style={styles.warningText}>
            KONFIDENTIELL RAPPORT - Denna rapport innehåller personuppgifter och ska hanteras enligt GDPR
          </Text>
        </View>

        {/* Summary Box */}
        <View style={styles.summaryBox}>
          <Text style={styles.summaryTitle}>Sammanfattning</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Totalt antal bokningar:</Text>
            <Text style={styles.summaryValue}>{data.bookings.length}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Genomförda bokningar:</Text>
            <Text style={styles.summaryValue}>{completedBookings}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Betalda bokningar:</Text>
            <Text style={styles.summaryValue}>{paidBookings}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Totalt bokningsvärde:</Text>
            <Text style={styles.summaryValue}>{formatCurrency(totalBookingValue)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Handledar-bokningar:</Text>
            <Text style={styles.summaryValue}>{data.teacherBookings.length}</Text>
          </View>
        </View>

        {/* User Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Användarinformation</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Namn:</Text>
            <Text style={styles.value}>{data.user.firstName} {data.user.lastName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>E-post:</Text>
            <Text style={styles.value}>{data.user.email}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Telefon:</Text>
            <Text style={styles.value}>{data.user.phone || 'Ej angivet'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Personnummer:</Text>
            <Text style={styles.value}>{data.user.personalNumber || 'Ej angivet'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Adress:</Text>
            <Text style={styles.value}>
              {data.user.address ? `${data.user.address}, ${data.user.postalCode} ${data.user.city}` : 'Ej angivet'}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Roll:</Text>
            <Text style={styles.value}>{data.user.role}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Kundnummer:</Text>
            <Text style={styles.value}>{data.user.customerNumber || 'Ej angivet'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Inskriven:</Text>
            <Text style={styles.value}>{data.user.inskriven ? 'Ja' : 'Nej'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Registrerad:</Text>
            <Text style={styles.value}>{formatDate(data.user.createdAt)}</Text>
          </View>
        </View>

        {/* Workplace Information (if applicable) */}
        {(data.user.workplace || data.user.workPhone) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Arbetsplatsinformation</Text>
            {data.user.workplace && (
              <View style={styles.row}>
                <Text style={styles.label}>Arbetsplats:</Text>
                <Text style={styles.value}>{data.user.workplace}</Text>
              </View>
            )}
            {data.user.workPhone && (
              <View style={styles.row}>
                <Text style={styles.label}>Arbetstelefon:</Text>
                <Text style={styles.value}>{data.user.workPhone}</Text>
              </View>
            )}
            {data.user.mobilePhone && (
              <View style={styles.row}>
                <Text style={styles.label}>Mobiltelefon:</Text>
                <Text style={styles.value}>{data.user.mobilePhone}</Text>
              </View>
            )}
          </View>
        )}

        {/* Bookings Table */}
        {data.bookings.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Bokningshistorik ({data.bookings.length} bokningar)</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Datum</Text>
                <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Tid</Text>
                <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Status</Text>
                <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Betalning</Text>
                <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Pris</Text>
                <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Faktura</Text>
              </View>
              {data.bookings.map((booking, index) => (
                <View key={booking.id} style={styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 1.5 }]}>
                    {formatDate(booking.scheduledDate)}
                  </Text>
                  <Text style={[styles.tableCell, { flex: 1 }]}>
                    {booking.startTime}-{booking.endTime}
                  </Text>
                  <Text style={[styles.tableCell, { flex: 1 }]}>
                    {booking.isCompleted ? 'Genomförd' : booking.status}
                  </Text>
                  <Text style={[styles.tableCell, { flex: 1 }]}>
                    {booking.paymentStatus}
                  </Text>
                  <Text style={[styles.tableCell, { flex: 1 }]}>
                    {formatCurrency(booking.totalPrice)}
                  </Text>
                  <Text style={[styles.tableCell, { flex: 1 }]}>
                    {booking.invoiceNumber || '-'}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Deletion Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Raderingsinformation</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Raderad av:</Text>
            <Text style={styles.value}>{data.deletedBy.firstName} {data.deletedBy.lastName} ({data.deletedBy.email})</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Raderingstidpunkt:</Text>
            <Text style={styles.value}>{formatDateTime(data.deletedAt)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Rapport genererad:</Text>
            <Text style={styles.value}>{formatDateTime(new Date())}</Text>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          TrafikskolaX - Användarraderingsrapport | Genererad: {formatDateTime(new Date())} | Sida 1 av 1
        </Text>
      </Page>
    </Document>
  );
};

// Function to generate PDF buffer
export async function generateUserDeletionPDF(data: UserDeletionPDFData): Promise<Buffer> {
  const { renderToBuffer } = await import('@react-pdf/renderer');
  return await renderToBuffer(<UserDeletionPDF data={data} />);
}
