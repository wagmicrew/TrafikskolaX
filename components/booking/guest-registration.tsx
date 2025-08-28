"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User, Mail, Phone, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

interface GuestData {
  firstName: string
  lastName: string
  personalNumber: string
  email: string
  phone: string
}

interface GuestRegistrationProps {
  onSubmit: (data: GuestData) => void
  onBack: () => void
  existingEmail?: string
}

export function GuestRegistration({ onSubmit, onBack, existingEmail }: GuestRegistrationProps) {
  const [formData, setFormData] = useState<GuestData>({
    firstName: '',
    lastName: '',
    personalNumber: '',
    email: existingEmail || '',
    phone: ''
  })
  const [showPersonalNumber, setShowPersonalNumber] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Partial<GuestData>>({})

  const handleInputChange = (field: keyof GuestData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const formatPersonalNumber = (value: string) => {
    // Remove all non-digits
    const digitsOnly = value.replace(/\D/g, '')

    // Format as YYYYMMDD-XXXX
    if (digitsOnly.length <= 8) {
      return digitsOnly
    } else {
      return `${digitsOnly.slice(0, 8)}-${digitsOnly.slice(8, 12)}`
    }
  }

  const handlePersonalNumberChange = (value: string) => {
    const formatted = formatPersonalNumber(value)
    handleInputChange('personalNumber', formatted)
  }

  const maskPersonalNumber = (pn: string) => {
    if (pn.length >= 11) {
      return `${pn.substring(0, 6)}••••`
    }
    return pn
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<GuestData> = {}

    if (!formData.firstName.trim()) newErrors.firstName = 'Förnamn krävs'
    if (!formData.lastName.trim()) newErrors.lastName = 'Efternamn krävs'

    // Validate personal number format (YYYYMMDD-XXXX)
    const pnPattern = /^\d{8}-\d{4}$/
    if (!formData.personalNumber.trim()) {
      newErrors.personalNumber = 'Personnummer krävs'
    } else if (!pnPattern.test(formData.personalNumber)) {
      newErrors.personalNumber = 'Ogiltigt format (ÅÅÅÅMMDD-XXXX)'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'E-post krävs'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Ogiltig e-postadress'
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Telefonnummer krävs'
    } else if (!/^[\d\s\-\+\(\)]{8,}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Ogiltigt telefonnummer'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const checkEmailExists = async (email: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      if (response.ok) {
        const data = await response.json()
        return data.exists
      }
      return false
    } catch (error) {
      console.error('Error checking email:', error)
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error('Vänligen rätta felen i formuläret')
      return
    }

    setLoading(true)

    try {
      // Check if email already exists
      const emailExists = await checkEmailExists(formData.email)
      if (emailExists) {
        toast.error('E-postadressen är redan registrerad')
        setLoading(false)
        return
      }

      onSubmit(formData)
    } catch (error) {
      console.error('Error submitting form:', error)
      toast.error('Ett fel uppstod')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          Studentinformation
        </CardTitle>
        <p className="text-sm text-gray-600">
          Fyll i dina uppgifter för att registrera dig för handledarutbildning
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Förnamn *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                className={errors.firstName ? 'border-red-500' : ''}
              />
              {errors.firstName && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.firstName}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Efternamn *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                className={errors.lastName ? 'border-red-500' : ''}
              />
              {errors.lastName && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.lastName}
                </p>
              )}
            </div>
          </div>

          {/* Personal Number */}
          <div className="space-y-2">
            <Label htmlFor="personalNumber">Personnummer *</Label>
            <div className="relative">
              <Input
                id="personalNumber"
                value={formData.personalNumber}
                onChange={(e) => handlePersonalNumberChange(e.target.value)}
                placeholder="ÅÅÅÅMMDD-XXXX"
                maxLength={13}
                className={errors.personalNumber ? 'border-red-500 pr-10' : 'pr-10'}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                onClick={() => setShowPersonalNumber(!showPersonalNumber)}
              >
                {showPersonalNumber ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Visas som: {maskPersonalNumber(formData.personalNumber)}
            </p>
            {errors.personalNumber && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.personalNumber}
              </p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">E-post *</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
                placeholder="din@email.com"
              />
            </div>
            {errors.email && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.email}
              </p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">Telefon *</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className={`pl-10 ${errors.phone ? 'border-red-500' : ''}`}
                placeholder="070-123 45 67"
              />
            </div>
            {errors.phone && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.phone}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              className="flex-1"
            >
              Tillbaka
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              {loading ? 'Registrerar...' : 'Fortsätt'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
