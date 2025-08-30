'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Car, BookOpen, Clock, Users, Euro } from 'lucide-react';

interface LessonType {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  price: number;
  priceStudent?: number;
  isActive: boolean;
  allowsSupervisors?: boolean;
  pricePerSupervisor?: number;
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

interface LessonTypeSelectionProps {
  lessonTypes: LessonType[];
  teoriLessonTypes: TeoriLessonType[];
  onLessonTypeSelect: (lessonType: LessonType) => void;
  onTeoriLessonTypeSelect: (teoriLessonType: TeoriLessonType) => void;
}

export function LessonTypeSelection({
  lessonTypes,
  teoriLessonTypes,
  onLessonTypeSelect,
  onTeoriLessonTypeSelect
}: LessonTypeSelectionProps) {
  const activeLessonTypes = lessonTypes.filter(lt => lt.isActive);
  const activeTeoriLessonTypes = teoriLessonTypes.filter(tlt => tlt.isActive);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Vad vill du boka?
        </h2>
        <p className="text-lg text-gray-600">
          Välj mellan körlektioner eller teoriutbildningar
        </p>
      </div>

      {/* Driving Lessons Section */}
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <Car className="w-6 h-6 text-red-600" />
          <h3 className="text-2xl font-semibold text-gray-900">Körlektioner</h3>
          <Badge variant="outline" className="text-red-600 border-red-600">
            {activeLessonTypes.length} alternativ
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeLessonTypes.map((lessonType) => (
            <Card
              key={lessonType.id}
              className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-red-600"
              onClick={() => onLessonTypeSelect(lessonType)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{lessonType.name}</CardTitle>
                  <Badge variant="secondary" className="bg-red-100 text-red-800">
                    <Clock className="w-3 h-3 mr-1" />
                    {lessonType.durationMinutes}min
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {lessonType.description && (
                  <p className="text-gray-600 text-sm">
                    {lessonType.description}
                  </p>
                )}

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="space-y-1">
                    <div className="text-sm text-gray-500">Pris</div>
                    <div className="text-2xl font-bold text-red-600">
                      {lessonType.price}€
                    </div>
                    {lessonType.priceStudent && (
                      <div className="text-sm text-gray-600">
                        Studentpris: {lessonType.priceStudent}€
                      </div>
                    )}
                  </div>

                  <Button className="bg-red-600 hover:bg-red-700">
                    Välj lektion
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Teori Lessons Section */}
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <BookOpen className="w-6 h-6 text-red-600" />
          <h3 className="text-2xl font-semibold text-gray-900">Teoriutbildningar</h3>
          <Badge variant="outline" className="text-red-600 border-red-600">
            {activeTeoriLessonTypes.length} alternativ
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeTeoriLessonTypes.map((teoriLessonType) => (
            <Card
              key={teoriLessonType.id}
              className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-red-600"
              onClick={() => onTeoriLessonTypeSelect(teoriLessonType)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{teoriLessonType.name}</CardTitle>
                  <div className="flex space-x-2">
                    <Badge variant="secondary" className="bg-red-100 text-red-800">
                      <Clock className="w-3 h-3 mr-1" />
                      {teoriLessonType.durationMinutes}min
                    </Badge>
                    {teoriLessonType.allowsSupervisors && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        <Users className="w-3 h-3 mr-1" />
                        Handledare
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {teoriLessonType.description && (
                  <p className="text-gray-600 text-sm">
                    {teoriLessonType.description}
                  </p>
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Baspris:</span>
                    <span className="font-semibold">{teoriLessonType.price}€</span>
                  </div>

                  {teoriLessonType.allowsSupervisors && teoriLessonType.pricePerSupervisor && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Handledare:</span>
                      <span className="font-semibold">+{teoriLessonType.pricePerSupervisor}€/pers</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Max deltagare:</span>
                    <span className="font-semibold">{teoriLessonType.maxParticipants}</span>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Button className="w-full bg-red-600 hover:bg-red-700">
                    Välj utbildning
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Info Section */}
      <div className="bg-blue-50 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <Euro className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <div>
            <h4 className="text-lg font-semibold text-blue-900 mb-2">
              Betalning och Bokning
            </h4>
            <ul className="text-blue-800 space-y-1 text-sm">
              <li>• Alla bokningar kräver betalning inom 10 minuter</li>
              <li>• Studentrabatt tillämpas automatiskt för behöriga elever</li>
              <li>• Handledarutbildningar kräver minst en handledare</li>
              <li>• Du kan avboka kostnadsfritt upp till 24 timmar innan</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
