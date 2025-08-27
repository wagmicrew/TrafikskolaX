"use client"

import { useState } from "react"
import Image from "next/image"
import { Button as FlowbiteButton, Card as FlowbiteCard } from "flowbite-react"
// Removed shadcn Card in favor of Flowbite Card for this page
// import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Car, Clock, Award } from "lucide-react"
import { ContactForm } from "@/components/contact-form"

export default function HomePage() {
  const [showContactForm, setShowContactForm] = useState(false)

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Flowbite Jumbotron style, full viewport */}
      <section className="relative isolate z-30 min-h-screen bg-center bg-cover bg-no-repeat bg-[url('/images/hero-cars.jpg')] flex items-center">
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 z-0 bg-black/10 pointer-events-none" />

        {/* Content Container (Flowbite spacing) */}
        <div className="relative z-10 w-full">
          <div className="px-4 mx-auto max-w-screen-xl text-center py-24 lg:py-56">
            {/* Heading */}
            <h1 className="mb-6 text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-tight text-white drop-shadow-2xl">
              Välkommen till{" "}
              <span className="text-yellow-400 whitespace-nowrap">Din&nbsp;Trafikskola&nbsp;Hässleholm</span>
            </h1>

            {/* Subheading */}
            <p className="mb-10 text-lg md:text-xl lg:text-2xl font-medium text-gray-100 sm:px-8 lg:px-48 drop-shadow-xl">
              Hässleholms nyaste trafikskola har öppnat sina dörrar! Få ditt körkort med professionell utbildning och
              personlig service.
            </p>

            {/* CTA buttons (primary uses site red palette) */}
            <div className="flex flex-col space-y-4 sm:flex-row sm:justify-center sm:space-y-0">
              <FlowbiteButton
                size="lg"
                color="failure"
                pill
                className="shadow-2xl ring-2 ring-white/70 ring-offset-2 ring-offset-black/20 backdrop-blur-[2px] focus:outline-none focus:ring-4 focus:ring-red-300 hover:scale-[1.02] transition-transform"
                onClick={() => setShowContactForm(true)}
                aria-label="Öppna kontaktformulär för att veta mer om Din Trafikskola Hässleholm"
              >
                Jag vill veta mer
              </FlowbiteButton>
            </div>

            {/* Phone CTA - keep highly visible */}
            <div className="mt-8 inline-block bg-black/30 backdrop-blur-lg border border-white/30 rounded-2xl px-8 py-5 shadow-2xl">
              <p className="text-white/95 text-lg md:text-xl mb-1 font-semibold text-center">Ring oss direkt:</p>
              <a
                href="tel:0760389192"
                className="block text-3xl md:text-4xl lg:text-5xl font-extrabold text-yellow-300 hover:text-yellow-200 transition-colors duration-200 drop-shadow-xl"
                aria-label="Ring Din Trafikskola Hässleholm på telefonnummer 0760-389192"
              >
                0760-389192
              </a>
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
                <Image
                  src="/images/promo-flyer.jpg"
                  alt="Bedömningslektion kampanj - BMW trafikskola bil för körkortsutbildning"
                  width={400}
                  height={300}
                  className="rounded-lg shadow-md w-full h-auto object-cover"
                  style={{ maxWidth: '400px' }}
                  priority={false}
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
            <FlowbiteCard className="text-center hover:shadow-lg transition-shadow">
              <div className="space-y-4 p-6">
                <Car className="w-12 h-12 text-red-600 mx-auto" aria-hidden="true" />
                <h3 className="text-xl font-semibold">B-körkort</h3>
                <p className="text-gray-600">Personbil - vårt mest populära körkort</p>
              </div>
            </FlowbiteCard>

            <FlowbiteCard className="text-center hover:shadow-lg transition-shadow">
              <div className="space-y-4 p-6">
                <Clock className="w-12 h-12 text-red-600 mx-auto" aria-hidden="true" />
                <h3 className="text-xl font-semibold">Taxiförarlegitimation</h3>
                <p className="text-gray-600">Professionell yrkesutbildning</p>
              </div>
            </FlowbiteCard>

            <FlowbiteCard className="text-center hover:shadow-lg transition-shadow">
              <div className="space-y-4 p-6">
                <Award className="w-12 h-12 text-red-600 mx-auto" aria-hidden="true" />
                <h3 className="text-xl font-semibold">Övriga behörigheter</h3>
                <p className="text-gray-600">
                  För behörigheter såsom A, BE, C, D
                  <br />
                  Kontakta oss för vägledning med råd och tips
                </p>
              </div>
            </FlowbiteCard>
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
              <Image
                src="/images/storefront.jpg"
                alt="Din Trafikskola Hässleholm lokaler på Östergatan 3a i Hässleholm"
                width={500}
                height={400}
                className="rounded-lg shadow-lg max-w-full h-auto"
                priority={false}
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
            <FlowbiteButton
              size="lg"
              pill
              className="bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white/30 text-xl px-12 py-6 shadow-2xl hover:shadow-3xl transition-all duration-300"
              onClick={() => setShowContactForm(true)}
              aria-label="Öppna kontaktformulär för att veta mer"
            >
              Jag vill veta mer
            </FlowbiteButton>
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
