import type React from "react"
import type { Metadata } from "next"
import { Inter, Playfair_Display } from "next/font/google"
import "./globals.css"
import { Navigation } from "@/components/navigation"

const inter = Inter({ subsets: ["latin"] })
const playfair = Playfair_Display({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Din Trafikskola Hässleholm - Körkort & Körkortsutbildning | B-körkort, Taxiförarlegitimation",
  description:
    "Hässleholms nyaste trafikskola. Professionell körkortsutbildning för B-körkort, A-körkort och taxiförarlegitimation. Bedömningslektion 500 kr. Boka idag! ☎️ 0760-389192",
  keywords: [
    "trafikskola hässleholm",
    "körkort hässleholm",
    "körkortsutbildning hässleholm",
    "b-körkort hässleholm",
    "a-körkort hässleholm",
    "taxiförarlegitimation hässleholm",
    "bedömningslektion hässleholm",
    "din trafikskola",
    "körlektioner hässleholm",
    "trafikinspektör hässleholm",
    "östergatan trafikskola",
    "körkort skåne",
    "bilkörning hässleholm",
  ].join(", "),
  authors: [{ name: "Din Trafikskola Hässleholm" }],
  creator: "Din Trafikskola Hässleholm",
  publisher: "Din Trafikskola Hässleholm",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "sv_SE",
    url: "https://dintrafikskolahlm.se",
    siteName: "Din Trafikskola Hässleholm",
    title: "Din Trafikskola Hässleholm - Körkort & Körkortsutbildning",
    description:
      "Hässleholms nyaste trafikskola. Professionell körkortsutbildning för B-körkort, A-körkort och taxiförarlegitimation. Bedömningslektion 500 kr. Boka idag!",
    images: [
      {
        url: "/images/hero-background.jpg",
        width: 1200,
        height: 630,
        alt: "Din Trafikskola Hässleholm - Körkort och körkortsutbildning",
      },
      {
        url: "/images/din-logo.png",
        width: 400,
        height: 400,
        alt: "Din Trafikskola Hässleholm Logotyp",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Din Trafikskola Hässleholm - Körkort & Körkortsutbildning",
    description:
      "Hässleholms nyaste trafikskola. Professionell körkortsutbildning för B-körkort, A-körkort och taxiförarlegitimation. Bedömningslektion 500 kr.",
    images: ["/images/hero-background.jpg"],
  },
  icons: {
    icon: [
      { url: "/images/din-logo-small.png", sizes: "32x32", type: "image/png" },
      { url: "/images/din-logo-small.png", sizes: "16x16", type: "image/png" },
    ],
    shortcut: "/images/din-logo-small.png",
    apple: [{ url: "/images/din-logo-small.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/manifest.json",
  alternates: {
    canonical: "https://dintrafikskolahlm.se",
  },
  category: "education",
  classification: "Driving School",
  other: {
    "google-site-verification": "your-google-verification-code-here",
    "msvalidate.01": "your-bing-verification-code-here",
  },
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="sv">
      <head>
        {/* Structured Data - Local Business */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "DrivingSchool",
              name: "Din Trafikskola Hässleholm",
              description:
                "Hässleholms nyaste trafikskola med professionell körkortsutbildning för B-körkort, A-körkort och taxiförarlegitimation.",
              url: "https://dintrafikskolahlm.se",
              logo: "https://dintrafikskolahlm.se/images/din-logo.png",
              image: [
                "https://dintrafikskolahlm.se/images/hero-background.jpg",
                "https://dintrafikskolahlm.se/images/storefront.jpg",
                "https://dintrafikskolahlm.se/images/promo-flyer.jpg",
              ],
              telephone: "+46760389192",
              email: "info@dintrafikskolahlm.se",
              address: {
                "@type": "PostalAddress",
                streetAddress: "Östergatan 3a",
                addressLocality: "Hässleholm",
                postalCode: "281 30",
                addressCountry: "SE",
                addressRegion: "Skåne",
              },
              geo: {
                "@type": "GeoCoordinates",
                latitude: "56.1589",
                longitude: "13.7666",
              },
              openingHours: ["Mo-Fr 08:00-18:00", "Sa 09:00-15:00"],
              priceRange: "500-2000 SEK",
              areaServed: {
                "@type": "City",
                name: "Hässleholm",
              },
              serviceArea: {
                "@type": "GeoCircle",
                geoMidpoint: {
                  "@type": "GeoCoordinates",
                  latitude: "56.1589",
                  longitude: "13.7666",
                },
                geoRadius: "50000",
              },
              hasOfferCatalog: {
                "@type": "OfferCatalog",
                name: "Körkortsutbildning",
                itemListElement: [
                  {
                    "@type": "Offer",
                    itemOffered: {
                      "@type": "Service",
                      name: "B-körkort (Personbil)",
                      description: "Komplett utbildning för B-körkort med erfarna instruktörer",
                    },
                  },
                  {
                    "@type": "Offer",
                    itemOffered: {
                      "@type": "Service",
                      name: "Bedömningslektion",
                      description: "Bedömning av dina körkunskaper av erfaren före detta trafikinspektör",
                    },
                    price: "500",
                    priceCurrency: "SEK",
                  },
                  {
                    "@type": "Offer",
                    itemOffered: {
                      "@type": "Service",
                      name: "Taxiförarlegitimation",
                      description: "Professionell yrkesutbildning för taxiförarlegitimation",
                    },
                  },
                ],
              },
              founder: {
                "@type": "Person",
                name: "Din Trafikskola Hässleholm",
                jobTitle: "Före detta trafikinspektör",
              },
              foundingDate: "2025-05-26",
              sameAs: ["https://dintrafikskolahlm.se"],
            }),
          }}
        />

        {/* Additional SEO Meta Tags */}
        <meta name="geo.region" content="SE-M" />
        <meta name="geo.placename" content="Hässleholm" />
        <meta name="geo.position" content="56.1589;13.7666" />
        <meta name="ICBM" content="56.1589, 13.7666" />

        {/* Language and Regional */}
        <meta httpEquiv="content-language" content="sv" />
        <link rel="alternate" hrefLang="sv" href="https://dintrafikskolahlm.se" />

        {/* Preconnect for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={inter.className}>
        <Navigation />
        {children}

        {/* Global Footer */}
        <footer className="bg-gray-800 text-white py-12" role="contentinfo">
          <div className="container mx-auto px-6">
            <div className="grid md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-xl font-bold mb-4">
                  <span className="whitespace-nowrap">Din&nbsp;Trafikskola&nbsp;Hässleholm</span>
                </h3>
                <p className="text-gray-300 mb-4">
                  Hässleholms nyaste trafikskola med fokus på kvalitet och personlig service.
                </p>
                <p className="text-sm text-gray-400">Webbsidan med bokning och mer information kommer snart!</p>
              </div>
              <div>
                <h4 className="text-lg font-semibold mb-4">Kontaktinformation</h4>
                <address className="space-y-2 text-gray-300 not-italic">
                  <p className="flex items-center space-x-2">
                    <span>📍</span>
                    <span>Östergatan 3a, 281 30 Hässleholm</span>
                  </p>
                  <p className="flex items-center space-x-2">
                    <span>📞</span>
                    <a href="tel:0760389192" className="hover:text-white transition-colors">
                      0760-389192
                    </a>
                  </p>
                  <p className="flex items-center space-x-2">
                    <span>📧</span>
                    <a href="mailto:info@dintrafikskolahlm.se" className="hover:text-white transition-colors">
                      info@dintrafikskolahlm.se
                    </a>
                  </p>
                </address>
              </div>
              <div>
                <h4 className="text-lg font-semibold mb-4">Öppettider</h4>
                <div className="space-y-2 text-gray-300">
                  <p>Måndag - Fredag: 08:00 - 18:00</p>
                  <p>Lördag: 09:00 - 15:00</p>
                  <p className="text-sm text-yellow-400 mt-2">* Flexibla tider efter överenskommelse</p>
                </div>
              </div>
            </div>
            <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
              <p>
                &copy; 2025 <span className="whitespace-nowrap">Din&nbsp;Trafikskola&nbsp;Hässleholm</span>. Alla
                rättigheter förbehållna.
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
