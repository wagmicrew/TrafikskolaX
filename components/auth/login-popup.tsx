"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { X, LogIn, UserPlus, Mail, Phone, User, Lock, Shield, AlertCircle } from "lucide-react"
import { useAuth } from "@/lib/hooks/useAuth"

interface LoginPopupProps {
  isOpen: boolean
  onClose: () => void
  defaultTab?: 'login' | 'register'
}

export function LoginPopup({ isOpen, onClose, defaultTab = 'login' }: LoginPopupProps) {
  const [activeTab, setActiveTab] = useState(defaultTab)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const router = useRouter()
  const { login } = useAuth()

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    
    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess("Inloggning lyckades! Omdirigerar...")

        // Token is now handled via secure HTTP-only cookie
        // Use the improved login function with automatic redirection
        const token = localStorage.getItem('auth-token');
        if (token) {
          login(token);
        } else {
          // Refresh auth state to check for cookie-based authentication
          window.location.reload();
        }

        // Close popup after a short delay
        setTimeout(() => {
          onClose()
        }, 1000)
      } else {
        setError(data.error || "Inloggning misslyckades")
      }
    } catch (error) {
      setError("Ett fel uppstod. Forsok igen.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    
    const formData = new FormData(e.currentTarget)
    const firstName = formData.get("firstName") as string
    const lastName = formData.get("lastName") as string
    const email = formData.get("email") as string
    const phone = formData.get("phone") as string
    const password = formData.get("password") as string
    const confirmPassword = formData.get("confirmPassword") as string

    if (password !== confirmPassword) {
      setError("Losenorden matchar inte")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email, phone, password }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess("Registrering lyckades! Omdirigerar...")

        // Token is now handled via secure HTTP-only cookie
        // Use the improved login function with automatic redirection
        const token = localStorage.getItem('auth-token');
        if (token) {
          login(token);
        } else {
          // Refresh auth state to check for cookie-based authentication
          window.location.reload();
        }

        // Close popup after a short delay
        setTimeout(() => {
          onClose()
        }, 1000)
      } else {
        setError(data.error || "Registrering misslyckades")
      }
    } catch (error) {
      setError("Ett fel uppstod. Forsok igen.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="w-[95vw] max-w-[95vw] sm:w-[90vw] sm:max-w-[500px] md:max-w-[600px] lg:max-w-[700px] xl:max-w-[750px] max-h-[95vh] sm:max-h-[90vh] p-0 overflow-hidden border-0 bg-transparent shadow-none"
        aria-describedby="auth-description"
      >
        <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl sm:rounded-2xl shadow-2xl h-full max-h-[95vh] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 via-transparent to-blue-500/20 rounded-xl sm:rounded-2xl"></div>
          <div className="relative z-10 h-full overflow-y-auto">
            <div className="p-4 sm:p-6 md:p-8">
              <DialogHeader className="relative mb-4 sm:mb-6">
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-xl sm:text-2xl md:text-3xl font-bold text-white drop-shadow-lg pr-2">
                    {activeTab === 'login' ? 'Logga in' : 'Registrera konto'}
                  </DialogTitle>

                </div>
                <p id="auth-description" className="sr-only">
                  {activeTab === 'login'
                    ? 'Logga in på ditt konto med e-post och lösenord'
                    : 'Registrera ett nytt konto genom att fylla i formuläret nedan'
                  }
                </p>
                <div className="h-px bg-gradient-to-r from-transparent via-white/30 to-transparent mt-3 sm:mt-4"></div>
              </DialogHeader>

              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'login' | 'register')} className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-1 mb-6">
                  <TabsTrigger value="login" className="flex items-center gap-2 data-[state=active]:bg-white/20 data-[state=active]:text-white data-[state=inactive]:text-white/70 rounded-md transition-all duration-200">
                    <LogIn className="w-4 h-4" />
                    Logga in
                  </TabsTrigger>
                  <TabsTrigger value="register" className="flex items-center gap-2 data-[state=active]:bg-white/20 data-[state=active]:text-white data-[state=inactive]:text-white/70 rounded-md transition-all duration-200">
                    <UserPlus className="w-4 h-4" />
                    Registrera
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="login" className="space-y-4 sm:space-y-6">
                  {error && (
                    <div className="flex items-center gap-3 p-3 bg-red-500/20 border border-red-400/30 rounded-lg text-red-300">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span className="text-sm">{error}</span>
                    </div>
                  )}
                  
                  {success && (
                    <div className="flex items-center gap-3 p-3 bg-green-500/20 border border-green-400/30 rounded-lg text-green-300">
                      <Shield className="w-4 h-4 flex-shrink-0" />
                      <span className="text-sm">{success}</span>
                    </div>
                  )}

                  <form onSubmit={handleLogin} className="space-y-4 sm:space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="login-email" className="text-white font-medium drop-shadow-sm text-sm sm:text-base">
                        E-postadress *
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-white/60" />
                        <Input
                          id="login-email"
                          name="email"
                          type="email"
                          placeholder="din.email@exempel.se"
                          required
                          className="pl-10 bg-white/10 backdrop-blur-sm border border-white/30 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/50 transition-all duration-200 rounded-lg"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="login-password" className="text-white font-medium drop-shadow-sm text-sm sm:text-base">
                        Losenord *
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-white/60" />
                        <Input
                          id="login-password"
                          name="password"
                          type="password"
                          placeholder="Ditt losenord"
                          required
                          className="pl-10 bg-white/10 backdrop-blur-sm border border-white/30 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/50 transition-all duration-200 rounded-lg"
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50"
                    >
                      {isLoading ? (
                        <span className="inline-flex items-center gap-2">
                          <span className="animate-spin inline-block h-4 w-4 rounded-full border-2 border-white/40 border-t-white"></span>
                          Loggar in...
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2">
                          <LogIn className="w-4 h-4" />
                          Logga in
                        </span>
                      )}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="register" className="space-y-4 sm:space-y-6">
                  {error && (
                    <div className="flex items-center gap-3 p-3 bg-red-500/20 border border-red-400/30 rounded-lg text-red-300">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span className="text-sm">{error}</span>
                    </div>
                  )}
                  
                  {success && (
                    <div className="flex items-center gap-3 p-3 bg-green-500/20 border border-green-400/30 rounded-lg text-green-300">
                      <Shield className="w-4 h-4 flex-shrink-0" />
                      <span className="text-sm">{success}</span>
                    </div>
                  )}

                  <form onSubmit={handleRegister} className="space-y-4 sm:space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="register-firstName" className="text-white font-medium drop-shadow-sm text-sm sm:text-base">
                          Fornamn *
                        </Label>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-white/60" />
                          <Input
                            id="register-firstName"
                            name="firstName"
                            type="text"
                            placeholder="Fornamn"
                            required
                            className="pl-10 bg-white/10 backdrop-blur-sm border border-white/30 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/50 transition-all duration-200 rounded-lg"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="register-lastName" className="text-white font-medium drop-shadow-sm text-sm sm:text-base">
                          Efternamn *
                        </Label>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-white/60" />
                          <Input
                            id="register-lastName"
                            name="lastName"
                            type="text"
                            placeholder="Efternamn"
                            required
                            className="pl-10 bg-white/10 backdrop-blur-sm border border-white/30 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/50 transition-all duration-200 rounded-lg"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-email" className="text-white font-medium drop-shadow-sm text-sm sm:text-base">
                        E-postadress *
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-white/60" />
                        <Input
                          id="register-email"
                          name="email"
                          type="email"
                          placeholder="din.email@exempel.se"
                          required
                          className="pl-10 bg-white/10 backdrop-blur-sm border border-white/30 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/50 transition-all duration-200 rounded-lg"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-phone" className="text-white font-medium drop-shadow-sm text-sm sm:text-base">
                        Telefonnummer
                      </Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-white/60" />
                        <Input
                          id="register-phone"
                          name="phone"
                          type="tel"
                          placeholder="070-123 45 67"
                          className="pl-10 bg-white/10 backdrop-blur-sm border border-white/30 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/50 transition-all duration-200 rounded-lg"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="register-password" className="text-white font-medium drop-shadow-sm text-sm sm:text-base">
                          Losenord *
                        </Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-white/60" />
                          <Input
                            id="register-password"
                            name="password"
                            type="password"
                            placeholder="Minst 6 tecken"
                            required
                            minLength={6}
                            className="pl-10 bg-white/10 backdrop-blur-sm border border-white/30 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/50 transition-all duration-200 rounded-lg"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="register-confirmPassword" className="text-white font-medium drop-shadow-sm text-sm sm:text-base">
                          Bekrafta losenord *
                        </Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-white/60" />
                          <Input
                            id="register-confirmPassword"
                            name="confirmPassword"
                            type="password"
                            placeholder="Bekrafta losenord"
                            required
                            className="pl-10 bg-white/10 backdrop-blur-sm border border-white/30 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/50 transition-all duration-200 rounded-lg"
                          />
                        </div>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50"
                    >
                      {isLoading ? (
                        <span className="inline-flex items-center gap-2">
                          <span className="animate-spin inline-block h-4 w-4 rounded-full border-2 border-white/40 border-t-white"></span>
                          Registrerar...
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2">
                          <UserPlus className="w-4 h-4" />
                          Registrera konto
                        </span>
                      )}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
