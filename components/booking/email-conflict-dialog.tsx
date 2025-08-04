"use client"

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertTriangle, Mail, UserPlus } from 'lucide-react'

interface EmailConflictDialogProps {
  isOpen: boolean
  onClose: () => void
  existingEmail: string
  onUseExistingAccount: () => void
  onUseNewEmail: (newEmail: string) => void
}

export function EmailConflictDialog({
  isOpen,
  onClose,
  existingEmail,
  onUseExistingAccount,
  onUseNewEmail
}: EmailConflictDialogProps) {
  const [newEmail, setNewEmail] = useState('')
  const [isValidEmail, setIsValidEmail] = useState(false)

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
    onUseExistingAccount()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">E-postadressen finns redan</DialogTitle>
              <DialogDescription className="text-sm text-gray-600 mt-1">
                Det finns redan ett konto med e-postadressen <strong>{existingEmail}</strong>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="text-sm text-gray-700">
            Du kan antingen logga in på ditt befintliga konto eller använda en annan e-postadress för denna bokning.
          </div>

          <div className="grid grid-cols-1 gap-4">
            {/* Option 1: Use existing account */}
            <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mt-1">
                  <UserPlus className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 mb-1">Använd befintligt konto</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Bokningen kommer att kopplas till ditt befintliga konto med {existingEmail}
                  </p>
                  <Button 
                    onClick={handleUseExisting}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    Logga in och fortsätt
                  </Button>
                </div>
              </div>
            </div>

            {/* Option 2: Use different email */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mt-1">
                  <Mail className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 mb-1">Använd annan e-postadress</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Skapa bokningen med en annan e-postadress
                  </p>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="new-email" className="text-sm font-medium">
                        Ny e-postadress
                      </Label>
                      <Input
                        id="new-email"
                        type="email"
                        placeholder="din.email@exempel.se"
                        value={newEmail}
                        onChange={(e) => handleEmailChange(e.target.value)}
                        className={`mt-1 ${!isValidEmail && newEmail ? 'border-red-300 focus:border-red-500' : ''}`}
                      />
                      {!isValidEmail && newEmail && (
                        <p className="text-xs text-red-600 mt-1">
                          Ange en giltig e-postadress
                        </p>
                      )}
                    </div>
                    <Button 
                      onClick={handleUseNewEmail}
                      disabled={!isValidEmail || !newEmail}
                      className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50"
                    >
                      Fortsätt med ny e-postadress
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="sm:justify-start">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            Avbryt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
