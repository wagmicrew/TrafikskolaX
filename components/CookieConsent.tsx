"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Cookie } from "lucide-react"

export function CookieConsent() {
  const [showConsent, setShowConsent] = useState(false)

  useEffect(() => {
    const consentChoice = localStorage.getItem("cookieConsent")
    if (!consentChoice) {
      setTimeout(() => setShowConsent(true), 500)
    }
  }, [])

  const handleAccept = () => {
    localStorage.setItem("cookieConsent", "accepted")
    setShowConsent(false)
    console.log("Cookies godkända")
  }

  const handleDecline = () => {
    localStorage.setItem("cookieConsent", "declined")
    setShowConsent(false)
    console.log("Cookies avböjda")
  }

  if (!showConsent) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 md:bottom-6 md:left-6 md:right-auto z-50 max-w-sm md:max-w-md bg-white rounded-lg shadow-lg border border-gray-200 p-4 animate-in slide-in-from-bottom duration-300">
      <div className="flex items-start gap-3">
        <Cookie className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900 mb-2">
            Vi använder cookies
          </p>
          <p className="text-xs text-gray-600 mb-3">
            För att ge dig bästa möjliga upplevelse. 
            <a href="/kopvillkor#integritetspolicy" className="underline hover:text-blue-600">
              Läs mer
            </a>
          </p>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleAccept}
              className="text-xs px-3 py-1.5"
            >
              Godkänn
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDecline}
              className="text-xs px-3 py-1.5 text-gray-600 hover:text-gray-900"
            >
              Nej tack
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
