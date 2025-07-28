"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, CheckCircle, DollarSign, List } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"

interface BookingData {
  lessonType: {
    id: string
    name: string
    durationMinutes: number
    price: number
    priceStudent?: number
    salePrice?: number
  }
  transmissionType?: "manual" | "automatic" | null
  selectedDate: Date
  selectedTime: string
  totalPrice: number
}

interface BookingConfirmationProps {
  bookingData: BookingData
  user: any
  onComplete: (data: { paymentMethod: string }) => void
  onBack: () => void
}

export function BookingConfirmation({
  bookingData,
  user,
  onComplete,
  onBack
}: BookingConfirmationProps) {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { isAuthed } = useAuth()

  const handleConfirm = () => {
    if (!selectedPaymentMethod) return
    onComplete({ paymentMethod: selectedPaymentMethod })
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <CardContent>
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Bekräfta bokning</h2>
            <p className="text-lg text-gray-600">
              Granska din bokning och välj betalningsmetod
            </p>
            <div className="bg-gray-100 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <span>Lektion:</span>
                <span>{bookingData.lessonType.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Varaktighet:</span>
                <span>{bookingData.lessonType.durationMinutes} min</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Datum:</span>
                <span>{bookingData.selectedDate.toLocaleDateString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Tid:</span>
                <span>{bookingData.selectedTime}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Växellåda:</span>
                <span>{bookingData.transmissionType}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Kurspris:</span>
                <span>{bookingData.totalPrice} kr</span>
              </div>
            </div>

            <div className="mt-4 space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Betalningsmetod</h3>

              {/* Swish */}
              <div
                className={`p-4 rounded-lg cursor-pointer transition-all border ${
                  selectedPaymentMethod === "swish" ? "border-red-600 bg-red-50" : "hover:border-red-300"
                }`}
                onClick={() => setSelectedPaymentMethod("swish")}
              >
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-red-600" />
                  <span>Swish</span>
                </div>
              </div>

              {/* Credits */}
              {isAuthed && user ? (
                <div
                  className={`p-4 rounded-lg cursor-pointer transition-all border ${
                    selectedPaymentMethod === "credits" ? "border-red-600 bg-red-50" : "hover:border-red-300"
                  }`}
                  onClick={() => setSelectedPaymentMethod("credits")}
                >
                  <div className="flex items-center gap-2">
                    <List className="w-5 h-5 text-red-600" />
                    <span>Kreditpoäng</span>
                  </div>
                </div>
              ) : null}

              {/* Pay at location */}
              <div
                className={`p-4 rounded-lg cursor-pointer transition-all border ${
                  selectedPaymentMethod === "pay_at_location" ? "border-red-600 bg-red-50" : "hover:border-red-300"
                }`}
                onClick={() => setSelectedPaymentMethod("pay_at_location")}
              >
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-red-600" />
                  <span>Betala på plats</span>
                </div>
              </div>
            </div>

            <Button
              onClick={handleConfirm}
              disabled={loading || !selectedPaymentMethod}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl disabled:opacity-50 mb-4"
            >
              {loading ? "Bekräftar..." : "Bekräfta bokning"}
            </Button>
            <Button variant="outline" onClick={onBack} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Tillbaka
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
