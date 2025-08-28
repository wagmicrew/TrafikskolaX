"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { UserPlus, User, X } from 'lucide-react'
import { toast } from 'sonner'

interface Supervisor {
  id: string
  firstName: string
  lastName: string
  personalNumber: string
  email: string
  phone: string
  relationship: string
}

interface SupervisorInfoProps {
  supervisors: Supervisor[]
  onUpdateSupervisors: (supervisors: Supervisor[]) => void
  maxSupervisors?: number
}

export function SupervisorInfo({
  supervisors,
  onUpdateSupervisors,
  maxSupervisors = 1
}: SupervisorInfoProps) {
  const [newSupervisor, setNewSupervisor] = useState<Partial<Supervisor>>({
    firstName: '',
    lastName: '',
    personalNumber: '',
    email: '',
    phone: '',
    relationship: 'familj'
  })

  const relationshipOptions = [
    { value: 'familj', label: 'Familj' },
    { value: 'vän', label: 'Vän' },
    { value: 'kollega', label: 'Kollega' },
    { value: 'annan', label: 'Annan' }
  ]

  const addSupervisor = () => {
    if (supervisors.length >= maxSupervisors) {
      toast.error(`Max ${maxSupervisors} handledare tillåtet`)
      return
    }

    if (!newSupervisor.firstName || !newSupervisor.lastName || !newSupervisor.email) {
      toast.error('Vänligen fyll i namn och e-post för handledaren')
      return
    }

    const supervisor: Supervisor = {
      id: Date.now().toString(),
      firstName: newSupervisor.firstName,
      lastName: newSupervisor.lastName,
      personalNumber: newSupervisor.personalNumber || '',
      email: newSupervisor.email,
      phone: newSupervisor.phone || '',
      relationship: newSupervisor.relationship || 'familj'
    }

    onUpdateSupervisors([...supervisors, supervisor])

    // Reset form
    setNewSupervisor({
      firstName: '',
      lastName: '',
      personalNumber: '',
      email: '',
      phone: '',
      relationship: 'familj'
    })

    toast.success('Handledare tillagd')
  }

  // Calculate pricing info
  const baseSupervisors = 1; // 1 supervisor is included
  const extraSupervisors = Math.max(0, supervisors.length - baseSupervisors);
  const totalSupervisors = supervisors.length;

  const removeSupervisor = (id: string) => {
    onUpdateSupervisors(supervisors.filter(s => s.id !== id))
    toast.success('Handledare borttagen')
  }

  const formatPersonalNumber = (value: string) => {
    const digitsOnly = value.replace(/\D/g, '')
    if (digitsOnly.length <= 8) {
      return digitsOnly
    } else {
      return `${digitsOnly.slice(0, 8)}-${digitsOnly.slice(8, 12)}`
    }
  }

  const maskPersonalNumber = (pn: string) => {
    if (pn.length >= 11) {
      return `${pn.substring(0, 6)}••••`
    }
    return pn
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          Handledareinformation
        </CardTitle>
        <p className="text-sm text-gray-600">
          1 handledare ingår. Extra handledare kostar extra.
          {extraSupervisors > 0 && (
            <span className="text-orange-600 font-medium">
              ({extraSupervisors} extra handledare tillkommer)
            </span>
          )}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Existing supervisors */}
        {supervisors.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Tillagda handledare:</h4>
            {supervisors.map((supervisor) => (
              <div key={supervisor.id} className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <p><strong>Namn:</strong> {supervisor.firstName} {supervisor.lastName}</p>
                      <p><strong>Relation:</strong> {relationshipOptions.find(r => r.value === supervisor.relationship)?.label}</p>
                      <p><strong>E-post:</strong> {supervisor.email}</p>
                      <p><strong>Telefon:</strong> {supervisor.phone || 'Ej angivet'}</p>
                      {supervisor.personalNumber && (
                        <p><strong>Personnummer:</strong> {maskPersonalNumber(supervisor.personalNumber)}</p>
                      )}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSupervisor(supervisor.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add new supervisor form */}
        {(supervisors.length === 0 || supervisors.length < maxSupervisors) && (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              Lägg till handledare
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="supervisorFirstName">Förnamn *</Label>
                <Input
                  id="supervisorFirstName"
                  value={newSupervisor.firstName || ''}
                  onChange={(e) => setNewSupervisor(prev => ({ ...prev, firstName: e.target.value }))}
                  placeholder="Förnamn"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="supervisorLastName">Efternamn *</Label>
                <Input
                  id="supervisorLastName"
                  value={newSupervisor.lastName || ''}
                  onChange={(e) => setNewSupervisor(prev => ({ ...prev, lastName: e.target.value }))}
                  placeholder="Efternamn"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="supervisorEmail">E-post *</Label>
                <Input
                  id="supervisorEmail"
                  type="email"
                  value={newSupervisor.email || ''}
                  onChange={(e) => setNewSupervisor(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="email@exempel.se"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="supervisorPhone">Telefon</Label>
                <Input
                  id="supervisorPhone"
                  value={newSupervisor.phone || ''}
                  onChange={(e) => setNewSupervisor(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="070-123 45 67"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="supervisorPersonalNumber">Personnummer</Label>
                <Input
                  id="supervisorPersonalNumber"
                  value={newSupervisor.personalNumber || ''}
                  onChange={(e) => setNewSupervisor(prev => ({
                    ...prev,
                    personalNumber: formatPersonalNumber(e.target.value)
                  }))}
                  placeholder="ÅÅÅÅMMDD-XXXX"
                  maxLength={13}
                />
                {newSupervisor.personalNumber && (
                  <p className="text-xs text-gray-500">
                    Visas som: {maskPersonalNumber(newSupervisor.personalNumber)}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="supervisorRelationship">Relation</Label>
                <Select
                  value={newSupervisor.relationship || 'familj'}
                  onValueChange={(value) => setNewSupervisor(prev => ({ ...prev, relationship: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {relationshipOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              type="button"
              onClick={addSupervisor}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Lägg till handledare
            </Button>
          </div>
        )}

        {supervisors.length >= maxSupervisors && (
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <p className="text-sm text-yellow-800">
              <strong>Max antal handledare nått:</strong> Du kan lägga till max {maxSupervisors} handledare totalt.
              {supervisors.length > 1 && (
                <span className="block mt-1">
                  Observera: {extraSupervisors} extra handledare tillkommer i priset.
                </span>
              )}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
