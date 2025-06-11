"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Car, Clock, Award } from "lucide-react"
import { ContactForm } from "@/components/contact-form"

export default function HomePage() {
  const [showContactForm, setShowContactForm] = useState(false)

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Static Background Image Only */}
      <section className="static-hero-section relative min-h-screen flex items-center">
        {/* Static Background Image */}
        <div
          className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('/placeholder.svg?height=1080&width=1920&text=Hero+Background')`,
          }}
        />

        {/* Dark Overlay for Text Readability */}
        <div className="absolute inset-0 bg-black/50" />

        {/* Content Container */}
        <div className="relative z-10 w-full">
          <div className="container mx-auto px-6 text-center">
            {/* Main Heading */}
            <h2 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-8 text-white drop-shadow-2xl">
              Välkommen till{" "}
              <span className="text-yellow-400 whitespace-nowrap">Din&nbsp;Trafikskola&nbsp;Hässleholm</span>
            </h2>

            {/* Subtitle */}
            <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl mb-12 max-w-5xl mx-auto text-white drop-shadow-xl font-medium">
              Hässleholms nyaste trafikskola har öppnat sina dörrar! Få ditt körkort med professionell utbildning och
              personlig service.
            </p>

            {/* CTA Section */}
            <div className="flex flex-col items-center gap-8">
              {/* Main CTA Button */}
              <Button
                size="lg"
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white text-xl sm:text-2xl md:text-3xl px-12 sm:px-16 md:px-20 py-6 sm:py-8 md:py-10 shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 border-2 border-white/20 backdrop-blur-sm"
                onClick={() => setShowContactForm(true)}
                aria-label="Öppna kontaktformulär för att veta mer om Din Trafikskola Hässleholm"
              >
                <span className="drop-shadow-lg">Jag vill veta mer</span>
              </Button>

              {/* Phone CTA Box */}
              <div className="bg-black/30 backdrop-blur-lg border-2 border-white/30 rounded-2xl px-8 sm:px-10 md:px-12 py-4 sm:py-6 md:py-8 shadow-2xl transform hover:scale-105 transition-all duration-300">
                <p className="text-white text-lg sm:text-xl md:text-2xl mb-2 sm:mb-3 text-center font-semibold drop-shadow-lg">
                  Ring oss direkt:
                </p>
                <a
                  href="tel:0760389192"
                  className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-yellow-300 hover:text-yellow-200 transition-colors duration-200 drop-shadow-xl"
                  aria-label="Ring Din Trafikskola Hässleholm på telefonnummer 0760-389192"
                >
                  0760-389192
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Special Campaign Section */}
      <section className="py-16 bg-yellow-50" aria-labelledby="campaign-heading">
        <div className="container mx-auto px-6">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 id="campaign-heading" className="text-3xl font-bold text-gray-800 mb-4">
                🎯 Kampanj - Bedömningslektion för B-behörighet & Taxiförarlegitimation
              </h2>
              <Badge className="bg-red-600 text-white text-lg px-4 py-2">Specialerbjudande!</Badge>
            </div>

            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-white text-sm">✓</span>
                    </div>
                    <p className="text-gray-700">
                      <strong>Testa dina körkunskaper för endast 500 kr</strong> (ord. 580 kr)
                    </p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-white text-sm">✓</span>
                    </div>
                    <p className="text-gray-700">
                      En erfaren före detta trafikinspektör bedömer din körning och ger dig en personlig plan
                    </p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-white text-sm">✓</span>
                    </div>
                    <p className="text-gray-700">
                      <strong>Start från och med 26 maj!</strong>
                    </p>
                  </div>
                </div>
              </div>
              <div className="text-center">
                <img
                  src="/placeholder.svg?height=300&width=400&text=Promo+Flyer"
                  alt="Bedömningslektion kampanj - BMW trafikskola bil för körkortsutbildning"
                  className="rounded-lg shadow-md max-w-full h-auto"
                  width="400"
                  height="300"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 bg-white" aria-labelledby="services-heading">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 id="services-heading" className="text-3xl font-bold text-gray-800 mb-4">
              Våra Tjänster
            </h2>
            <p className="text-xl text-gray-600">Vi erbjuder professionell körkortsutbildning</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <CardContent className="space-y-4">
                <Car className="w-12 h-12 text-red-600 mx-auto" aria-hidden="true" />
                <h3 className="text-xl font-semibold">B-körkort</h3>
                <p className="text-gray-600">Personbil - vårt mest populära körkort</p>
              </CardContent>
            </Card>

            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <CardContent className="space-y-4">
                <Clock className="w-12 h-12 text-red-600 mx-auto" aria-hidden="true" />
                <h3 className="text-xl font-semibold">Taxiförarlegitimation</h3>
                <p className="text-gray-600">Professionell yrkesutbildning</p>
              </CardContent>
            </Card>

            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <CardContent className="space-y-4">
                <Award className="w-12 h-12 text-red-600 mx-auto" aria-hidden="true" />
                <h3 className="text-xl font-semibold">Övriga behörigheter</h3>
                <p className="text-gray-600">
                  För behörigheter såsom A BE C D
                  <br />
                  Kontakta oss för vägledning med råd och tips
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-16 bg-gray-50" aria-labelledby="why-choose-heading">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 id="why-choose-heading" className="text-3xl font-bold text-gray-800 mb-6">
                Varför välja <span className="whitespace-nowrap">Din&nbsp;Trafikskola&nbsp;Hässleholm</span>?
              </h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-sm">✓</span>
                  </div>
                  <p className="text-gray-700">
                    <strong>Erfarna instruktörer</strong> - Före detta trafikinspektör med gedigen kunskap
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-sm">✓</span>
                  </div>
                  <p className="text-gray-700">
                    <strong>Personlig utbildning</strong> - Vi anpassar undervisningen efter dina behov
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-sm">✓</span>
                  </div>
                  <p className="text-gray-700">
                    <strong>Moderna fordon</strong> - Välunderhållna bilar med senaste säkerhetsutrustningen
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-sm">✓</span>
                  </div>
                  <p className="text-gray-700">
                    <strong>Flexibla tider</strong> - Vi hjälper dig att hitta tider som passar ditt schema
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-sm">✓</span>
                  </div>
                  <p className="text-gray-700">
                    <strong>Centralt läge</strong> - Mitt i Hässleholm på Östergatan
                  </p>
                </div>
              </div>
            </div>
            <div className="text-center">
              <img
                src="/placeholder.svg?height=400&width=500&text=Storefront"
                alt="Din Trafikskola Hässleholm butik på Östergatan 3a i Hässleholm"
                className="rounded-lg shadow-lg max-w-full h-auto"
                width="500"
                height="400"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-red-600 text-white" aria-labelledby="cta-heading">
        <div className="container mx-auto px-6 text-center">
          <h2 id="cta-heading" className="text-3xl font-bold mb-4">
            Redo att börja din körkortsresa?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Kontakta oss idag för mer information eller för att boka din första lektion. Vi hjälper dig hela vägen till
            ditt körkort!
          </p>
          <div className="flex flex-col items-center gap-6">
            <Button
              size="lg"
              className="bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white/30 text-xl px-12 py-6 shadow-2xl hover:shadow-3xl transition-all duration-300"
              onClick={() => setShowContactForm(true)}
              aria-label="Öppna kontaktformulär för att veta mer"
            >
              Jag vill veta mer
            </Button>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg px-8 py-4 shadow-xl">
              <p className="text-white/90 text-lg mb-2 text-center">Ring oss direkt:</p>
              <a
                href="tel:0760389192"
                className="text-2xl font-bold text-yellow-300 hover:text-yellow-200 transition-colors duration-200"
                aria-label="Ring oss på 0760-389192"
              >
                0760-389192
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form Modal */}
      <ContactForm isOpen={showContactForm} onClose={() => setShowContactForm(false)} />
    </div>
  )
}
