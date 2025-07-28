"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Settings, Zap } from "lucide-react"

interface TransmissionSelectionProps {
  onComplete: (data: { transmissionType: "manual" | "automatic" }) => void
  onBack: () => void
}

export function TransmissionSelection({ onComplete, onBack }: TransmissionSelectionProps) {
  const [selectedTransmission, setSelectedTransmission] = useState<"manual" | "automatic" | null>(null)

  const handleTransmissionSelect = (type: "manual" | "automatic") => {
    setSelectedTransmission(type)
    // Auto-continue after selection
    setTimeout(() => {
      onComplete({ transmissionType: type })
    }, 300)
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Välj växellåda</h2>
        <p className="text-gray-600">Vilken typ av växellåda vill du köra med?</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
        <Card
          className={`cursor-pointer transition-all hover:shadow-lg hover:scale-105 ${
            selectedTransmission === "manual" 
              ? "ring-2 ring-red-600 border-red-600 bg-red-50" 
              : "hover:border-red-300"
          }`}
          onClick={() => handleTransmissionSelect("manual")}
        >
          <CardContent className="p-6">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <Settings className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="font-semibold text-xl text-gray-800">Manuell</h3>
              <p className="text-sm text-gray-600">
                Traditionell växellåda med koppling
              </p>
              <div className="pt-2">
                <p className="text-xs text-gray-500">
                  Ger full körkortsbehörighet
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all hover:shadow-lg hover:scale-105 ${
            selectedTransmission === "automatic" 
              ? "ring-2 ring-red-600 border-red-600 bg-red-50" 
              : "hover:border-red-300"
          }`}
          onClick={() => handleTransmissionSelect("automatic")}
        >
          <CardContent className="p-6">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <Zap className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-xl text-gray-800">Automat</h3>
              <p className="text-sm text-gray-600">
                Automatisk växellåda utan koppling
              </p>
              <div className="pt-2">
                <p className="text-xs text-gray-500">
                  Begränsat till automatväxlade bilar
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-center mt-8">
        <Button
          variant="outline"
          onClick={onBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Tillbaka
        </Button>
      </div>
    </div>
  )
}
