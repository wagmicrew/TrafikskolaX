import { db } from '@/lib/db';
import { bookings, users, cars, lessonTypes } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { 
  Calendar, 
  Clock, 
  User, 
  Mail, 
  Phone, 
  Car,
  CheckCircle,
  XCircle,
  AlertCircle,
  CreditCard,
  FileText,
  MapPin,
  ArrowLeft,
  Edit,
  Trash2
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function BookingDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  // Fetch booking details with related information
  const booking = await db
    .select({
      id: bookings.id,
      bookingDate: bookings.bookingDate,
      startTime: bookings.startTime,
      endTime: bookings.endTime,
      lessonType: bookings.lessonType,
      status: bookings.status,
      paymentStatus: bookings.paymentStatus,
      isCompleted: bookings.isCompleted,
      completedAt: bookings.completedAt,
      notes: bookings.notes,
      invoiceNumber: bookings.invoiceNumber,
      invoiceDate: bookings.invoiceDate,
      createdAt: bookings.createdAt,
      updatedAt: bookings.updatedAt,
      // User info
      userId: bookings.userId,
      userName: sql`COALESCE(${users.firstName} || ' ' || ${users.lastName}, ${bookings.guestName})`,
      userEmail: sql`COALESCE(${users.email}, ${bookings.guestEmail})`,
      userPhone: sql`COALESCE(${users.phone}, ${bookings.guestPhone})`,
      // Car info
      carId: bookings.carId,
      carName: cars.name,
      carRegistration: cars.registrationNumber,
      // Lesson type info
      lessonTypeName: lessonTypes.name,
      lessonTypePrice: lessonTypes.price,
    })
    .from(bookings)
    .leftJoin(users, eq(bookings.userId, users.id))
    .leftJoin(cars, eq(bookings.carId, cars.id))
    .leftJoin(lessonTypes, eq(bookings.lessonType, lessonTypes.id))
    .where(eq(bookings.id, params.id))
    .limit(1);

  if (!booking || booking.length === 0) {
    notFound();
  }

  const bookingData = booking[0];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-4 h-4" />
            Bekräftad
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
            <XCircle className="w-4 h-4" />
            Avbokad
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
            <AlertCircle className="w-4 h-4" />
            Väntande
          </span>
        );
    }
  };

  const getPaymentBadge = (paymentStatus: string) => {
    return paymentStatus === 'paid' ? (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
        <CreditCard className="w-4 h-4" />
        Betald
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
        <CreditCard className="w-4 h-4" />
        Ej betald
      </span>
    );
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (date: Date | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('sv-SE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link
          href="/dashboard/admin/bookings"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Tillbaka till bokningar
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-white">Bokningsdetaljer</h1>
            <div className="flex gap-2">
              <button className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors">
                <Edit className="w-5 h-5 text-white" />
              </button>
              <button className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors">
                <Trash2 className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Status Section */}
          <div className="flex flex-wrap gap-4">
            {getStatusBadge(bookingData.status)}
            {getPaymentBadge(bookingData.paymentStatus)}
            {bookingData.isCompleted && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                <CheckCircle className="w-4 h-4" />
                Genomförd
              </span>
            )}
          </div>

          {/* Main Information */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Lektionsinformation
              </h2>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Datum:</span>
                  <span className="font-medium">{formatDate(bookingData.bookingDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tid:</span>
                  <span className="font-medium">
                    {bookingData.startTime?.slice(0, 5)} - {bookingData.endTime?.slice(0, 5)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Lektionstyp:</span>
                  <span className="font-medium">{bookingData.lessonTypeName || bookingData.lessonType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Pris:</span>
                  <span className="font-medium">{bookingData.lessonTypePrice} kr</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                Kundinformation
              </h2>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Namn:</span>
                  <span className="font-medium">{bookingData.userName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">E-post:</span>
                  <span className="font-medium">{bookingData.userEmail}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Telefon:</span>
                  <span className="font-medium">{bookingData.userPhone}</span>
                </div>
                {bookingData.userId && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Användar-ID:</span>
                    <Link 
                      href={`/dashboard/admin/users/${bookingData.userId}`}
                      className="font-medium text-blue-600 hover:text-blue-800"
                    >
                      {bookingData.userId}
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Car Information */}
          {bookingData.carId && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Car className="w-5 h-5 text-blue-600" />
                Bilinformation
              </h2>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Bil:</span>
                  <span className="font-medium">{bookingData.carName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Registreringsnummer:</span>
                  <span className="font-medium">{bookingData.carRegistration}</span>
                </div>
              </div>
            </div>
          )}

          {/* Invoice Information */}
          {bookingData.invoiceNumber && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Fakturainformation
              </h2>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Fakturanummer:</span>
                  <span className="font-medium">{bookingData.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Fakturadatum:</span>
                  <span className="font-medium">{formatDate(bookingData.invoiceDate)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          {bookingData.notes && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800">Anteckningar</h2>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-700 whitespace-pre-wrap">{bookingData.notes}</p>
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="pt-4 border-t border-gray-200 text-sm text-gray-500">
            <div className="grid md:grid-cols-2 gap-4">
              <div>Skapad: {formatDateTime(bookingData.createdAt)}</div>
              <div>Uppdaterad: {formatDateTime(bookingData.updatedAt)}</div>
              {bookingData.completedAt && (
                <div>Genomförd: {formatDateTime(bookingData.completedAt)}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
