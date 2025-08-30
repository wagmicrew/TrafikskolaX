'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  CheckCircle,
  Calendar,
  Clock,
  Car,
  User,
  CreditCard,
  Users,
  BookOpen,
  AlertTriangle,
  Euro
} from 'lucide-react';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';

interface LessonType {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  price: number;
  priceStudent?: number;
  isActive: boolean;
}

interface TeoriLessonType {
  id: string;
  name: string;
  description: string | null;
  allowsSupervisors: boolean;
  price: number;
  pricePerSupervisor?: number;
  durationMinutes: number;
  maxParticipants: number;
  isActive: boolean;
}

interface TeoriSession {
  id: string;
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  maxParticipants: number;
  currentParticipants: number;
  price: number;
  pricePerSupervisor?: number;
  availableSpots: number;
  formattedDateTime: string;
  allowsSupervisors: boolean;
}

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  personalNumber?: string;
  phone?: string;
}

interface Supervisor {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  personalNumber: string;
}

interface BookingData {
  id?: string;
  tempBookingId?: string;
  lessonType?: LessonType;
  teoriLessonType?: TeoriLessonType;
  teoriSession?: TeoriSession;
  selectedDate?: string;
  selectedTime?: string;
  transmissionType?: string;
  student?: Student;
  supervisors?: Supervisor[];
  totalPrice?: number;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

interface BookingConfirmationProps {
  bookingData: BookingData;
  user: User | null;
  onConfirm: () => void;
  isLoading: boolean;
}

export function BookingConfirmation({
  bookingData,
  user,
  onConfirm,
  isLoading
}: BookingConfirmationProps) {
  const [acceptTerms, setAcceptTerms] = useState(false);

  // Calculate total price
  const calculateTotalPrice = (): number => {
    if (bookingData.lessonType) {
      // Driving lesson
      return bookingData.lessonType.price;
    } else if (bookingData.teoriSession && bookingData.teoriLessonType) {
      // Teori session
      const basePrice = bookingData.teoriSession.price;
      const supervisorCount = bookingData.supervisors?.length || 0;
      const supervisorPrice = bookingData.teoriLessonType.pricePerSupervisor || 0;
      return basePrice + (supervisorPrice * supervisorCount);
    }
    return 0;
  };

  const getBookingType = () => {
    if (bookingData.lessonType) return 'Körlektion';
    if (bookingData.teoriLessonType) return 'Teoriutbildning';
    return 'Bokning';
  };

  const formatDateTime = (date: string, time: string) => {
    const dateTime = new Date(`${date} ${time}`);
    return format(dateTime, 'EEEE d MMMM yyyy HH:mm', { locale: sv });
  };

  const totalPrice = calculateTotalPrice();
  const isStudent = user?.role === 'student';
  const studentPrice = bookingData.lessonType?.priceStudent;
  const finalPrice = isStudent && studentPrice ? studentPrice : totalPrice;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Bekräfta din bokning
        </h2>
        <p className="text-lg text-gray-600 mb-4">
          Granska dina uppgifter och bekräfta bokningen
        </p>
        <Badge variant="secondary" className="bg-red-100 text-red-800">
          <CheckCircle className="w-4 h-4 mr-1" />
          Nästan klar
        </Badge>
      </div>

      {/* Booking Summary */}
      <Card className="bg-gray-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5" />
            <span>Bokningssammanfattning</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Booking Details */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900">Bokningsuppgifter</h3>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Car className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">
                    <strong>Typ:</strong> {getBookingType()}
                  </span>
                </div>

                {bookingData.lessonType && (
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">
                      <strong>Lektion:</strong> {bookingData.lessonType.name}
                    </span>
                  </div>
                )}

                {bookingData.teoriSession && bookingData.teoriLessonType && (
                  <div className="flex items-center space-x-2">
                    <BookOpen className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">
                      <strong>Utbildning:</strong> {bookingData.teoriSession.title}
                    </span>
                  </div>
                )}

                {bookingData.selectedDate && bookingData.selectedTime && (
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">
                      <strong>Datum & Tid:</strong> {formatDateTime(bookingData.selectedDate, bookingData.selectedTime)}
                    </span>
                  </div>
                )}

                {bookingData.transmissionType && (
                  <div className="flex items-center space-x-2">
                    <Car className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">
                      <strong>Växellåda:</strong> {bookingData.transmissionType === 'manual' ? 'Manuell' : 'Automatisk'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* User Details */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900">Deltagare</h3>

              <div className="space-y-2">
                {bookingData.student ? (
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">
                      <strong>Elev:</strong> {bookingData.student.firstName} {bookingData.student.lastName}
                    </span>
                  </div>
                ) : user ? (
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">
                      <strong>Bokad av:</strong> {user.firstName} {user.lastName}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">
                      <strong>Gäst:</strong> Gästbokning
                    </span>
                  </div>
                )}

                {bookingData.supervisors && bookingData.supervisors.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">
                      <strong>Handledare:</strong> {bookingData.supervisors.length} st
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Supervisors Details */}
      {bookingData.supervisors && bookingData.supervisors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>Handledare ({bookingData.supervisors.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {bookingData.supervisors.map((supervisor, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{supervisor.firstName} {supervisor.lastName}</p>
                    <p className="text-sm text-gray-600">{supervisor.email}</p>
                  </div>
                  <Badge variant="outline">
                    Handledare {index + 1}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Price Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Euro className="w-5 h-5" />
            <span>Prissammanfattning</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {bookingData.lessonType && (
            <>
              <div className="flex justify-between">
                <span>Baspris ({bookingData.lessonType.name}):</span>
                <span>{bookingData.lessonType.price}€</span>
              </div>
              {isStudent && studentPrice && studentPrice !== bookingData.lessonType.price && (
                <div className="flex justify-between text-green-600">
                  <span>Studentrabatt:</span>
                  <span>-{bookingData.lessonType.price - studentPrice}€</span>
                </div>
              )}
            </>
          )}

          {bookingData.teoriSession && bookingData.teoriLessonType && (
            <>
              <div className="flex justify-between">
                <span>Baspris ({bookingData.teoriSession.title}):</span>
                <span>{bookingData.teoriSession.price}€</span>
              </div>
              {bookingData.supervisors && bookingData.supervisors.length > 0 && (
                <div className="flex justify-between">
                  <span>Handledare ({bookingData.supervisors.length} × {bookingData.teoriLessonType.pricePerSupervisor}€):</span>
                  <span>{(bookingData.teoriLessonType.pricePerSupervisor || 0) * bookingData.supervisors.length}€</span>
                </div>
              )}
            </>
          )}

          <Separator />

          <div className="flex justify-between text-lg font-bold">
            <span>Totalt att betala:</span>
            <span className="text-red-600">{finalPrice}€</span>
          </div>
        </CardContent>
      </Card>

      {/* Terms and Conditions */}
      <Card className="bg-amber-50">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              id="acceptTerms"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="mt-1"
            />
            <div>
              <label htmlFor="acceptTerms" className="font-medium text-amber-800 cursor-pointer">
                Jag accepterar villkoren
              </label>
              <p className="text-amber-700 text-sm mt-1">
                Jag förstår att bokningen måste betalas inom 10 minuter.
                Avbokning kan göras kostnadsfritt upp till 24 timmar innan.
                För sen avbokning eller utebliven närvaro debiteras full avgift.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="text-center space-y-4">
        <Button
          onClick={onConfirm}
          disabled={isLoading || !acceptTerms}
          className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 px-8 py-3 text-lg"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Bearbetar bokning...
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5 mr-2" />
              Bekräfta och betala {finalPrice}€
            </>
          )}
        </Button>

        {!acceptTerms && (
          <p className="text-sm text-gray-600">
            Du måste acceptera villkoren för att fortsätta
          </p>
        )}
      </div>

      {/* Info */}
      <div className="bg-blue-50 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-blue-800 mb-1">Vad händer nu?</h4>
            <ul className="text-blue-700 text-sm space-y-1">
              <li>• Du omdirigeras till betalning (Swish eller kort)</li>
              <li>• Efter betalning får du en bekräftelse via e-post</li>
              <li>• Bokningen är giltig i 10 minuter från betalning</li>
              <li>• Alla deltagare får en påminnelse innan tillfället</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
