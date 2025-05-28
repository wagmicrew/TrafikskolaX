"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ContactForm } from "@/components/contact-form"
import { LogIn, Phone, Mail } from "lucide-react"

export default function LoginPage() {
  const [showContactForm, setShowContactForm] = useState(false)

  return (
    <div className="min-h-screen bg-white">
      <main className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-gray-800 mb-4">Inloggning</h1>
              <p className="text-xl text-gray-600">Logga in på ditt konto</p>
            </div>

            {/* Coming Soon Notice */}
            <Card className="p-8 mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <div className="text-center">
                <LogIn className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Elevportal kommer snart!</h2>
                <p className="text-gray-700 mb-6">Vi utvecklar en elevportal där du kommer att kunna:</p>
                <div className="text-left space-y-2 mb-6">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span className="text-gray-700">Boka och avboka lektioner</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span className="text-gray-700">Se din utveckling och framsteg</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span className="text-gray-700">Få feedback från lektioner</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span className="text-gray-700">Hantera dina bokningar</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span className="text-gray-700">Kommunicera med din instruktör</span>
                  </div>
                </div>
                <Badge className="bg-blue-600 text-white text-lg px-4 py-2">Lanseras inom kort</Badge>
              </div>
            </Card>

            {/* Current Contact Options */}
            <Card className="p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">Under tiden - kontakta oss direkt</h3>
              <div className="space-y-4">
                <div className="text-center">
                  <Phone className="w-8 h-8 text-red-600 mx-auto mb-2" />
                  <p className="font-semibold text-gray-800">Ring oss</p>
                  <a href="tel:0760389192" className="text-red-600 hover:text-red-700 text-lg font-semibold">
                    0760-389192
                  </a>
                </div>

                <div className="text-center border-t pt-4">
                  <Mail className="w-8 h-8 text-red-600 mx-auto mb-2" />
                  <p className="font-semibold text-gray-800 mb-3">Skicka meddelande</p>
                  <Button onClick={() => setShowContactForm(true)} className="bg-red-600 hover:bg-red-700 w-full">
                    Kontakta oss
                  </Button>
                </div>
              </div>
            </Card>

            {/* Information */}
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600">
                När elevportalen lanseras kommer alla registrerade elever att få inloggningsuppgifter via e-post.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Contact Form Modal */}
      <ContactForm isOpen={showContactForm} onClose={() => setShowContactForm(false)} />
    </div>
  )
}
