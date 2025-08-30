"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Car, Settings, CheckCircle, AlertCircle } from 'lucide-react';

interface LessonType {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  price: number;
  priceStudent?: number;
  isActive: boolean;
}

interface GearSelectionProps {
  lessonType: LessonType;
  onGearSelect: (transmissionType: string) => void;
}

export function GearSelection({ lessonType, onGearSelect }: GearSelectionProps) {
  const [selectedGear, setSelectedGear] = useState<string | null>(null);

  const gearOptions = [
    {
      type: 'manual',
      name: 'Manuell',
      description: 'Traditionell växellåda med koppling',
      icon: '🚗',
      features: ['Koppling', 'Växelspak', 'Mer kontroll']
    },
    {
      type: 'automatic',
      name: 'Automatisk',
      description: 'Automatisk växellåda utan koppling',
      icon: '🚙',
      features: ['Ingen koppling', 'Enkelt att köra', 'Bekvämare']
    }
  ];

  const handleGearSelect = (gearType: string) => {
    setSelectedGear(gearType);
  };

  const handleConfirm = () => {
    if (selectedGear) {
      onGearSelect(selectedGear);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Välj växellåda för {lessonType.name}
        </h2>
        <p className="text-lg text-gray-600 mb-4">
          Vilken typ av växellåda föredrar du?
        </p>
        <Badge variant="secondary" className="bg-red-100 text-red-800">
          <Settings className="w-4 h-4 mr-1" />
          {lessonType.durationMinutes} min lektion
        </Badge>
      </div>

      {/* Gear Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {gearOptions.map((option) => (
          <Card
            key={option.type}
            className={`cursor-pointer transition-all duration-200 ${
              selectedGear === option.type
                ? 'ring-2 ring-red-600 bg-red-50 shadow-lg'
                : 'hover:shadow-md'
            }`}
            onClick={() => handleGearSelect(option.type)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-3xl">{option.icon}</span>
                  <div>
                    <CardTitle className="text-xl">{option.name}</CardTitle>
                    {selectedGear === option.type && (
                      <Badge className="mt-1 bg-red-600">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Vald
                      </Badge>
                    )}
                  </div>
                </div>
                <Car className="w-8 h-8 text-gray-400" />
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <p className="text-gray-600">{option.description}</p>

              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900">Egenskaper:</h4>
                <ul className="space-y-1">
                  {option.features.map((feature, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-center">
                      <div className="w-1.5 h-1.5 bg-red-600 rounded-full mr-2 flex-shrink-0"></div>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Selection Confirmation */}
      {selectedGear && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-green-800">
                    Vald växellåda: {gearOptions.find(g => g.type === selectedGear)?.name}
                  </p>
                  <p className="text-sm text-green-600">
                    Du kommer att öva med {selectedGear === 'manual' ? 'manuell' : 'automatisk'} växellåda
                  </p>
                </div>
              </div>
              <Button
                onClick={handleConfirm}
                className="bg-green-600 hover:bg-green-700"
              >
                Bekräfta val
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info */}
      <div className="bg-blue-50 rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-blue-900 mb-3">
              <span className="text-2xl mr-2">🚗</span>
              Manuell växellåda
            </h4>
            <ul className="text-blue-800 text-sm space-y-1">
              <li>• Traditionell körupplevelse</li>
              <li>• Mer kontroll över fordonet</li>
              <li>• Kräver övning av koppling</li>
              <li>• Billigare att äga och underhålla</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-blue-900 mb-3">
              <span className="text-2xl mr-2">🚙</span>
              Automatisk växellåda
            </h4>
            <ul className="text-blue-800 text-sm space-y-1">
              <li>• Enkelt att köra i stadstrafik</li>
              <li>• Mindre tröttsamt vid långa körningar</li>
              <li>• Snabbare acceleration</li>
              <li>• Dyrare att äga och underhålla</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Warning */}
      <div className="bg-amber-50 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-amber-800 mb-1">Viktig information</h4>
            <ul className="text-amber-700 text-sm space-y-1">
              <li>• Du kan alltid byta växellådstyp vid senare bokningar</li>
              <li>• Båda typer kräver körkortstillstånd</li>
              <li>• Instruktören hjälper dig att välja rätt typ för dina behov</li>
              <li>• Övningstider anpassas efter din erfarenhet</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
