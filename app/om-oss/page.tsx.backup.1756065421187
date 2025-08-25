"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ContactForm } from "@/components/contact-form"
import Link from "next/link"

export default function AboutPage() {
  const [showContactForm, setShowContactForm] = useState(false)

  return (
    <div className="min-h-screen bg-white">
      <main className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-gray-800 mb-4">Om oss</h1>
              <p className="text-xl text-gray-600">Lär känna teamet bakom Din Trafikskola Hässleholm</p>
            </div>

            {/* Main Content */}
            <div className="grid lg:grid-cols-2 gap-12 items-start mb-16">
              <div className="space-y-6">
                <Card className="p-6">
                  <h2 className="text-2xl font-bold text-red-600 mb-4">Vår expertis och erfarenhet</h2>
                  <div className="space-y-4 text-gray-700">
                    <p>
                      Våra personal är väl utbildad inom trafiken som <strong>Utbildningsledare</strong>,{" "}
                      <strong>Trafiklärare</strong> och erfaren <strong>provförrättare</strong> samt yrkesförare.
                    </p>
                    <p>
                      Med flera års erfarenhet inom trafikbranschen har jag haft förmånen att arbeta som trafiklärare
                      och tidigare som <strong>trafikinspektör</strong>. Mitt yrkesliv har varit dedikerat till att
                      hjälpa elever nå sina körkortsmål och att bidra till en säkrare trafikmiljö.
                    </p>
                    <p>
                      Som provförrättare har jag haft ansvar för körprov inom{" "}
                      <strong>samtliga körkortsbehörigheter</strong>: A, B, B96, BE, C, D och TAXI. Detta har gett mig
                      en djup förståelse för de krav och färdigheter som krävs för att bli en trygg och säker förare,
                      oavsett om det gäller personbil, motorcykel eller tunga fordon.
                    </p>
                  </div>
                </Card>

                <Card className="p-6">
                  <h2 className="text-2xl font-bold text-red-600 mb-4">Vår pedagogiska approach</h2>
                  <div className="space-y-4 text-gray-700">
                    <p>
                      I rollen som trafiklärare kombinerar jag min pedagogiska kompetens med min gedigna erfarenhet.
                      Mitt mål är att varje elev ska känna sig <strong>trygg</strong>, <strong>inspirerad</strong> och{" "}
                      <strong>väl förberedd</strong> inför såväl körprovet som framtida trafikvardag.
                    </p>
                    <p>
                      Jag strävar efter att anpassa undervisningen efter varje individs behov, så att alla får de bästa
                      förutsättningarna för att lyckas.
                    </p>
                    <p>
                      Med en passion för trafiksäkerhet och lärande ser jag fram emot att hjälpa dig på vägen mot ditt
                      körkort och att bidra till din utveckling som en säker och ansvarstagande förare.
                    </p>
                  </div>
                </Card>
              </div>

              <div className="space-y-6">
                <Image
                  src="/images/storefront.jpg"
                  alt="Din Trafikskola Hässleholm lokaler"
                  width={600}
                  height={400}
                  className="rounded-lg shadow-lg w-full"
                  priority={false}
                />

                <Card className="p-6 bg-yellow-50">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Referens och kvalitet</h3>
                  <div className="space-y-3 text-gray-700">
                    <p className="italic">
                      &quot;Enligt tidigare tjänstgöringsintyg från Trafikverket har vi uppfyllt arbetsuppgifter med{" "}
                      <strong>mycket gott resultat</strong> och erhållit uppskattning från kollegor och kunder.&quot;
                    </p>
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="text-xl font-bold text-red-600 mb-4">Våra värderingar</h3>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <span className="text-white text-sm">✓</span>
                      </div>
                      <p className="text-gray-700">
                        <strong>Säkerhet först</strong> - Trafiksäkerhet är vår högsta prioritet
                      </p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <span className="text-white text-sm">✓</span>
                      </div>
                      <p className="text-gray-700">
                        <strong>Personlig utveckling</strong> - Varje elev är unik och får individuell uppmärksamhet
                      </p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <span className="text-white text-sm">✓</span>
                      </div>
                      <p className="text-gray-700">
                        <strong>Professionalism</strong> - Hög kvalitet i allt vi gör
                      </p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <span className="text-white text-sm">✓</span>
                      </div>
                      <p className="text-gray-700">
                        <strong>Tillgänglighet</strong> - Vi finns här för dig när du behöver oss
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="text-xl font-bold text-red-600 mb-4">Våra tjänster</h3>
                  <div>
                    <h3 className="text-lg font-semibold text-red-600 mb-3">Våra tjänster:</h3>
                    <ul className="space-y-2 text-gray-700">
                      <li>• B-körkort (personbil)</li>
                      <li>• Bedömningslektion (500 kr)</li>
                      <li>• Taxiförarlegitimation</li>
                      <li>• Övriga behörigheter: A, BE, C, D (kontakta oss för vägledning)</li>
                    </ul>
                  </div>
                </Card>
              </div>
            </div>

            {/* CTA Section */}
            <div className="text-center bg-gray-50 rounded-lg p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Redo att börja din körkortsresa?</h2>
              <p className="text-gray-600 mb-6">
                Kontakta oss idag för att diskutera dina behov och boka din första lektion.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button onClick={() => setShowContactForm(true)} className="bg-red-600 hover:bg-red-700">
                  Kontakta oss
                </Button>
                <Link href="/boka-korning">
                  <Button
                    variant="outline"
                    className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white w-full sm:w-auto"
                  >
                    Boka körning
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Contact Form Modal */}
      <ContactForm isOpen={showContactForm} onClose={() => setShowContactForm(false)} />
    </div>
  )
}
