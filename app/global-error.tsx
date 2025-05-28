"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AlertTriangle, Home, Phone, RefreshCw } from "lucide-react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="sv">
      <body>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
          <div className="max-w-2xl mx-auto text-center">
            {/* Error Icon */}
            <div className="mb-8">
              <AlertTriangle className="w-24 h-24 text-red-600 mx-auto mb-4" />
              <h1 className="text-4xl sm:text-5xl font-bold text-gray-800 mb-4">Något gick fel</h1>
              <p className="text-xl text-gray-600 mb-8">Ett oväntat fel uppstod. Vi ber om ursäkt för besväret.</p>
            </div>

            {/* Error Details Card */}
            <Card className="mb-8 text-left">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-red-600 mb-3">Vad kan du göra?</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• Försök att ladda om sidan</li>
                  <li>• Kontrollera din internetanslutning</li>
                  <li>• Kontakta oss om problemet kvarstår</li>
                  <li>• Ring oss direkt på 0760-389192</li>
                </ul>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button onClick={reset} className="bg-red-600 hover:bg-red-700 flex items-center space-x-2">
                <RefreshCw className="w-4 h-4" />
                <span>Försök igen</span>
              </Button>

              <Button
                onClick={() => (window.location.href = "/")}
                variant="outline"
                className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white flex items-center space-x-2"
              >
                <Home className="w-4 h-4" />
                <span>Till startsidan</span>
              </Button>

              <Button
                onClick={() => (window.location.href = "tel:0760389192")}
                variant="outline"
                className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white flex items-center space-x-2"
              >
                <Phone className="w-4 h-4" />
                <span>Ring oss</span>
              </Button>
            </div>

            {/* Contact Info */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Kontakta Din Trafikskola</h3>
              <div className="space-y-2 text-gray-600">
                <p>📍 Östergatan 3a, 281 30 Hässleholm</p>
                <p>📞 0760-389192</p>
                <p>📧 info@dintrafikskolahlm.se</p>
              </div>
            </div>

            {/* Error ID for debugging */}
            {error.digest && <p className="text-xs text-gray-400 mt-4">Fel-ID: {error.digest}</p>}
          </div>
        </div>
      </body>
    </html>
  )
}
