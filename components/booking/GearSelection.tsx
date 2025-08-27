"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Settings } from "lucide-react"

interface GearSelectionProps {
  selectedDate: Date
  selectedTime: string
  lessonTypeName: string
  onComplete: (data: { transmissionType: "manual" | "automatic" }) => void
  onBack: () => void
}

export function GearSelection({
  selectedDate,
  selectedTime,
  lessonTypeName,
  onComplete,
  onBack
}: GearSelectionProps) {
  const [selectedGear, setSelectedGear] = useState<"manual" | "automatic" | null>(null)

  const formatDateTime = (date: Date, time: string) => {
    const formattedDate = date.toLocaleDateString('sv-SE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    return `${formattedDate} ${time}`
  }

  const handleGearSelect = (gear: "manual" | "automatic") => {
    setSelectedGear(gear)
  }

  const handleContinue = () => {
    if (selectedGear) {
      onComplete({ transmissionType: selectedGear })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Tillbaka
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Välj växellåda</h2>
          <p className="text-gray-700">Välj vilken typ av växellåda du vill öva med</p>
        </div>
      </div>

      {/* Booking Summary */}
      <Card className="bg-gray-50 border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5 text-blue-600" />
            <div>
              <p className="font-medium text-gray-900">{lessonTypeName}</p>
              <p className="text-sm text-gray-600">
                {formatDateTime(selectedDate, selectedTime)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gear Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Manual Transmission */}
        <Card
          className={`cursor-pointer transition-all hover:shadow-lg border-2 ${
            selectedGear === 'manual'
              ? "ring-2 ring-blue-600 border-blue-600 bg-blue-50"
              : "hover:border-blue-300 border-gray-200"
          }`}
          onClick={() => handleGearSelect('manual')}
        >
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Settings className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Manuell</h3>
            <p className="text-sm text-gray-600 mb-4">
              Traditionell växellåda där du manuellt byter växel med kopplingspedalen
            </p>
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              selectedGear === 'manual'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-600'
            }`}>
              {selectedGear === 'manual' ? 'Vald' : 'Välj'}
            </div>
          </CardContent>
        </Card>

        {/* Automatic Transmission */}
        <Card
          className={`cursor-pointer transition-all hover:shadow-lg border-2 ${
            selectedGear === 'automatic'
              ? "ring-2 ring-green-600 border-green-600 bg-green-50"
              : "hover:border-green-300 border-gray-200"
          }`}
          onClick={() => handleGearSelect('automatic')}
        >
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Settings className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Automat</h3>
            <p className="text-sm text-gray-600 mb-4">
              Automatisk växellåda där bilen byter växel automatiskt
            </p>
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              selectedGear === 'automatic'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-600'
            }`}>
              {selectedGear === 'automatic' ? 'Vald' : 'Välj'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Continue Button */}
      <div className="flex justify-end pt-4">
        <Button
          onClick={handleContinue}
          disabled={!selectedGear}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
        >
          Fortsätt till bekräftelse
        </Button>
      </div>
    </div>
  )
}
