"use client"

import { useState } from "react"
import Image from "next/image"
import {
  Button as FlowbiteButton,
  Card as FlowbiteCard,
  Alert,
  Badge,
  ListGroup,
  ListGroupItem
} from "flowbite-react"
import { Badge as UIBadge } from "@/components/ui/badge"
import { Car, Clock, Award, CheckCircle, MapPin, Mail, Star, Users, Calendar, Phone } from "lucide-react"
import { ContactForm } from "@/components/contact-form"

export default function HomePage() {
  const [showContactForm, setShowContactForm] = useState(false)

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Flowbite Jumbotron */}
      <section className="relative isolate z-30 min-h-screen bg-center bg-cover bg-no-repeat bg-[url('/images/hero-cars.jpg')] flex items-center">
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 z-0 bg-black/20 pointer-events-none" />

        {/* Content Container */}
        <div className="relative z-10 w-full">
          <div className="px-4 mx-auto max-w-screen-xl text-center py-24 lg:py-56">
            <div className="bg-transparent text-white border-0 shadow-none">
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

              {/* CTA buttons */}
              <div className="flex flex-col space-y-4 sm:flex-row sm:justify-center sm:space-y-0 sm:space-x-4">
                <FlowbiteButton
                  size="lg"
                  color="failure"
                  pill
                  className="shadow-2xl ring-2 ring-white/70 ring-offset-2 ring-offset-black/20 backdrop-blur-[2px] focus:outline-none focus:ring-4 focus:ring-red-300 hover:scale-[1.02] transition-transform"
                  onClick={() => setShowContactForm(true)}
                  aria-label="Öppna kontaktformulär för att veta mer om Din Trafikskola Hässleholm"
                >
                  <Mail className="w-5 h-5 mr-2" />
                  Jag vill veta mer
                </FlowbiteButton>

                <FlowbiteButton
                  size="lg"
                  color="warning"
                  pill
                  className="bg-yellow-400 text-black hover:bg-yellow-300 shadow-2xl hover:scale-[1.02] transition-transform"
                  onClick={() => window.location.href = '/boka-korning'}
                >
                  <Calendar className="w-5 h-5 mr-2" />
                  Boka tid nu
                </FlowbiteButton>
              </div>

              {/* Phone CTA - Enhanced with Flowbite styling */}
              <div className="mt-12">
                <Alert
                  color="light"
                  className="bg-white/10 backdrop-blur-lg border border-white/30 text-white max-w-md mx-auto"
                  icon={() => <Phone className="w-6 h-6 text-yellow-300" />}
                >
                  <div className="text-center">
                    <p className="text-white/95 text-xl md:text-2xl font-semibold mb-2">Ring oss direkt:</p>
                    <a
                      href="tel:0760389192"
                      className="block text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-yellow-300 hover:text-yellow-200 transition-colors duration-200 drop-shadow-xl"
                      aria-label="Ring Din Trafikskola Hässleholm på telefonnummer 0760-389192"
                    >
                      0760-389192
                    </a>
                  </div>
                </Alert>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Special Campaign Section - Flowbite Enhanced */}
      <section className="py-16 bg-gradient-to-br from-yellow-50 to-orange-50" aria-labelledby="campaign-heading">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            {/* Flowbite Alert for Campaign */}
            <Alert
              color="warning"
              className="mb-8"
              icon={() => <span className="text-2xl">🎯</span>}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <span className="font-medium">Specialerbjudande!</span>
                  <span className="ml-2">Bedömningslektion för endast 500 kr</span>
                </div>
                <Badge color="failure" size="sm">
                  Begränsad tid
                </Badge>
              </div>
            </Alert>

            {/* Flowbite Card for Campaign */}
            <FlowbiteCard className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <div className="text-center mb-8">
                <h2 id="campaign-heading" className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  Bedömningslektion Kampanj
                </h2>
                <p className="text-lg text-gray-600 mb-4">
                  B-behörighet & Taxiförarlegitimation
                </p>
                <div className="flex items-center justify-center gap-2 mb-4">
                  <span className="text-2xl font-bold text-red-600">500 kr</span>
                  <span className="text-lg text-gray-500 line-through">580 kr</span>
                  <Badge color="success" size="sm">Spara 80 kr!</Badge>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  {/* Flowbite List Group for Benefits */}
                  <ListGroup className="mb-6">
                    <ListGroupItem icon={() => <CheckCircle className="w-5 h-5 text-green-600" />}>
                      <div>
                        <span className="font-semibold">Erfaren bedömning</span>
                        <p className="text-sm text-gray-600">Före detta trafikinspektör bedömer dina körkunskaper</p>
                      </div>
                    </ListGroupItem>
                    <ListGroupItem icon={() => <CheckCircle className="w-5 h-5 text-green-600" />}>
                      <div>
                        <span className="font-semibold">Personlig plan</span>
                        <p className="text-sm text-gray-600">Får en skräddarsydd utbildningsplan</p>
                      </div>
                    </ListGroupItem>
                    <ListGroupItem icon={() => <CheckCircle className="w-5 h-5 text-green-600" />}>
                      <div>
                        <span className="font-semibold">Start från 26 maj</span>
                        <p className="text-sm text-gray-600">Börja din körkortsresa redan idag</p>
                      </div>
                    </ListGroupItem>
                  </ListGroup>

                  {/* Flowbite Button */}
                  <FlowbiteButton
                    size="lg"
                    color="failure"
                    className="w-full sm:w-auto"
                    onClick={() => setShowContactForm(true)}
                  >
                    Boka bedömningslektion nu
                  </FlowbiteButton>
                </div>

                <div className="text-center">
                  <Image
                    src="/images/promo-flyer.jpg"
                    alt="Bedömningslektion kampanj - BMW trafikskola bil för körkortsutbildning"
                    width={400}
                    height={300}
                    className="rounded-lg shadow-lg w-full h-auto object-cover"
                    priority={false}
                  />
                </div>
              </div>
            </FlowbiteCard>
          </div>
        </div>
      </section>

      {/* Services Section - Flowbite Enhanced */}
      <section className="py-16 bg-gradient-to-br from-white to-gray-50" aria-labelledby="services-heading">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 id="services-heading" className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Våra Tjänster
            </h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
              Vi erbjuder professionell körkortsutbildning för alla behörigheter
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* B-körkort Card */}
            <FlowbiteCard className="group hover:shadow-xl transition-all duration-300 hover:scale-105 border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
              <div className="text-center p-6">
                <div className="mb-4">
                  <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto group-hover:bg-blue-700 transition-colors">
                    <Car className="w-8 h-8 text-white" aria-hidden="true" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">B-körkort</h3>
                <p className="text-gray-600 mb-4">Personbil - vårt mest populära körkort</p>
              </div>
            </FlowbiteCard>

            {/* Taxiförarlegitimation Card */}
            <FlowbiteCard className="group hover:shadow-xl transition-all duration-300 hover:scale-105 border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100">
              <div className="text-center p-6">
                <div className="mb-4">
                  <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto group-hover:bg-green-700 transition-colors">
                    <Clock className="w-8 h-8 text-white" aria-hidden="true" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Taxiförarlegitimation</h3>
                <p className="text-gray-600 mb-4">Professionell yrkesutbildning</p>
              </div>
            </FlowbiteCard>

            {/* Övriga behörigheter Card */}
            <FlowbiteCard className="group hover:shadow-xl transition-all duration-300 hover:scale-105 border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 md:col-span-2 lg:col-span-1">
              <div className="text-center p-6">
                <div className="mb-4">
                  <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto group-hover:bg-purple-700 transition-colors">
                    <Award className="w-8 h-8 text-white" aria-hidden="true" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Övriga behörigheter</h3>
                <p className="text-gray-600 mb-4">
                  För behörigheter såsom A, BE, C, D
                  <br />
                  Kontakta oss för vägledning med råd och tips
                </p>
                <FlowbiteButton
                  size="sm"
                  color="purple"
                  onClick={() => setShowContactForm(true)}
                  className="mt-2"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Kontakta oss
                </FlowbiteButton>
              </div>
            </FlowbiteCard>
          </div>

          {/* Additional Services Info */}
          <div className="mt-12 text-center">
            <Alert
              color="info"
              className="max-w-3xl mx-auto"
              icon={() => <Star className="w-5 h-5" />}
            >
              <span className="font-medium">Alla våra tjänster inkluderar:</span>
              <span className="ml-2">Erfarna instruktörer • Moderna fordon • Flexibla tider • Personlig utbildning</span>
            </Alert>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section - Flowbite Timeline */}
      <section className="py-16 bg-gradient-to-br from-gray-50 to-blue-50" aria-labelledby="why-choose-heading">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 id="why-choose-heading" className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Varför välja <span className="whitespace-nowrap">Din&nbsp;Trafikskola&nbsp;Hässleholm</span>?
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Vi erbjuder professionell körkortsutbildning med fokus på kvalitet och säkerhet
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                {/* Simple benefits list */}
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">Erfarna instruktörer</h3>
                      <p className="text-gray-600">Före detta trafikinspektör med gedigen kunskap och lång erfarenhet</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Star className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">Personlig utbildning</h3>
                      <p className="text-gray-600">Vi anpassar undervisningen efter dina individuella behov och förutsättningar</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Car className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">Moderna fordon</h3>
                      <p className="text-gray-600">Välunderhållna bilar med senaste säkerhetsutrustningen och komfort</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Clock className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">Flexibla tider</h3>
                      <p className="text-gray-600">Vi hjälper dig att hitta tider som passar ditt schema och livsstil</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">Centralt läge</h3>
                      <p className="text-gray-600">Mitt i Hässleholm på Östergatan 3a - lätt att nå med kollektivtrafik</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <div className="relative">
                  <Image
                    src="/images/storefront.jpg"
                    alt="Din Trafikskola Hässleholm lokaler på Östergatan 3a i Hässleholm"
                    width={500}
                    height={400}
                    className="rounded-lg shadow-xl max-w-full h-auto"
                    priority={false}
                  />
                  {/* Flowbite Badge overlay */}
                  <Badge
                    color="success"
                    className="absolute top-4 right-4"
                    size="sm"
                  >
                    Öppet nu
                  </Badge>
                </div>

                {/* Contact info with Flowbite styling */}
                <div className="mt-6 space-y-3 text-center">
                  <div className="flex items-center justify-center gap-2 text-gray-700">
                    <MapPin className="w-4 h-4 text-red-600" />
                    <span className="text-sm">Östergatan 3a, 281 30 Hässleholm</span>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-gray-700">
                    <span className="text-sm">0760-389192</span>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-gray-700">
                    <Mail className="w-4 h-4 text-red-600" />
                    <span className="text-sm">info@dintrafikskolahlm.se</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Flowbite Jumbotron */}
      <section className="py-16 bg-gradient-to-br from-red-600 to-red-700 text-white relative overflow-hidden" aria-labelledby="cta-heading">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent"></div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          {/* Flowbite Jumbotron */}
          <div className="bg-transparent text-white border-0 shadow-none">
            <div className="text-center">
              <h2 id="cta-heading" className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Redo att börja din körkortsresa?
              </h2>
              <p className="text-lg md:text-xl mb-8 max-w-3xl mx-auto opacity-90 leading-relaxed">
                Kontakta oss idag för mer information eller för att boka din första lektion.
                Vi hjälper dig hela vägen till ditt körkort!
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-8">
                <FlowbiteButton
                  size="lg"
                  pill
                  className="bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white/30 text-xl px-12 py-6 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105"
                  onClick={() => setShowContactForm(true)}
                  aria-label="Öppna kontaktformulär för att veta mer"
                >
                  Jag vill veta mer
                </FlowbiteButton>

                <FlowbiteButton
                  size="lg"
                  color="light"
                  pill
                  className="bg-white text-red-600 hover:bg-gray-100 text-xl px-12 py-6 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105"
                  onClick={() => window.location.href = '/boka-korning'}
                >
                  Boka tid nu
                </FlowbiteButton>
              </div>

              {/* Contact info with Flowbite styling */}
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-8 py-6 shadow-xl max-w-md mx-auto">
                <p className="text-white/90 text-sm mb-3 font-medium">Ring oss direkt eller skicka ett meddelande:</p>

                <div className="space-y-3">
                  <a
                    href="tel:0760389192"
                    className="flex items-center justify-center gap-3 text-2xl font-bold text-yellow-300 hover:text-yellow-200 transition-colors"
                    aria-label="Ring Din Trafikskola Hässleholm på 0760-389192"
                  >
                    <Phone className="w-6 h-6" />
                    0760-389192
                  </a>

                  <div className="flex items-center justify-center gap-2 text-white/80 text-sm">
                    <Mail className="w-4 h-4" />
                    <span>info@dintrafikskolahlm.se</span>
                  </div>

                  <div className="flex items-center justify-center gap-2 text-white/80 text-sm">
                    <MapPin className="w-4 h-4" />
                    <span>Östergatan 3a, Hässleholm</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom padding for mobile navigation */}
      <div className="h-20 md:hidden"></div>

      {/* Contact Form Modal */}
      <ContactForm isOpen={showContactForm} onClose={() => setShowContactForm(false)} />
    </div>
  )
}
