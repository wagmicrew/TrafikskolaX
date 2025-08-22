"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import toast from 'react-hot-toast';
import {
  Calendar,
  Clock,
  Users,
  DollarSign,
  UserCheck,
  BookOpen,
  ArrowRight,
  Info
} from 'lucide-react';

interface TeoriLessonType {
  id: string;
  name: string;
  description: string | null;
  allowsSupervisors: boolean;
  price: string;
  pricePerSupervisor: string | null;
  durationMinutes: number;
  maxParticipants: number;
  isActive: boolean;
}

export default function TeoriBookingPage() {
  const [lessonTypes, setLessonTypes] = useState<TeoriLessonType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  // Load lesson types
  useEffect(() => {
    const loadLessonTypes = async () => {
      try {
        // For demo purposes, using static data since the API might not be set up yet
        const demoData: TeoriLessonType[] = [
          {
            id: '1',
            name: 'Risktväan Teori',
            description: 'Teorilektion för risktvåan - endast studenter',
            allowsSupervisors: false,
            price: '500.00',
            pricePerSupervisor: null,
            durationMinutes: 60,
            maxParticipants: 1,
            isActive: true
          },
          {
            id: '2',
            name: 'Grundkurs Teori',
            description: 'Grundläggande teorilektion för studenter',
            allowsSupervisors: false,
            price: '500.00',
            pricePerSupervisor: null,
            durationMinutes: 60,
            maxParticipants: 1,
            isActive: true
          },
          {
            id: '3',
            name: 'Avancerad Teori',
            description: 'Avancerad teorilektion med möjlighet för handledare',
            allowsSupervisors: true,
            price: '600.00',
            pricePerSupervisor: '400.00',
            durationMinutes: 90,
            maxParticipants: 1,
            isActive: true
          },
          {
            id: '4',
            name: 'Handledar Teori',
            description: 'Teorilektion med obligatorisk handledare/supervisor',
            allowsSupervisors: true,
            price: '700.00',
            pricePerSupervisor: '500.00',
            durationMinutes: 90,
            maxParticipants: 1,
            isActive: true
          }
        ];

        setLessonTypes(demoData);
      } catch (error) {
        console.error('Error loading lesson types:', error);
        toast.error('Kunde inte ladda teorilektionstyper');
      } finally {
        setLoading(false);
      }
    };

    loadLessonTypes();
  }, []);

  const handleSelectType = (typeId: string) => {
    setSelectedType(typeId);
  };

  const handleContinueBooking = () => {
    if (!selectedType) {
      toast.error('Välj en teorilektionstyp först');
      return;
    }

    const selectedTypeData = lessonTypes.find(t => t.id === selectedType);
    toast.success(`Du har valt: ${selectedTypeData?.name}`);
    // In a real implementation, this would navigate to the next step
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Laddar teorilektionstyper...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-800 mb-4">
            🎓 Boka Teori Lektion
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Välj den teorilektionstyp som passar dina behov. Vissa lektioner kan inkludera handledare/supervisors.
          </p>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 max-w-4xl mx-auto">
          <Card className="bg-white/80 backdrop-blur-sm border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <BookOpen className="w-5 h-5" />
                Student Endast
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-blue-700">
                Teorilektioner där endast studenten deltar. Perfekt för grundläggande och mellanliggande kurser.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800">
                <UserCheck className="w-5 h-5" />
                Med Handledare
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-green-700">
                Teorilektioner där handledare/supervisors kan delta. Extra kostnad per handledare tillkommer.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Lesson Types Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {lessonTypes.map((lessonType) => (
            <Card
              key={lessonType.id}
              className={`cursor-pointer transition-all duration-300 hover:shadow-xl border-2 ${
                selectedType === lessonType.id
                  ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50 dark:bg-blue-950/50 shadow-blue-100 dark:shadow-blue-900/50'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800'
              }`}
              onClick={() => handleSelectType(lessonType.id)}
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                      {lessonType.name}
                    </CardTitle>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant={lessonType.isActive ? 'default' : 'secondary'}>
                        {lessonType.isActive ? 'Tillgänglig' : 'Ej tillgänglig'}
                      </Badge>
                      {lessonType.allowsSupervisors ? (
                        <Badge variant="outline" className="border-green-300 text-green-700">
                          Med Handledare
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-blue-300 text-blue-700">
                          Student Endast
                        </Badge>
                      )}
                    </div>
                    {lessonType.description && (
                      <CardDescription className="text-base text-slate-600 dark:text-slate-400">
                        {lessonType.description}
                      </CardDescription>
                    )}
                  </div>
                  {selectedType === lessonType.id && (
                    <div className="ml-4 p-2 bg-blue-600 rounded-full">
                      <div className="w-4 h-4 bg-white rounded-full"></div>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                        {lessonType.price} SEK
                      </p>
                      <p className="text-xs text-slate-500">Grundpris</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                        {lessonType.durationMinutes} min
                      </p>
                      <p className="text-xs text-slate-500">Längd</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-purple-600" />
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                        Max {lessonType.maxParticipants}
                      </p>
                      <p className="text-xs text-slate-500">Deltagare</p>
                    </div>
                  </div>
                  {lessonType.allowsSupervisors && lessonType.pricePerSupervisor && (
                    <div className="flex items-center gap-2 text-sm">
                      <UserCheck className="w-4 h-4 text-orange-600" />
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">
                          +{lessonType.pricePerSupervisor} SEK
                        </p>
                        <p className="text-xs text-slate-500">Per handledare</p>
                      </div>
                    </div>
                  )}
                </div>

                {lessonType.allowsSupervisors && (
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <p className="font-medium text-green-800 dark:text-green-200 mb-1">
                          Handledare Alternativ
                        </p>
                        <p className="text-green-700 dark:text-green-300">
                          Denna lektionstyp tillåter handledare/supervisors att delta.
                          Extra kostnad tillkommer per handledare.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Continue Button */}
        <div className="text-center mt-12">
          <Button
            onClick={handleContinueBooking}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <ArrowRight className="w-5 h-5 mr-2" />
            Fortsätt till Bokning
          </Button>
          {selectedType && (
            <p className="text-sm text-slate-600 mt-2">
              Du har valt: {lessonTypes.find(t => t.id === selectedType)?.name}
            </p>
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-16 text-center">
          <div className="max-w-2xl mx-auto bg-white/60 dark:bg-slate-800/60 rounded-lg p-6 backdrop-blur-sm">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">
              📚 Om Teori Lektioner
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Teorilektioner är utformade för att ge dig den teoretiska kunskapen du behöver för att bli en säker förare.
              Välj den typ som passar dina behov - från grundläggande kurser till avancerade lektioner med handledarstöd.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
