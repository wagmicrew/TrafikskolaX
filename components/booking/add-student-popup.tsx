'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button as FBButton, Label as FBLabel, TextInput } from 'flowbite-react'
import { UserPlus, X, Save } from 'lucide-react'
import { toast } from 'sonner'

interface AddStudentPopupProps {
  isOpen: boolean
  onClose: () => void
  onStudentAdded: (student: { id: string; firstName: string; lastName: string; email: string }) => void
}

export function AddStudentPopup({ isOpen, onClose, onStudentAdded }: AddStudentPopupProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    personalNumber: ''
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate required fields
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim()) {
      toast.error('Fel: Vänligen fyll i namn och e-post')
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      toast.error('Fel: Vänligen ange en giltig e-postadress')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/admin/users/create-student', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone.trim() || undefined,
          personalNumber: formData.personalNumber.trim() || undefined
        })
      })

      if (response.ok) {
        const result = await response.json()
        
        // Call the callback with the new student data
        onStudentAdded({
          id: result.user.id,
          firstName: result.user.firstName,
          lastName: result.user.lastName,
          email: result.user.email
        })

        // Reset form
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          personalNumber: ''
        })
      } else {
        const error = await response.json()
        toast.error(`Fel: ${error.error || 'Kunde inte skapa studenten'}`)
      }
    } catch (error) {
      console.error('Error creating student:', error)
      toast.error('Fel: Ett oväntat fel uppstod')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] max-w-[95vw] sm:w-[90vw] sm:max-w-[500px] p-0 overflow-hidden border-0 bg-transparent shadow-none">
        {/* Glassmorphism Container */}
        <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl sm:rounded-2xl shadow-2xl h-full overflow-hidden">
          {/* Background gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-transparent to-purple-500/20 rounded-xl sm:rounded-2xl"></div>

          {/* Content Container */}
          <div className="relative z-10 p-4 sm:p-6">
            <DialogHeader className="relative mb-4 sm:mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-blue-400/30">
                    <UserPlus className="w-5 h-5 text-blue-300" />
                  </div>
                  <div>
                    <DialogTitle className="text-xl sm:text-2xl font-bold text-white drop-shadow-lg">
                      Lägg till ny student
                    </DialogTitle>
                    <p className="text-white/80 drop-shadow-sm text-sm mt-1">
                      Fyll i informationen för den nya eleven
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 transition-all duration-200 group flex-shrink-0"
                  aria-label="Stäng dialog"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5 text-white group-hover:scale-110 transition-transform" />
                </button>
              </div>
              <div className="h-px bg-gradient-to-r from-transparent via-white/30 to-transparent mt-3 sm:mt-4"></div>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <FBLabel htmlFor="firstName" className="text-white font-medium drop-shadow-sm text-sm mb-2 block">
                    Förnamn *
                  </FBLabel>
                  <TextInput
                    id="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    placeholder="Förnamn"
                    required
                    className="bg-white/10 backdrop-blur-sm border border-white/30 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/50 transition-all duration-200 rounded-lg"
                  />
                </div>
                <div>
                  <FBLabel htmlFor="lastName" className="text-white font-medium drop-shadow-sm text-sm mb-2 block">
                    Efternamn *
                  </FBLabel>
                  <TextInput
                    id="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    placeholder="Efternamn"
                    required
                    className="bg-white/10 backdrop-blur-sm border border-white/30 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/50 transition-all duration-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <FBLabel htmlFor="email" className="text-white font-medium drop-shadow-sm text-sm mb-2 block">
                  E-post *
                </FBLabel>
                <TextInput
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="student@example.com"
                  required
                  className="bg-white/10 backdrop-blur-sm border border-white/30 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/50 transition-all duration-200 rounded-lg"
                />
              </div>

              <div>
                <FBLabel htmlFor="phone" className="text-white font-medium drop-shadow-sm text-sm mb-2 block">
                  Telefon
                </FBLabel>
                <TextInput
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+46 70 123 45 67"
                  className="bg-white/10 backdrop-blur-sm border border-white/30 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/50 transition-all duration-200 rounded-lg"
                />
              </div>

              <div>
                <FBLabel htmlFor="personalNumber" className="text-white font-medium drop-shadow-sm text-sm mb-2 block">
                  Personnummer
                </FBLabel>
                <TextInput
                  id="personalNumber"
                  type="text"
                  value={formData.personalNumber}
                  onChange={(e) => handleInputChange('personalNumber', e.target.value)}
                  placeholder="ÅÅÅÅMMDD-XXXX"
                  className="bg-white/10 backdrop-blur-sm border border-white/30 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/50 transition-all duration-200 rounded-lg"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t border-white/10">
                <FBButton
                  type="button"
                  color="light"
                  onClick={handleClose}
                  disabled={loading}
                  className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:border-white/50"
                >
                  Avbryt
                </FBButton>
                <FBButton
                  type="submit"
                  disabled={loading}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold border border-blue-500/30"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Skapar...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Skapa student
                    </>
                  )}
                </FBButton>
              </div>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
