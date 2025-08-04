"use client"

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertTriangle, Mail, UserPlus, LogIn, X, Lock } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'

interface EmailConflictDialogProps {
  isOpen: boolean
  onClose: () => void
  existingEmail: string
  onUseExistingAccount: () => void
  onUseNewEmail: (newEmail: string) => void
  onLoginSuccess?: () => void
}

export function EmailConflictDialog({
  isOpen,
  onClose,
  existingEmail,
  onUseExistingAccount,
  onUseNewEmail,
  onLoginSuccess
}: EmailConflictDialogProps) {
  const [newEmail, setNewEmail] = useState('')
  const [isValidEmail, setIsValidEmail] = useState(false)
  const [showLoginForm, setShowLoginForm] = useState(false)
  const [password, setPassword] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState('')
  const { login } = useAuth()

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleEmailChange = (email: string) => {
    setNewEmail(email)
    setIsValidEmail(validateEmail(email))
  }

  const handleUseNewEmail = () => {
    if (isValidEmail) {
      onUseNewEmail(newEmail)
      setNewEmail('')
      onClose()
    }
  }

  const handleUseExisting = () => {
    setShowLoginForm(true)
  }

  const handleLogin = async () => {
    setLoginLoading(true)
    setLoginError('')
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: existingEmail, password })
      })

      const data = await response.json()

      if (response.ok) {
        login(data.token)
        setShowLoginForm(false)
        if (onLoginSuccess) onLoginSuccess()
        // Refresh the page to reload with the logged-in user
        setTimeout(() => {
          window.location.reload()
        }, 500)
      } else {
        setLoginError(data.error || 'Inloggning misslyckades')
      }
    } catch (error) {
      console.error('Login failed:', error)
      setLoginError('Kunde inte logga in. Kontrollera ditt nätverk och försök igen.')
    } finally {
      setLoginLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-[90vw] sm:max-w-[500px] md:max-w-[600px] p-0 overflow-hidden border-0 bg-transparent shadow-none" style={{ zIndex: 9999 }}>
        {/* Glassmorphism Container */}
        <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl sm:rounded-2xl shadow-2xl h-full overflow-hidden">
          {/* Background gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 via-transparent to-blue-500/20 rounded-xl sm:rounded-2xl"></div>

          {/* Content Container */}
          <div className="relative z-10 p-4 sm:p-6 md:p-8">
            {/* Header */}
            <DialogHeader className="relative mb-4 sm:mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-amber-400/30">
                    <AlertTriangle className="w-5 h-5 text-amber-300" />
                  </div>
                  <div>
                    <DialogTitle className="text-xl sm:text-2xl font-bold text-white drop-shadow-lg">
                      E-postadressen finns redan
                    </DialogTitle>
                    <DialogDescription className="text-white/80 drop-shadow-sm text-sm mt-1">
                      Det finns redan ett konto med e-postadressen <strong className="text-white">{existingEmail}</strong>
                    </DialogDescription>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 transition-all duration-200 group flex-shrink-0"
                  aria-label="Stäng dialog"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5 text-white group-hover:scale-110 transition-transform" />
                </button>
              </div>
              <div className="h-px bg-gradient-to-r from-transparent via-white/30 to-transparent mt-3 sm:mt-4"></div>
            </DialogHeader>

            <div className="space-y-4 sm:space-y-6">
              <div className="text-sm text-white/80 drop-shadow-sm">
                {showLoginForm 
                  ? "Logga in på ditt befintliga konto för att fortsätta med bokningen."
                  : "Du kan logga in på ditt befintliga konto eller använda en annan e-postadress."
                }
              </div>

              {!showLoginForm ? (
                <div className="grid grid-cols-1 gap-4">
                  {/* Option 1: Use existing account */}
                  <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg sm:rounded-xl p-4 hover:bg-white/15 transition-all duration-200">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center mt-1 border border-blue-400/30">
                        <LogIn className="w-4 h-4 text-blue-300" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-white mb-1 drop-shadow-sm">Använd befintligt konto</h4>
                        <p className="text-sm text-white/70 mb-3 drop-shadow-sm">
                          Bokningen kommer att kopplas till ditt befintliga konto med {existingEmail}
                        </p>
                        <Button 
                          onClick={handleUseExisting}
                          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg border border-blue-500/30"
                        >
                          <LogIn className="w-4 h-4 mr-2" />
                          Logga in och fortsätt
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Option 2: Use different email */}
                  <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg sm:rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center mt-1 border border-green-400/30">
                        <Mail className="w-4 h-4 text-green-300" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-white mb-1 drop-shadow-sm">Använd annan e-postadress</h4>
                        <p className="text-sm text-white/70 mb-3 drop-shadow-sm">
                          Skapa bokningen med en annan e-postadress
                        </p>
                        <div className="space-y-3">
                          <div>
                            <Label htmlFor="new-email" className="text-white font-medium drop-shadow-sm text-sm">
                              Ny e-postadress
                            </Label>
                            <Input
                              id="new-email"
                              type="email"
                              placeholder="din.email@exempel.se"
                              value={newEmail}
                              onChange={(e) => handleEmailChange(e.target.value)}
                              className={`mt-1 bg-white/10 backdrop-blur-sm border border-white/30 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/50 transition-all duration-200 rounded-lg ${!isValidEmail && newEmail ? 'border-red-400/50 focus:border-red-500/50' : ''}`}
                            />
                            {!isValidEmail && newEmail && (
                              <p className="text-xs text-red-300 mt-1 drop-shadow-sm">
                                Ange en giltig e-postadress
                              </p>
                            )}
                          </div>
                          <Button 
                            onClick={handleUseNewEmail}
                            disabled={!isValidEmail || !newEmail}
                            className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold rounded-lg border border-green-500/30 disabled:opacity-50"
                          >
                            <Mail className="w-4 h-4 mr-2" />
                            Fortsätt med ny e-postadress
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg sm:rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center mt-1 border border-red-400/30">
                      <Lock className="w-4 h-4 text-red-300" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-white mb-1 drop-shadow-sm">Logga in med ditt konto</h4>
                      <p className="text-sm text-white/70 mb-3 drop-shadow-sm">
                        Ange lösenordet för {existingEmail}
                      </p>
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="password" className="text-white font-medium drop-shadow-sm text-sm">
                            Lösenord
                          </Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-white/60" />
                            <Input
                              id="password"
                              type="password"
                              placeholder="Ditt lösenord"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              className="pl-10 mt-1 bg-white/10 backdrop-blur-sm border border-white/30 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/50 transition-all duration-200 rounded-lg"
                            />
                          </div>
                          {loginError && (
                            <p className="text-xs text-red-300 mt-1 drop-shadow-sm">
                              {loginError}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => setShowLoginForm(false)}
                            variant="outline"
                            className="flex-1 bg-white/10 border-white/30 text-white hover:bg-white/20 hover:border-white/50"
                          >
                            Tillbaka
                          </Button>
                          <Button
                            onClick={handleLogin}
                            disabled={loginLoading || !password}
                            className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold rounded-lg border border-red-500/30 disabled:opacity-50"
                          >
                            {loginLoading ? (
                              <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                <span>Loggar in...</span>
                              </div>
                            ) : (
                              <>
                                <LogIn className="w-4 h-4 mr-2" />
                                Logga in
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="mt-4 sm:mt-6 flex justify-end">
              <Button 
                variant="outline" 
                onClick={onClose}
                className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:border-white/50"
              >
                Avbryt
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
