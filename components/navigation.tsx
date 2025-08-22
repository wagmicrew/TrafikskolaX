"use client"

import { useState, memo } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ContactForm } from "@/components/contact-form"
import { UserAvatarMenu } from "@/components/user-avatar-menu"
import { MapPin, Phone, Mail, Car, User, Calendar, LogIn, Building2, Home, Menu, X, HelpCircle } from "lucide-react"
import { useAuth } from "@/lib/hooks/useAuth"
import { useAuthActions } from "@/hooks/useAuthActions"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { LoginPopup } from "@/components/auth/login-popup"
import { PasswordResetPopup } from "@/components/auth/password-reset-popup"

export const Navigation = memo(function Navigation() {
  const [showContactForm, setShowContactForm] = useState(false)
  const [showLoginPopup, setShowLoginPopup] = useState(false)
  const [loginPopupTab, setLoginPopupTab] = useState<'login' | 'register'>('login')
  const [showResetPopup, setShowResetPopup] = useState(false)
  const [resetInitialEmail, setResetInitialEmail] = useState<string>("")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const { handleLogout } = useAuthActions()

  const menuItems = [
    { href: "/", label: "Hem", icon: Home },
    { href: "/om-oss", label: "Om oss", icon: User },
    { href: "/vara-tjanster", label: "Våra Tjänster", icon: Car },
    { href: "/lokalerna", label: "Lokalerna", icon: Building2 },
    { href: "/boka-korning", label: "Boka körning", icon: Calendar },
  ]

  return (
    <>
      {/* Header */}
      <header className="bg-black text-white py-4 px-6 relative z-50 shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          {/* Logo with custom text */}
          <Link href="/" className="flex items-center space-x-4 hover:opacity-80 transition-opacity">
            <Image
              src="/images/din-logo.png"
              alt="Din Trafikskola Hässleholm - Körkort och körkortsutbildning"
              width={72}
              height={72}
              className="h-12 sm:h-14 md:h-16 lg:h-18 w-auto"
            />
            <div className="flex flex-col">
              <h1
                className="text-red-600 text-xl sm:text-2xl md:text-3xl lg:text-4xl font-normal leading-tight"
                style={{ fontFamily: 'Didot, Bodoni, "Playfair Display", serif' }}
              >
                Trafikskola
              </h1>
              <div
                className="text-red-600 text-sm sm:text-base md:text-lg lg:text-xl font-normal leading-tight ml-6 sm:ml-8 md:ml-10 lg:ml-12 italic"
                style={{ fontFamily: 'Didot, Bodoni, "Playfair Display", serif' }}
              >
                Hässleholm
              </div>
            </div>
          </Link>

          {/* Desktop Contact info */}
          <div className="hidden lg:flex items-center space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-red-500" />
              <span>Östergatan 3a, 281 30 Hässleholm</span>
            </div>
            <div className="flex items-center space-x-2">
              <Phone className="w-4 h-4 text-red-500" />
              <span>0760-389192</span>
            </div>
            <div className="flex items-center space-x-2">
              <Mail className="w-4 h-4 text-red-500" />
              <span>info@dintrafikskolahlm.se</span>
            </div>
          </div>

          {/* Mobile contact and menu */}
          <div className="flex lg:hidden items-center space-x-4">
            <a
              href="tel:0760389192"
              className="flex items-center space-x-2 text-red-500 hover:text-red-400 transition-colors"
              aria-label="Ring Din Trafikskola Hässleholm på 0760-389192"
            >
              <Phone className="w-4 h-4" />
              <span className="hidden sm:inline text-sm">0760-389192</span>
            </a>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-white hover:text-red-400 transition-colors"
              aria-label="Öppna meny"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Desktop Navigation */}
      <nav className="hidden md:block sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-6">
          <div className="flex justify-center">
            <div className="flex space-x-1 py-3">
              {menuItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-2 px-4 lg:px-6 py-3 rounded-lg font-medium transition-all duration-200 whitespace-nowrap text-sm lg:text-base ${
                      isActive
                        ? "bg-red-600 text-white shadow-lg transform scale-105"
                        : "text-gray-700 hover:text-red-600 hover:bg-red-50"
                    }`}
                    aria-label={`Gå till ${item.label}`}
                  >
                    <Icon className="w-4 h-4 lg:w-5 lg:h-5" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
              {/* Dashboard/Logout Button */}
              {user ? (
                <div className="ml-4 flex items-center space-x-2">
                  <Link
                    href="/dashboard/help"
                    className="flex items-center space-x-2 px-4 lg:px-6 py-3 rounded-lg font-medium transition-all duration-200 whitespace-nowrap text-sm lg:text-base text-gray-700 hover:text-red-600 hover:bg-red-50"
                    aria-label="Hjälp"
                  >
                    <HelpCircle className="w-4 h-4 lg:w-5 lg:h-5" />
                    <span>Hjälp</span>
                  </Link>
                  <UserAvatarMenu />
                </div>
              ) : (
                <div className="ml-2 flex items-center">
                  <button
                    onClick={() => {
                      setLoginPopupTab('login')
                      setShowLoginPopup(true)
                    }}
                    className="flex items-center space-x-2 px-4 lg:px-6 py-3 rounded-lg font-medium transition-all duration-200 whitespace-nowrap text-sm lg:text-base text-gray-700 hover:text-red-600 hover:bg-red-50"
                    aria-label="Öppna Kundportal"
                  >
                    <User className="w-4 h-4 lg:w-5 lg:h-5" />
                    <span>Kundportal</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation - iOS Style */}
      <div className="md:hidden">
        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
        )}

        {/* Mobile Menu Panel */}
        <div
          className={`fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white z-[60] transform transition-transform duration-300 ease-out shadow-2xl ${
            mobileMenuOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {/* Mobile Menu Header */}
          <div className="bg-red-600 text-white p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Image src="/images/din-logo-small.png" alt="Din Trafikskola" width={32} height={32} className="h-8 w-8" />
                <span className="font-semibold text-lg">Meny</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 hover:bg-red-700 rounded-full transition-colors"
                aria-label="Stäng meny"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Mobile Menu Items */}
          <div className="py-4">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-4 px-6 py-4 text-base font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-red-50 text-red-600 border-r-4 border-red-600"
                      : "text-gray-700 hover:bg-gray-50 active:bg-gray-100"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? "text-red-600" : "text-gray-500"}`} />
                  <span>{item.label}</span>
                </Link>
              )
            })}
            {/* Mobile Login/Dashboard Button */}
            {user ? (
              <>
                                  <Link
                    href={user && user.role ? (user.role === 'admin' ? '/dashboard/admin' : user.role === 'teacher' ? '/dashboard/teacher' : '/dashboard/student') : '/dashboard'}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-4 px-6 py-4 text-base font-medium transition-all duration-200 text-gray-700 hover:bg-gray-50 active:bg-gray-100"
                  >
                  <User className="w-5 h-5 text-gray-500" />
                  <span>Dashboard</span>
                </Link>
                <Link
                  href="/dashboard/help"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center space-x-4 px-6 py-4 text-base font-medium transition-all duration-200 text-gray-700 hover:bg-gray-50 active:bg-gray-100"
                >
                  <HelpCircle className="w-5 h-5 text-gray-500" />
                  <span>Hjälp</span>
                </Link>
                <Link
                  href="/login"
                  className="flex items-center space-x-4 px-6 py-4 text-base font-medium transition-all duration-200 text-gray-700 hover:bg-gray-50 active:bg-gray-100 w-full text-left"
                >
                  <LogIn className="w-5 h-5 text-gray-500" />
                  <span>Logga ut</span>
                </Link>
              </>
            ) : (
              <div className="flex flex-col space-y-4">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-left hover:bg-gray-100"
                  onClick={(e) => {
                    e.preventDefault()
                    setMobileMenuOpen(false)
                    setLoginPopupTab('login')
                    setShowLoginPopup(true)
                  }}
                >
                  <User className="mr-2 h-4 w-4" />
                  Kundportal
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu Footer */}
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gray-50 border-t">
            <Button
              onClick={() => {
                setShowContactForm(true)
                setMobileMenuOpen(false)
              }}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-semibold"
            >
              Kontakta oss
            </Button>
            <div className="mt-4 text-center">
              <a
                href="tel:0760389192"
                className="text-red-600 font-semibold text-lg hover:text-red-700 transition-colors"
              >
                📞 0760-389192
              </a>
            </div>
          </div>
        </div>

        {/* Mobile Bottom Tab Bar - iOS Style */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30 safe-area-pb">
          <div className="grid grid-cols-5 h-20">
            {menuItems.slice(0, 4).map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center justify-center space-y-1 transition-all duration-200 ${
                    isActive ? "text-red-600" : "text-gray-500 active:text-red-600"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? "text-red-600" : "text-gray-500"}`} />
                  <span className="text-xs font-medium">{item.label.split(" ")[0]}</span>
                  {isActive && <div className="w-1 h-1 bg-red-600 rounded-full" />}
                </Link>
              )
            })}
            {/* Mobile Login/Dashboard Tab */}
            {user ? (
              <Link
                href={user && user.role ? (user.role === 'admin' ? '/dashboard/admin' : user.role === 'teacher' ? '/dashboard/teacher' : '/dashboard/student') : '/dashboard'}
                className="flex flex-col items-center justify-center space-y-1 transition-all duration-200 text-gray-500 active:text-red-600"
              >
                <User className="w-5 h-5 text-gray-500" />
                <span className="text-xs font-medium">Konto</span>
              </Link>
            ) : (
              <button
                onClick={() => {
                  setLoginPopupTab('login')
                  setShowLoginPopup(true)
                }}
                className="flex flex-col items-center justify-center space-y-1 transition-all duration-200 text-gray-500 active:text-red-600"
                aria-label="Öppna Kundportal"
              >
                <User className="w-5 h-5 text-gray-500" />
                <span className="text-xs font-medium">Kundportal</span>
              </button>
            )}
          </div>
        </div>

        {/* Add padding to body content for bottom tab bar */}
        <div className="pb-20" />
      </div>

      <Dialog open={showContactForm} onOpenChange={setShowContactForm}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Kontakta oss</DialogTitle>
            <DialogDescription>
              Fyll i formuläret nedan så kontaktar vi dig så snart som möjligt.
            </DialogDescription>
          </DialogHeader>
          <ContactForm isOpen={showContactForm} onClose={() => setShowContactForm(false)} />
        </DialogContent>
      </Dialog>

      <LoginPopup 
        isOpen={showLoginPopup} 
        onClose={() => setShowLoginPopup(false)} 
        defaultTab={loginPopupTab}
        onForgotPassword={(email) => {
          setResetInitialEmail(email || "")
          setShowLoginPopup(false)
          setShowResetPopup(true)
        }}
      />

      <PasswordResetPopup
        isOpen={showResetPopup}
        onClose={() => setShowResetPopup(false)}
        onBackToLogin={() => {
          setShowResetPopup(false)
          setShowLoginPopup(true)
        }}
        initialEmail={resetInitialEmail}
      />
    </>
  )
})
