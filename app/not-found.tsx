"use client"

import { Suspense } from 'react'
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Home, Phone, Mail, MapPin, ArrowLeft } from "lucide-react"

function NotFoundContent() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-black text-white py-4 px-6 shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          {/* Logo with custom text */}
          <Link href="/" className="flex items-center space-x-4 hover:opacity-80 transition-opacity">
            <Image
              src="/images/din-logo.png"
              alt="Din Trafikskola Hässleholm"
              width={64}
              height={64}
              className="h-12 sm:h-14 md:h-16 w-auto"
            />
            <div className="flex flex-col">
              <div
                className="text-red-600 text-xl sm:text-2xl md:text-3xl font-normal leading-tight"
                style={{ fontFamily: 'Didot, Bodoni, "Playfair Display", serif' }}
              >
                Trafikskola
              </div>
              <div
                className="text-red-600 text-sm sm:text-base md:text-lg font-normal leading-tight ml-6 sm:ml-8 md:ml-10 italic"
                style={{ fontFamily: 'Didot, Bodoni, "Playfair Display", serif' }}
              >
                Hässleholm
              </div>
            </div>
          </Link>

          {/* Contact info - responsive visibility */}
          <div className="hidden lg:flex items-center space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              <Phone className="w-4 h-4 text-red-500" />
              <span>0760-389192</span>
            </div>
          </div>

          {/* Mobile contact */}
          <div className="flex lg:hidden items-center">
            <a
              href="tel:0760389192"
              className="flex items-center space-x-2 text-red-500 hover:text-red-400 transition-colors"
            >
              <Phone className="w-4 h-4" />
              <span className="hidden sm:inline text-sm">0760-389192</span>
            </a>
          </div>
        </div>
      </header>

      {/* 404 Content */}
      <main className="container mx-auto px-6 py-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* 404 Hero */}
          <div className="mb-12">
            <div className="text-8xl sm:text-9xl font-bold text-red-600 mb-4 opacity-20">404</div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-800 mb-6">Sidan hittades inte</h1>
            <p className="text-xl sm:text-2xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Tyvärr kunde vi inte hitta sidan du letar efter. Den kan ha flyttats, tagits bort eller så skrev du fel
              adress.
            </p>
          </div>

          {/* Navigation Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
              <CardContent className="p-6 text-center">
                <Home className="w-12 h-12 text-red-600 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-xl font-semibold mb-2">Startsida</h3>
                <p className="text-gray-600 mb-4">Gå tillbaka till vår hemsida</p>
                <Link href="/">
                  <Button className="bg-red-600 hover:bg-red-700 w-full">Till startsidan</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
              <CardContent className="p-6 text-center">
                <Phone className="w-12 h-12 text-red-600 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-xl font-semibold mb-2">Ring oss</h3>
                <p className="text-gray-600 mb-4">Kontakta oss direkt</p>
                <a href="tel:0760389192">
                  <Button className="bg-red-600 hover:bg-red-700 w-full">0760-389192</Button>
                </a>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer group md:col-span-2 lg:col-span-1">
              <CardContent className="p-6 text-center">
                <Mail className="w-12 h-12 text-red-600 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-xl font-semibold mb-2">E-post</h3>
                <p className="text-gray-600 mb-4">Skicka oss ett meddelande</p>
                <a href="mailto:info@dintrafikskolahlm.se">
                  <Button className="bg-red-600 hover:bg-red-700 w-full">Skicka e-post</Button>
                </a>
              </CardContent>
            </Card>
          </div>

          {/* Quick Info */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Vad letar du efter?</h2>
            <div className="grid md:grid-cols-2 gap-6 text-left">
              <div>
                <h3 className="text-lg font-semibold text-red-600 mb-3">Våra tjänster:</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• B-körkort (personbil)</li>
                  <li>• Bedömningslektion (500 kr)</li>
                  <li>• Taxiförarlegitimation</li>
                  <li>• Övriga behörigheter: A, BE, C, D (kontakta oss för vägledning)</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-red-600 mb-3">Kontaktinformation:</h3>
                <div className="space-y-2 text-gray-700">
                  <p className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-red-500" />
                    <span>Östergatan 3a, 281 30 Hässleholm</span>
                  </p>
                  <p className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-red-500" />
                    <span>0760-389192</span>
                  </p>
                  <p className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-red-500" />
                    <span>info@dintrafikskolahlm.se</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Back Button */}
          <div className="flex justify-center">
            <Button
              onClick={() => window.history.back()}
              variant="outline"
              className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Gå tillbaka
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12 mt-16">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Din Trafikskola Hässleholm</h3>
              <p className="text-gray-300 mb-4">
                Hässleholms nyaste trafikskola med fokus på kvalitet och personlig service.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Kontaktinformation</h4>
              <div className="space-y-2 text-gray-300">
                <p className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4" />
                  <span>Östergatan 3a, 281 30 Hässleholm</span>
                </p>
                <p className="flex items-center space-x-2">
                  <Phone className="w-4 h-4" />
                  <span>0760-389192</span>
                </p>
                <p className="flex items-center space-x-2">
                  <Mail className="w-4 h-4" />
                  <span>info@dintrafikskolahlm.se</span>
                </p>
              </div>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Öppettider</h4>
              <div className="space-y-2 text-gray-300">
                <p>Kontorstider:</p>
                <p>Onsdag: 16:00 - 18:00</p>
                <p>Fredag: 14:00 - 16:00</p>
                <p className="mt-2">Körlektioner:</p>
                <p>Måndag - Fredag: 08:00 - 18:00</p>
                <p>Lördag: 09:00 - 15:00</p>
                <p className="text-sm text-yellow-400 mt-2">* Flexibla tider efter överenskommelse</p>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Din Trafikskola Hässleholm. Alla rättigheter förbehållna.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default function NotFound() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Laddar...</div>}>
      <NotFoundContent />
    </Suspense>
  )
}
