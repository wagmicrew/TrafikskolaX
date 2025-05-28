"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { User, Clock, Mail, Car, Award, Building2 } from "lucide-react"
import Link from "next/link"
import { ContactForm } from "@/components/contact-form"

export default function ServicesPage() {
  const [showContactForm, setShowContactForm] = useState(false)

  return (
    <div className="min-h-screen bg-white">
      <main className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-gray-800 mb-4">Våra Tjänster</h1>
              <p className="text-xl text-gray-600">Komplett körkortsutbildning med fokus på kvalitet och säkerhet</p>
            </div>

            {/* Service Overview */}
            <div className="mb-16">
              <Card className="p-8 bg-gradient-to-r from-red-50 to-yellow-50">
                <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
                  Din Trafikskola Hässleholm - Vår service och kundbemötande
                </h2>
                <p className="text-lg text-gray-700 text-center mb-8">
                  Som trafiklärare på Din Trafikskola Hässleholm är vårt mål att ge dig en förstklassig upplevelse och
                  bästa möjliga stöd under din resa mot körkortet.
                </p>
              </Card>
            </div>

            {/* Detailed Services */}
            <div className="grid lg:grid-cols-2 gap-8 mb-16">
              <Card className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <User className="w-8 h-8 text-red-600" />
                  <h3 className="text-xl font-bold text-gray-800">Personlig och individanpassad undervisning</h3>
                </div>
                <p className="text-gray-700">
                  Vi skräddarsyr lektionerna efter dina behov och erfarenhetsnivå för att säkerställa bästa möjliga
                  utveckling. Varje elev får en personlig utbildningsplan.
                </p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Clock className="w-8 h-8 text-red-600" />
                  <h3 className="text-xl font-bold text-gray-800">Flexibla scheman</h3>
                </div>
                <p className="text-gray-700">
                  Vi erbjuder körlektioner på tider som passar dig, inklusive kvällar och helger. Din tid är värdefull
                  och vi anpassar oss efter ditt schema.
                </p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Mail className="w-8 h-8 text-red-600" />
                  <h3 className="text-xl font-bold text-gray-800">Tydlig återkoppling</h3>
                </div>
                <p className="text-gray-700">
                  Efter varje lektion får du konstruktiv feedback för att veta vad du kan förbättra och vad du gör bra.
                  Vi dokumenterar din utveckling kontinuerligt.
                </p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Car className="w-8 h-8 text-red-600" />
                  <h3 className="text-xl font-bold text-gray-800">Moderna fordon</h3>
                </div>
                <p className="text-gray-700">
                  Våra bilar är moderna, säkra och bekväma för att ge en optimal körupplevelse. All utrustning är
                  uppdaterad och välunderhållen.
                </p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Award className="w-8 h-8 text-red-600" />
                  <h3 className="text-xl font-bold text-gray-800">Hjälp genom hela processen</h3>
                </div>
                <p className="text-gray-700">
                  Vi stöttar dig med allt från bokning av prov till att förstå myndighetskrav. Du får guidning genom
                  hela körkortsprocessen.
                </p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Building2 className="w-8 h-8 text-red-600" />
                  <h3 className="text-xl font-bold text-gray-800">Stort fokus på trafiksäkerhet</h3>
                </div>
                <p className="text-gray-700">
                  Vi lär dig inte bara att klara provet utan också att bli en säker och ansvarsfull förare. Säkerhet är
                  alltid vår högsta prioritet.
                </p>
              </Card>
            </div>

            {/* License Types */}
            <div className="mb-16">
              <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Körkortsbehörigheter vi erbjuder</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="p-6 text-center hover:shadow-lg transition-shadow">
                  <Car className="w-12 h-12 text-red-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">A-körkort</h3>
                  <p className="text-gray-600">Motorcykel - kontakta oss för vägledning med råd och tips</p>
                </Card>

                <Card className="p-6 text-center hover:shadow-lg transition-shadow">
                  <Car className="w-12 h-12 text-red-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">B-körkort</h3>
                  <p className="text-gray-600">Personbil - vårt mest populära körkort för privatpersoner</p>
                </Card>

                <Card className="p-6 text-center hover:shadow-lg transition-shadow">
                  <Award className="w-12 h-12 text-red-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Taxiförarlegitimation</h3>
                  <p className="text-gray-600">Professionell yrkesutbildning för taxiförare</p>
                </Card>

                <Card className="p-6 text-center hover:shadow-lg transition-shadow lg:col-span-3 bg-gray-50">
                  <Car className="w-12 h-12 text-red-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Övriga behörigheter</h3>
                  <p className="text-gray-600">
                    BE (personbil med släp), C (lastbil), D (buss)
                    <br />
                    Kontakta oss för vägledning med råd och tips
                  </p>
                </Card>
              </div>
            </div>

            {/* Pricing Section */}
            <div className="mb-16">
              <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
                Prislista - Din Trafikskola Hässleholm
              </h2>

              {/* Individual Lessons */}
              <div className="mb-12">
                <h3 className="text-2xl font-bold text-red-600 mb-6">Enstaka körlektion</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="p-6">
                    <h4 className="text-xl font-semibold mb-3">Körlektion</h4>
                    <p className="text-3xl font-bold text-gray-800 mb-2">580 kr</p>
                    <p className="text-gray-600">40 minuter</p>
                  </Card>

                  <Card className="p-6 bg-yellow-50 border-yellow-200">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xl font-semibold">Bedömningslektion</h4>
                      <Badge className="bg-red-600 text-white">Kampanj!</Badge>
                    </div>
                    <p className="text-3xl font-bold text-red-600 mb-2">500 kr</p>
                    <p className="text-sm text-gray-600 line-through mb-2">Ordinarie pris: 580 kr</p>
                    <p className="text-gray-700 text-sm">
                      Vi bedömer din körförmåga och rekommenderar en personlig plan för din utbildning eller innan ditt
                      körprov.
                    </p>
                  </Card>
                </div>
              </div>

              {/* Lesson Packages for Enrolled Customers */}
              <div className="mb-12">
                <h3 className="text-2xl font-bold text-red-600 mb-4">
                  Paket – Endast körlektioner (FÖR INSKRIVNA KUNDER)
                </h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className="p-6 text-center">
                    <h4 className="text-lg font-semibold mb-3 text-blue-600">Startpaketet</h4>
                    <p className="text-2xl font-bold text-gray-800 mb-2">2 750 kr</p>
                    <p className="text-sm text-green-600 font-medium mb-3">Du sparar 150 kr</p>
                    <p className="text-gray-600">5 körlektioner</p>
                  </Card>

                  <Card className="p-6 text-center">
                    <h4 className="text-lg font-semibold mb-3 text-blue-600">Smartpaketet</h4>
                    <p className="text-2xl font-bold text-gray-800 mb-2">5 500 kr</p>
                    <p className="text-sm text-green-600 font-medium mb-3">Du sparar 300 kr</p>
                    <p className="text-gray-600">10 körlektioner</p>
                  </Card>

                  <Card className="p-6 text-center">
                    <h4 className="text-lg font-semibold mb-3 text-blue-600">Pluspaketet</h4>
                    <p className="text-2xl font-bold text-gray-800 mb-2">8 000 kr</p>
                    <p className="text-sm text-green-600 font-medium mb-3">Du sparar 700 kr</p>
                    <p className="text-gray-600">15 körlektioner</p>
                  </Card>

                  <Card className="p-6 text-center bg-blue-50 border-blue-200">
                    <h4 className="text-lg font-semibold mb-3 text-blue-600">Intensivkursen</h4>
                    <p className="text-2xl font-bold text-gray-800 mb-1">11 500 kr</p>
                    <p className="text-sm text-gray-600 mb-2">med teoripaket</p>
                    <p className="text-xl font-bold text-gray-700 mb-2">10 700 kr</p>
                    <p className="text-sm text-gray-600 mb-3">utan teori</p>
                    <p className="text-sm text-green-600 font-medium mb-3">Du sparar 900 kr</p>
                    <p className="text-gray-600 text-sm">20 körlektioner + teoripaket</p>
                  </Card>
                </div>
              </div>

              {/* Regular Lesson Packages */}
              <div className="mb-12">
                <h3 className="text-2xl font-bold text-red-600 mb-6">Paket – Endast körlektioner</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className="p-6 text-center">
                    <h4 className="text-lg font-semibold mb-3">Small</h4>
                    <p className="text-2xl font-bold text-gray-800 mb-2">2 900 kr</p>
                    <p className="text-gray-600">5 körlektioner à 40 min</p>
                  </Card>

                  <Card className="p-6 text-center">
                    <h4 className="text-lg font-semibold mb-3">Medium</h4>
                    <p className="text-2xl font-bold text-gray-800 mb-2">5 800 kr</p>
                    <p className="text-gray-600">10 körlektioner à 40 min</p>
                  </Card>

                  <Card className="p-6 text-center">
                    <h4 className="text-lg font-semibold mb-3">Large</h4>
                    <p className="text-2xl font-bold text-gray-800 mb-2">8 700 kr</p>
                    <p className="text-gray-600">15 körlektioner à 40 min</p>
                  </Card>

                  <Card className="p-6 text-center">
                    <h4 className="text-lg font-semibold mb-3">XLarge</h4>
                    <p className="text-2xl font-bold text-gray-800 mb-2">11 600 kr</p>
                    <p className="text-gray-600">20 körlektioner à 40 min</p>
                  </Card>
                </div>
              </div>

              {/* Complete Training Packages */}
              <div className="mb-12">
                <h3 className="text-2xl font-bold text-red-600 mb-6">Paket med Komplett Utbildning</h3>
                <div className="grid lg:grid-cols-3 gap-6">
                  <Card className="p-6">
                    <h4 className="text-xl font-semibold mb-3 text-blue-600">Paket 1 – Startpaket</h4>
                    <p className="text-3xl font-bold text-gray-800 mb-4">10 400 kr</p>
                    <div className="space-y-2 text-sm text-gray-700">
                      <p>• 10 körlektioner à 40 min (Du sparar 300 kr)</p>
                      <p>• Inskrivningsavgift</p>
                      <p>• Introduktionsutbildning (Handledarkurs)</p>
                      <p>• Riskutbildning 1 & 2</p>
                      <p>• Teorimaterial (digitalt + bok)</p>
                      <p>• Tillgång till korkortonline.se</p>
                    </div>
                  </Card>

                  <Card className="p-6 bg-blue-50 border-blue-200">
                    <h4 className="text-xl font-semibold mb-3 text-blue-600">Paket 2 – Standardpaket</h4>
                    <p className="text-3xl font-bold text-gray-800 mb-4">12 500 kr</p>
                    <div className="space-y-2 text-sm text-gray-700">
                      <p>• 15 körlektioner à 40 min (Du sparar 700 kr)</p>
                      <p>• Inskrivningsavgift</p>
                      <p>• Introduktionsutbildning</p>
                      <p>• Riskutbildning 1 & 2</p>
                      <p>• Teorimaterial online</p>
                      <p>• korkortonline+ teoristöd</p>
                    </div>
                  </Card>

                  <Card className="p-6 bg-yellow-50 border-yellow-200">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xl font-semibold text-blue-600">Paket 3 – Intensivpaket</h4>
                      <Badge className="bg-yellow-600 text-white">Populär</Badge>
                    </div>
                    <p className="text-3xl font-bold text-gray-800 mb-4">15 900 kr</p>
                    <div className="space-y-2 text-sm text-gray-700">
                      <p>• 20 körlektioner à 40 min (Du sparar 900 kr)</p>
                      <p>• Inskrivningsavgift</p>
                      <p>• Introduktionsutbildning</p>
                      <p>• Riskutbildning 1 & 2</p>
                      <p>• Teorimaterial</p>
                      <p>• korkortonline.se</p>
                      <p>• Personlig planering & stöd hela vägen</p>
                    </div>
                  </Card>
                </div>
              </div>

              {/* Other Training */}
              <div className="mb-12">
                <h3 className="text-2xl font-bold text-red-600 mb-6">Övriga utbildningar</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card className="p-4">
                    <h4 className="font-semibold mb-2">Inskrivning inkl Teori online</h4>
                    <p className="text-xl font-bold text-gray-800">600 kr</p>
                  </Card>

                  <Card className="p-4">
                    <h4 className="font-semibold mb-2">Inskrivning inkl Teori böcker och online</h4>
                    <p className="text-xl font-bold text-gray-800">1 200 kr</p>
                  </Card>

                  <Card className="p-4">
                    <h4 className="font-semibold mb-2">Introduktionsutbildning (Handledarkurs)</h4>
                    <p className="text-xl font-bold text-gray-800">350 kr</p>
                  </Card>

                  <Card className="p-4">
                    <h4 className="font-semibold mb-2">Riskutbildning Del 1 (Riskettan)</h4>
                    <p className="text-xl font-bold text-gray-800">800 kr</p>
                  </Card>

                  <Card className="p-4">
                    <h4 className="font-semibold mb-2">Riskutbildning Del 2 (Risktvåan)</h4>
                    <p className="text-xl font-bold text-gray-800">2 200 kr</p>
                  </Card>

                  <Card className="p-4 bg-gray-50">
                    <h4 className="font-semibold mb-2">Övriga behörigheter</h4>
                    <p className="text-sm text-gray-700">A, BE, C och D - kontakta oss för tips och råd</p>
                  </Card>
                </div>
              </div>

              {/* Payment Info with Official Swish QR */}
              <div className="bg-white rounded-lg p-8 border-2 border-gray-200 shadow-lg">
                <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">Betalning</h3>

                {/* Prepayment Notice */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <p className="text-sm font-medium text-blue-800 mb-2">💡 Betalningsinformation:</p>
                  <p className="text-sm text-blue-700">
                    <strong>Enklast förhandsbetalar du din lektion på hemsidan</strong> - På plats kan vi inte ta emot
                    kontanter. Vi tar i nuläget endast swish på plats.
                  </p>
                </div>

                <div className="grid lg:grid-cols-2 gap-8 items-center">
                  <div className="text-center lg:text-left">
                    <div className="mb-6">
                      <h4 className="text-xl font-bold text-gray-800 mb-2">Betala med Swish</h4>
                      <p className="text-gray-600 mb-4">Snabbt, säkert och enkelt</p>
                      <div className="space-y-2">
                        <p className="text-lg font-semibold text-gray-800">Swish-nummer:</p>
                        <p className="text-3xl font-bold text-gray-800 tracking-wider">123 273 20 71</p>
                      </div>
                    </div>

                    {/* Responsive Contact Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                      <div className="bg-gray-50 rounded-lg p-3 text-center">
                        <p className="font-semibold text-gray-800 mb-1">📞 Telefon</p>
                        <p className="text-gray-600 text-xs sm:text-sm">0760-38 91 92</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3 text-center">
                        <p className="font-semibold text-gray-800 mb-1">📧 E-post</p>
                        <p className="text-gray-600 text-xs sm:text-sm break-all">info@dintrafikskolahlm.se</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3 text-center">
                        <p className="font-semibold text-gray-800 mb-1">🌐 Webbsida</p>
                        <p className="text-gray-600 text-xs sm:text-sm break-all">www.dintrafikskolahlm.se</p>
                      </div>
                    </div>
                  </div>

                  <div className="text-center">
                    <img
                      src="/images/swish-qr-large.png"
                      alt="Betala med Swish - QR-kod för betalning till Din Trafikskola Hässleholm, nummer 123-273 20 71"
                      className="w-full max-w-sm mx-auto rounded-lg shadow-lg"
                      width="400"
                      height="500"
                    />
                    <p className="text-sm text-gray-600 mt-3">Scanna QR-koden med Swish-appen för snabb betalning</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Special Offer */}
      <div className="bg-yellow-50 rounded-lg p-8 mb-16">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">🎯 Specialerbjudande - Bedömningslektion</h2>
          <Badge className="bg-red-600 text-white text-lg px-4 py-2 mb-6">Kampanjpris!</Badge>
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <p className="text-lg text-gray-700">
                <strong>Endast 500 kr</strong> (ordinarie pris 580 kr)
              </p>
              <p className="text-gray-700">
                En erfaren före detta trafikinspektör bedömer din körning och ger dig en personlig utvecklingsplan.
              </p>
              <p className="text-gray-700">
                <strong>Start från och med 26 maj!</strong>
              </p>
            </div>
            <div>
              <img
                src="/images/promo-flyer.jpg"
                alt="Bedömningslektion kampanj"
                className="rounded-lg shadow-md max-w-full h-auto"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="text-center bg-gray-50 rounded-lg p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Tillgänglighet och support</h2>
        <p className="text-gray-600 mb-6">
          Vi finns här för att svara på dina frågor och hjälpa dig när du behöver det. På Din Trafikskola Hässleholm är
          vi engagerade i att göra din utbildning både effektiv och inspirerande, med målet att du ska känna dig trygg
          och säker på vägen.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={() => setShowContactForm(true)} className="bg-red-600 hover:bg-red-700">
            Kontakta oss idag
          </Button>
          <Link href="/boka-korning">
            <Button
              variant="outline"
              className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white w-full sm:w-auto"
            >
              Boka din första lektion
            </Button>
          </Link>
        </div>
      </div>

      {/* Contact Form Modal */}
      <ContactForm isOpen={showContactForm} onClose={() => setShowContactForm(false)} />
    </div>
  )
}
