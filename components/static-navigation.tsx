"use client"

import { memo } from "react"
import Link from "next/link"
import Image from "next/image"
import { Home, User, Car, Building2, Calendar } from "lucide-react"

export const StaticNavigation = memo(function StaticNavigation() {
  const menuItems = [
    { href: "/", label: "Hem", icon: Home },
    { href: "/om-oss", label: "Om oss", icon: User },
    { href: "/vara-tjanster", label: "Våra Tjänster", icon: Car },
    { href: "/lokalerna", label: "Lokalerna", icon: Building2 },
    { href: "/boka-korning", label: "Boka körning", icon: Calendar },
  ]

  return (
    <header className="bg-black text-white py-4 px-6 relative z-50 shadow-lg">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="flex items-center space-x-4 hover:opacity-80 transition-opacity">
          <Image
            src="/images/din-logo.png"
            alt="Din Trafikskola Hässleholm - Körkort och körkortsutbildning"
            width={64}
            height={64}
            className="h-12 sm:h-14 md:h-16 w-auto"
          />
          <div className="flex flex-col">
            <h1
              className="text-red-600 text-xl sm:text-2xl md:text-3xl font-normal leading-tight"
              style={{ fontFamily: 'Didot, Bodoni, "Playfair Display", serif' }}
            >
              Trafikskola
            </h1>
            <h2
              className="text-red-600 text-sm sm:text-base md:text-lg font-normal leading-tight ml-6 sm:ml-8 md:ml-10 italic"
              style={{ fontFamily: 'Didot, Bodoni, "Playfair Display", serif' }}
            >
              Hässleholm
            </h2>
          </div>
        </Link>
      </div>
      
      <nav className="hidden md:block sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm mt-4">
        <div className="container mx-auto px-6">
          <div className="flex justify-center">
            <div className="flex space-x-1 py-3">
              {menuItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    <div className="flex items-center space-x-2">
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </nav>
    </header>
  )
})
