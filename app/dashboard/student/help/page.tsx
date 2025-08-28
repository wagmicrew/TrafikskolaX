'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import StudentHeader from '../StudentHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  HelpCircle,
  Phone,
  Mail,
  MapPin,
  Clock,
  Car,
  BookOpen,
  MessageSquare,
  Package,
  Calendar,
  CreditCard
} from 'lucide-react';
import Link from 'next/link';

export default function StudentHelpPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'student')) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Laddar...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'student') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <StudentHeader
        title="Hjälp & Information"
        icon={<HelpCircle className="w-5 h-5" />}
        userName={user.firstName}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Card */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 mb-8">
          <CardContent className="p-6">
            <div className="text-center">
              <HelpCircle className="w-16 h-16 text-blue-600 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Välkommen till Hjälp & Information</h1>
              <p className="text-gray-600">Här hittar du all information du behöver för dina körlektioner</p>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <Calendar className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Boka lektion</h3>
              <p className="text-sm text-gray-600 mb-4">Boka ny körlektion online</p>
              <Button asChild className="w-full">
                <Link href="/dashboard/student/bokningar">Boka nu</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <MessageSquare className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Min feedback</h3>
              <p className="text-sm text-gray-600 mb-4">Se lärarens kommentarer</p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/dashboard/student/feedback">Visa feedback</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Information Sections */}
        <div className="space-y-6">
          {/* Contact Information */}
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-gray-900 flex items-center gap-2">
                <Phone className="w-5 h-5" />
                Kontaktinformation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-semibold text-gray-900">Telefon</p>
                  <p className="text-gray-600">0455-123 45 67</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-semibold text-gray-900">E-post</p>
                  <p className="text-gray-600">info@trafikskola-hassleholm.se</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-purple-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900">Adress</p>
                  <p className="text-gray-600">Stortorget 12, 281 31 Hässleholm</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Opening Hours */}
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-gray-900 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Öppettider
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-900">Måndag - Fredag</span>
                  <span className="text-gray-600">08:00 - 18:00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-900">Lördag</span>
                  <span className="text-gray-600">09:00 - 15:00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-900">Söndag</span>
                  <span className="text-gray-600">Stängt</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-gray-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Betalning & Paket
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Betalningsmetoder</h3>
                <ul className="space-y-1 text-gray-600">
                  <li>• Swish - Rekommenderad betalningsmetod</li>
                  <li>• Kontant - Vid lektionstillfället</li>
                  <li>• Kortbetalning - I receptionen</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Körlektioner</h3>
                <p className="text-gray-600 mb-3">Priser från 450 SEK per lektion (45 minuter)</p>
                <Button asChild color="green">
                  <Link href="/paketbutik">
                    <Package className="w-4 h-4 mr-2" />
                    Se paketpriser
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* What to Bring */}
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-gray-900 flex items-center gap-2">
                <Car className="w-5 h-5" />
                Vad du behöver ta med
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  <p className="text-gray-900">Giltig ID-handling (pass eller körkortstillstånd)</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  <p className="text-gray-900">Körkortstillstånd (om du har ett)</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  <p className="text-gray-900">Bekväma kläder och skor</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  <p className="text-gray-900">Betalning för lektionen (om inte förbetald)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Theory Information */}
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-gray-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Teoriutbildning
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                För att få körkort måste du också genomföra teorilektioner. Vi erbjuder både klassrumsundervisning och digitala alternativ.
              </p>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-900">Riskettan</span>
                  <span className="text-gray-600">4 timmar obligatorisk</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-900">Trafikskola</span>
                  <span className="text-gray-600">Minst 3,5 timmar</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-900">Förarprov</span>
                  <span className="text-gray-600">30 minuter</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Emergency Contact */}
        <Card className="bg-red-50 border-red-200 mt-8">
          <CardContent className="p-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-red-900 mb-2">Akut hjälp?</h3>
              <p className="text-red-700 mb-4">
                Om du har akuta frågor eller problem med dina bokningar, kontakta oss direkt.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button color="failure" asChild>
                  <a href="tel:+464551234567">
                    <Phone className="w-4 h-4 mr-2" />
                    Ring oss nu
                  </a>
                </Button>
                <Button variant="outline" color="failure" asChild>
                  <a href="mailto:info@trafikskola-hassleholm.se">
                    <Mail className="w-4 h-4 mr-2" />
                    Skicka e-post
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


