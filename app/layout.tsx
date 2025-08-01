import type React from "react"
import type { Metadata } from "next"
import { Inter, Playfair_Display } from "next/font/google"
import "./globals.css"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { AuthProvider } from "@/lib/hooks/useAuth"
import { Toaster } from "react-hot-toast"

const inter = Inter({ subsets: ["latin"] })
const playfair = Playfair_Display({ subsets: ["latin"] })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
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
  generator: "v0.dev",
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
              openingHours: ["We 16:00-18:00", "Fr 14:00-16:00", "Mo-Fr 08:00-18:00", "Sa 09:00-15:00"],
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
        <AuthProvider>
          <Navigation />
          {children}
          <Footer />
          <Toaster position="top-right" />
        </AuthProvider>
      </body>
    </html>
  )
}
