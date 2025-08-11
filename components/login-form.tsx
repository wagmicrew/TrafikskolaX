"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { X, LogIn, UserPlus, Mail, Phone, User, Lock } from "lucide-react"
import { useAuth } from "@/lib/hooks/useAuth"

interface LoginFormProps {
  isOpen: boolean
  onClose: () => void
}

export function LoginForm({ isOpen, onClose }: LoginFormProps) {
  const [activeTab, setActiveTab] = useState("login")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [fpStep, setFpStep] = useState<'email' | 'code' | 'reset' | null>(null)
  const [fpEmail, setFpEmail] = useState("")
  const [fpCode, setFpCode] = useState("")
  const [fpNew, setFpNew] = useState("")
  const [fpConfirm, setFpConfirm] = useState("")
  const [fpBusy, setFpBusy] = useState(false)
  const [fpMsg, setFpMsg] = useState("")
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok) {
        login(data.token)
        setSuccess("Inloggning lyckades! Omdirigerar...")
        setTimeout(() => {
          onClose()
          // Redirect based on user role
          if (data.user.role === 'admin') {
            router.push('/dashboard/admin')
          } else if (data.user.role === 'teacher') {
            router.push('/dashboard/teacher')
          } else {
            router.push('/dashboard/student')
          }
        }, 1500)
      } else {
        setError(data.error || "Inloggning misslyckades")
      }
    } catch (error) {
      setError("Ett fel uppstod. Försök igen.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    
    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const firstName = formData.get("firstName") as string
    const lastName = formData.get("lastName") as string
    const phone = formData.get("phone") as string

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          email, 
          password, 
          firstName, 
          lastName, 
          phone,
          role: 'student' // Default to student role
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess("Registrering lyckades! Du kan nu logga in.")
        setTimeout(() => {
          setActiveTab("login")
          setSuccess("")
        }, 2000)
      } else {
        setError(data.error || "Registrering misslyckades")
      }
    } catch (error) {
      setError("Ett fel uppstod. Försök igen.")
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setError("")
    setSuccess("")
    setIsLoading(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-[95vw] sm:w-[90vw] sm:max-w-[500px] md:max-w-[600px] lg:max-w-[700px] xl:max-w-[750px] max-h-[95vh] sm:max-h-[90vh] p-0 overflow-hidden border-0 bg-transparent shadow-none">
        {/* Glassmorphism Container */}
        <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl sm:rounded-2xl shadow-2xl h-full max-h-[95vh] overflow-hidden">
          {/* Background gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 via-transparent to-blue-500/20 rounded-xl sm:rounded-2xl"></div>

          {/* Scrollable Content Container */}
          <div className="relative z-10 h-full overflow-y-auto">
            <div className="p-4 sm:p-6 md:p-8">
              {/* Header */}
              <DialogHeader className="relative mb-4 sm:mb-6">
                <div className="flex items-center justify-between">
                  <DialogTitle className="flex items-center space-x-2 text-xl sm:text-2xl md:text-3xl font-bold text-white drop-shadow-lg pr-2">
                    <LogIn className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    <span>Logga in</span>
                  </DialogTitle>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 transition-all duration-200 group flex-shrink-0"
                    aria-label="Stäng formulär"
                  >
                    <X className="w-4 h-4 sm:w-5 sm:h-5 text-white group-hover:scale-110 transition-transform" />
                  </button>
                </div>
                <DialogDescription className="text-white/80 drop-shadow-sm text-sm sm:text-base mt-2">
                  Logga in på ditt konto eller skapa ett nytt för att boka lektioner
                </DialogDescription>
                <div className="h-px bg-gradient-to-r from-transparent via-white/30 to-transparent mt-3 sm:mt-4"></div>
              </DialogHeader>

              <Tabs value={activeTab} onValueChange={(value) => {
                setActiveTab(value)
                resetForm()
              }} className="w-full space-y-4 sm:space-y-6">
                <TabsList className="grid w-full grid-cols-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg sm:rounded-xl p-1">
                  <TabsTrigger value="login" className="flex items-center space-x-2 text-white data-[state=active]:bg-white/20 data-[state=active]:text-white transition-all duration-200 rounded-md sm:rounded-lg">
                    <LogIn className="w-4 h-4" />
                    <span className="text-sm sm:text-base">Logga in</span>
                  </TabsTrigger>
                  <TabsTrigger value="register" className="flex items-center space-x-2 text-white data-[state=active]:bg-white/20 data-[state=active]:text-white transition-all duration-200 rounded-md sm:rounded-lg">
                    <UserPlus className="w-4 h-4" />
                    <span className="text-sm sm:text-base">Registrera</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="login" className="space-y-4 sm:space-y-6">
                  <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg sm:rounded-xl p-4 sm:p-6">
                    <div className="mb-4 sm:mb-6">
                      <h3 className="text-lg sm:text-xl font-semibold text-white drop-shadow-sm">Logga in på ditt konto</h3>
                    </div>
                    <form onSubmit={handleLogin} className="space-y-4 sm:space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-white font-medium drop-shadow-sm text-sm sm:text-base">E-postadress</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-white/60" />
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="din@email.se"
                            className="pl-10 bg-white/10 backdrop-blur-sm border border-white/30 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/50 transition-all duration-200 rounded-lg sm:rounded-xl h-10 sm:h-12 text-sm sm:text-base"
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="password" className="text-white font-medium drop-shadow-sm text-sm sm:text-base">Lösenord</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-white/60" />
                          <Input
                            id="password"
                            name="password"
                            type="password"
                            placeholder="Ditt lösenord"
                            className="pl-10 bg-white/10 backdrop-blur-sm border border-white/30 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/50 transition-all duration-200 rounded-lg sm:rounded-xl h-10 sm:h-12 text-sm sm:text-base"
                            required
                          />
                        </div>
                      </div>

                      {error && (
                        <div className="p-3 sm:p-4 bg-red-500/20 backdrop-blur-sm border border-red-400/30 rounded-lg sm:rounded-xl">
                          <p className="text-sm text-red-100 font-medium drop-shadow-sm">{error}</p>
                        </div>
                      )}

                      {success && (
                        <div className="p-3 sm:p-4 bg-green-500/20 backdrop-blur-sm border border-green-400/30 rounded-lg sm:rounded-xl">
                          <p className="text-sm text-green-100 font-medium drop-shadow-sm">{success}</p>
                        </div>
                      )}

                      <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold py-3 sm:py-4 rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none border border-red-500/30 text-sm sm:text-base"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            <span>Loggar in...</span>
                          </div>
                        ) : (
                          "Logga in"
                        )}
                      </Button>
                      <div className="text-center mt-2 text-white/90 text-sm">
                        <button
                          type="button"
                          className="underline hover:text-white"
                          onClick={() => {
                            setFpStep('email')
                            setError("")
                            setSuccess("")
                          }}
                        >
                          Glömt lösenord?
                        </button>
                      </div>
                    </form>
                  </div>


          </TabsContent>

                <TabsContent value="register" className="space-y-4 sm:space-y-6">
                  <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg sm:rounded-xl p-4 sm:p-6">
                    <div className="mb-4 sm:mb-6">
                      <h3 className="text-lg sm:text-xl font-semibold text-white drop-shadow-sm">Skapa nytt konto</h3>
                    </div>
                    <form onSubmit={handleRegister} className="space-y-4 sm:space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName" className="text-white font-medium drop-shadow-sm text-sm sm:text-base">Förnamn</Label>
                          <div className="relative">
                            <User className="absolute left-3 top-3 h-4 w-4 text-white/60" />
                            <Input
                              id="firstName"
                              name="firstName"
                              type="text"
                              placeholder="Förnamn"
                              className="pl-10 bg-white/10 backdrop-blur-sm border border-white/30 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/50 transition-all duration-200 rounded-lg sm:rounded-xl h-10 sm:h-12 text-sm sm:text-base"
                              required
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="lastName" className="text-white font-medium drop-shadow-sm text-sm sm:text-base">Efternamn</Label>
                          <div className="relative">
                            <User className="absolute left-3 top-3 h-4 w-4 text-white/60" />
                            <Input
                              id="lastName"
                              name="lastName"
                              type="text"
                              placeholder="Efternamn"
                              className="pl-10 bg-white/10 backdrop-blur-sm border border-white/30 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/50 transition-all duration-200 rounded-lg sm:rounded-xl h-10 sm:h-12 text-sm sm:text-base"
                              required
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="reg-email" className="text-white font-medium drop-shadow-sm text-sm sm:text-base">E-postadress</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-white/60" />
                          <Input
                            id="reg-email"
                            name="email"
                            type="email"
                            placeholder="din@email.se"
                            className="pl-10 bg-white/10 backdrop-blur-sm border border-white/30 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/50 transition-all duration-200 rounded-lg sm:rounded-xl h-10 sm:h-12 text-sm sm:text-base"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-white font-medium drop-shadow-sm text-sm sm:text-base">Telefonnummer</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-3 h-4 w-4 text-white/60" />
                          <Input
                            id="phone"
                            name="phone"
                            type="tel"
                            placeholder="070-123 45 67"
                            className="pl-10 bg-white/10 backdrop-blur-sm border border-white/30 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/50 transition-all duration-200 rounded-lg sm:rounded-xl h-10 sm:h-12 text-sm sm:text-base"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="reg-password" className="text-white font-medium drop-shadow-sm text-sm sm:text-base">Lösenord</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-white/60" />
                          <Input
                            id="reg-password"
                            name="password"
                            type="password"
                            placeholder="Välj ett säkert lösenord"
                            className="pl-10 bg-white/10 backdrop-blur-sm border border-white/30 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/50 transition-all duration-200 rounded-lg sm:rounded-xl h-10 sm:h-12 text-sm sm:text-base"
                            required
                          />
                        </div>
                      </div>

                      {error && (
                        <div className="p-3 sm:p-4 bg-red-500/20 backdrop-blur-sm border border-red-400/30 rounded-lg sm:rounded-xl">
                          <p className="text-sm text-red-100 font-medium drop-shadow-sm">{error}</p>
                        </div>
                      )}

                      {success && (
                        <div className="p-3 sm:p-4 bg-green-500/20 backdrop-blur-sm border border-green-400/30 rounded-lg sm:rounded-xl">
                          <p className="text-sm text-green-100 font-medium drop-shadow-sm">{success}</p>
                        </div>
                      )}

                      <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold py-3 sm:py-4 rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none border border-red-500/30 text-sm sm:text-base"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            <span>Skapar konto...</span>
                          </div>
                        ) : (
                          "Skapa konto"
                        )}
                      </Button>
                    </form>
                  </div>
                </TabsContent>
              </Tabs>

              {fpStep && (
                <div className="mt-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg sm:rounded-xl p-4 sm:p-6">
                  <h3 className="text-lg sm:text-xl font-semibold text-white drop-shadow-sm mb-2">Återställ lösenord</h3>
                  {fpMsg && (
                    <div className="mb-3 text-sm text-yellow-200">{fpMsg}</div>
                  )}

                  {fpStep === 'email' && (
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault()
                        setFpBusy(true)
                        setFpMsg("")
                        try {
                          const r = await fetch('/api/auth/forgot/start', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ email: fpEmail })
                          })
                          if (r.status === 429) {
                            setFpMsg('Vänta 2 minuter innan du begär ny kod.')
                          }
                          setFpStep('code')
                        } finally {
                          setFpBusy(false)
                        }
                      }}
                      className="space-y-3"
                    >
                      <Label className="text-white">E‑postadress</Label>
                      <Input
                        type="email"
                        value={fpEmail}
                        onChange={(e) => setFpEmail(e.target.value)}
                        placeholder="din@email.se"
                        required
                        className="bg-white/10 border-white/30 text-white"
                      />
                      <Button type="submit" disabled={fpBusy}>Skicka kod</Button>
                    </form>
                  )}

                  {fpStep === 'code' && (
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault()
                        setFpBusy(true)
                        setFpMsg("")
                        try {
                          const r = await fetch('/api/auth/forgot/verify', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ email: fpEmail, code: fpCode })
                          })
                          const d = await r.json()
                          if (d?.valid) {
                            setFpStep('reset')
                          } else {
                            setFpMsg('Fel kod – försök igen')
                          }
                        } finally {
                          setFpBusy(false)
                        }
                      }}
                      className="space-y-3"
                    >
                      <Label className="text-white">Kod (6 siffror)</Label>
                      <Input
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={fpCode}
                        onChange={(e) => setFpCode(e.target.value)}
                        placeholder="123456"
                        required
                        className="bg-white/10 border-white/30 text-white"
                      />
                      <div className="flex items-center gap-2">
                        <Button type="submit" disabled={fpBusy}>Verifiera kod</Button>
                        <Button
                          type="button"
                          variant="secondary"
                          disabled={fpBusy}
                          onClick={async () => {
                            setFpBusy(true)
                            setFpMsg("")
                            try {
                              const r = await fetch('/api/auth/forgot/start', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ email: fpEmail })
                              })
                              if (r.status === 429) {
                                setFpMsg('Du kan begära ny kod var 2:e minut.')
                              } else {
                                setFpMsg('Ny kod skickad om e‑posten finns registrerad.')
                              }
                            } finally {
                              setFpBusy(false)
                            }
                          }}
                        >Skicka om kod</Button>
                      </div>
                      <div className="text-xs text-white/80">Koden är giltig i 10 minuter.</div>
                    </form>
                  )}

                  {fpStep === 'reset' && (
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault()
                        if (fpNew.length < 6) {
                          setFpMsg('Minst 6 tecken')
                          return
                        }
                        if (fpNew !== fpConfirm) {
                          setFpMsg('Lösenorden matchar inte')
                          return
                        }
                        setFpBusy(true)
                        setFpMsg("")
                        try {
                          const r = await fetch('/api/auth/forgot/reset', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ email: fpEmail, newPassword: fpNew })
                          })
                          if (r.ok) {
                            setFpStep(null)
                            setSuccess('Lösenordet ändrat. Logga in med det nya.')
                          } else {
                            setFpMsg('Kunde inte ändra lösenordet')
                          }
                        } finally {
                          setFpBusy(false)
                        }
                      }}
                      className="space-y-3"
                    >
                      <Label className="text-white">Nytt lösenord</Label>
                      <Input
                        type="password"
                        value={fpNew}
                        onChange={(e) => setFpNew(e.target.value)}
                        required
                        className="bg-white/10 border-white/30 text-white"
                      />
                      <Label className="text-white">Bekräfta lösenord</Label>
                      <Input
                        type="password"
                        value={fpConfirm}
                        onChange={(e) => setFpConfirm(e.target.value)}
                        required
                        className="bg-white/10 border-white/30 text-white"
                      />
                      <Button type="submit" disabled={fpBusy}>Ändra lösenord</Button>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
