'use client'

import React, { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover'
import { 
  UserPlus, 
  UserMinus, 
  Info, 
  Shield, 
  Lock 
} from 'lucide-react'
import { toast } from 'sonner'

interface SupervisorInfo {
  supervisorName: string
  supervisorEmail: string
  supervisorPhone: string
  supervisorPersonalNumber: string
}

interface SupervisorInfoFormProps {
  supervisors: SupervisorInfo[]
  onSupervisorsChange: (supervisors: SupervisorInfo[]) => void
  maxSupervisors?: number
}

export function SupervisorInfoForm({ 
  supervisors, 
  onSupervisorsChange, 
  maxSupervisors = 5 
}: SupervisorInfoFormProps) {
  const [errors, setErrors] = useState<{ [key: number]: { [field: string]: string } }>({})

  const validatePersonalNumber = (personalNumber: string): boolean => {
    if (!personalNumber) return true // Optional field
    
    // Swedish personal number format: YYYYMMDD-XXXX or YYMMDD-XXXX
    const regex = /^(\d{4}|\d{2})(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])-?\d{4}$/
    return regex.test(personalNumber)
  }

  const validateSupervisor = (supervisor: SupervisorInfo, index: number): boolean => {
    const newErrors: { [field: string]: string } = {}

    if (!supervisor.supervisorName.trim()) {
      newErrors.supervisorName = 'Namn är obligatoriskt'
    }

    if (!supervisor.supervisorEmail.trim() && !supervisor.supervisorPhone.trim()) {
      newErrors.supervisorEmail = 'Antingen e-post eller telefon måste anges'
      newErrors.supervisorPhone = 'Antingen e-post eller telefon måste anges'
    }

    if (supervisor.supervisorEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(supervisor.supervisorEmail)) {
        newErrors.supervisorEmail = 'Ogiltig e-postadress'
      }
    }

    if (supervisor.supervisorPersonalNumber && !validatePersonalNumber(supervisor.supervisorPersonalNumber)) {
      newErrors.supervisorPersonalNumber = 'Ogiltigt personnummer (YYYYMMDD-XXXX)'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(prev => ({ ...prev, [index]: newErrors }))
      return false
    }

    // Clear errors for this supervisor
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[index]
      return newErrors
    })

    return true
  }

  const handleSupervisorChange = (index: number, field: keyof SupervisorInfo, value: string) => {
    const updatedSupervisors = [...supervisors]
    updatedSupervisors[index] = {
      ...updatedSupervisors[index],
      [field]: value
    }
    onSupervisorsChange(updatedSupervisors)

    // Validate on change
    validateSupervisor(updatedSupervisors[index], index)
  }

  const addSupervisor = () => {
    if (supervisors.length >= maxSupervisors) {
      toast.error(`Maximalt ${maxSupervisors} handledare tillåtna`)
      return
    }

    const newSupervisor: SupervisorInfo = {
      supervisorName: '',
      supervisorEmail: '',
      supervisorPhone: '',
      supervisorPersonalNumber: ''
    }

    onSupervisorsChange([...supervisors, newSupervisor])
  }

  const removeSupervisor = (index: number) => {
    const updatedSupervisors = supervisors.filter((_, i) => i !== index)
    onSupervisorsChange(updatedSupervisors)

    // Clear errors for removed supervisor
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[index]
      return newErrors
    })
  }

  const validateAllSupervisors = (): boolean => {
    let allValid = true
    supervisors.forEach((supervisor, index) => {
      if (!validateSupervisor(supervisor, index)) {
        allValid = false
      }
    })
    return allValid
  }

  const getError = (index: number, field: string): string => {
    return errors[index]?.[field] || ''
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-gray-900">Handledare Information</h3>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="p-1 h-auto">
                <Info className="w-4 h-4 text-blue-600" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4">
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <Shield className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Säker datalagring</h4>
                    <p className="text-sm text-gray-600">
                      All personlig information krypteras med bcrypt innan den lagras i databasen.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Lock className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Automatisk radering</h4>
                    <p className="text-sm text-gray-600">
                      Personnummer raderas automatiskt från databasen efter att lektionen är slutförd.
                    </p>
                  </div>
                </div>
                <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                  <strong>GDPR-kompatibel:</strong> Vi följer svenska dataskyddsregler och raderar känslig data så snart den inte längre behövs.
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <Button
          type="button"
          onClick={addSupervisor}
          disabled={supervisors.length >= maxSupervisors}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
        >
          <UserPlus className="w-4 h-4" />
          Lägg till handledare
        </Button>
      </div>

      {supervisors.map((supervisor, index) => (
        <Card key={index} className="border border-gray-200 bg-white">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium text-gray-900">
                Handledare {index + 1}
              </CardTitle>
              {supervisors.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeSupervisor(index)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <UserMinus className="w-4 h-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`supervisorName-${index}`} className="text-sm font-medium text-gray-700">
                  Namn *
                </Label>
                <Input
                  id={`supervisorName-${index}`}
                  type="text"
                  value={supervisor.supervisorName}
                  onChange={(e) => handleSupervisorChange(index, 'supervisorName', e.target.value)}
                  placeholder="Förnamn Efternamn"
                  className={`mt-1 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${
                    getError(index, 'supervisorName') ? 'border-red-500' : ''
                  }`}
                />
                {getError(index, 'supervisorName') && (
                  <p className="mt-1 text-sm text-red-600">{getError(index, 'supervisorName')}</p>
                )}
              </div>

              <div>
                <Label htmlFor={`supervisorPersonalNumber-${index}`} className="text-sm font-medium text-gray-700">
                  Personnummer
                </Label>
                <Input
                  id={`supervisorPersonalNumber-${index}`}
                  type="text"
                  value={supervisor.supervisorPersonalNumber}
                  onChange={(e) => handleSupervisorChange(index, 'supervisorPersonalNumber', e.target.value)}
                  placeholder="YYYYMMDD-XXXX"
                  className={`mt-1 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${
                    getError(index, 'supervisorPersonalNumber') ? 'border-red-500' : ''
                  }`}
                />
                {getError(index, 'supervisorPersonalNumber') && (
                  <p className="mt-1 text-sm text-red-600">{getError(index, 'supervisorPersonalNumber')}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Krypteras och raderas automatiskt efter lektionen
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`supervisorEmail-${index}`} className="text-sm font-medium text-gray-700">
                  E-post
                </Label>
                <Input
                  id={`supervisorEmail-${index}`}
                  type="email"
                  value={supervisor.supervisorEmail}
                  onChange={(e) => handleSupervisorChange(index, 'supervisorEmail', e.target.value)}
                  placeholder="handledare@example.com"
                  className={`mt-1 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${
                    getError(index, 'supervisorEmail') ? 'border-red-500' : ''
                  }`}
                />
                {getError(index, 'supervisorEmail') && (
                  <p className="mt-1 text-sm text-red-600">{getError(index, 'supervisorEmail')}</p>
                )}
              </div>

              <div>
                <Label htmlFor={`supervisorPhone-${index}`} className="text-sm font-medium text-gray-700">
                  Telefon
                </Label>
                <Input
                  id={`supervisorPhone-${index}`}
                  type="tel"
                  value={supervisor.supervisorPhone}
                  onChange={(e) => handleSupervisorChange(index, 'supervisorPhone', e.target.value)}
                  placeholder="070-123 45 67"
                  className={`mt-1 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${
                    getError(index, 'supervisorPhone') ? 'border-red-500' : ''
                  }`}
                />
                {getError(index, 'supervisorPhone') && (
                  <p className="mt-1 text-sm text-red-600">{getError(index, 'supervisorPhone')}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {supervisors.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <UserPlus className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>Inga handledare tillagda än</p>
          <p className="text-sm">Klicka på &quot;Lägg till handledare&quot; för att börja</p>
        </div>
      )}
    </div>
  )
}
