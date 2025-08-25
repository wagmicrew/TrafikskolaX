"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { User, Mail, Phone, Plus, X, AlertCircle, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Supervisor {
  id?: string
  name: string
  email: string
  phone: string
  personalNumber: string
}

interface SupervisorSelectionProps {
  sessionType: 'handledarutbildning' | 'riskettan'
  basePrice: number
  pricePerSupervisor: number
  sessionCapacity?: {
    maxParticipants: number
    currentParticipants: number
  }
  onComplete: (data: {
    studentId: string
    supervisors: Supervisor[]
    totalPrice: number
    participantCount: number
  }) => void
  onBack: () => void
}

export function SupervisorSelection({
  sessionType,
  basePrice,
  pricePerSupervisor,
  sessionCapacity,
  onComplete,
  onBack
}: SupervisorSelectionProps) {
  const [students, setStudents] = useState<Array<{ id: string; firstName: string; lastName: string; email: string }>>([])
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [supervisors, setSupervisors] = useState<Supervisor[]>([
    { name: '', email: '', phone: '', personalNumber: '' }
  ])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { toast } = useToast()

  useEffect(() => {
    fetchStudents()
  }, [])

  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/admin/students?excludeTemp=true')
      if (response.ok) {
        const data = await response.json()
        setStudents(data.students || [])
      }
    } catch (error) {
      console.error('Error fetching students:', error)
      toast({
        title: "Fel",
        description: 'Kunde inte hämta studenter',
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const addSupervisor = () => {
    // Check capacity if session capacity is provided
    if (sessionCapacity) {
      const totalParticipantsWithNewSupervisor = 1 + supervisors.length + 1; // 1 student + current supervisors + new supervisor
      const availableSpots = sessionCapacity.maxParticipants - sessionCapacity.currentParticipants;

      if (totalParticipantsWithNewSupervisor > availableSpots) {
        toast({
          title: "Inga lediga platser",
          description: `Det finns bara ${availableSpots} platser kvar. Du kan lägga till max ${availableSpots - (1 + supervisors.length)} handledare till.`,
          variant: "destructive"
        });
        return;
      }
    }

    setSupervisors([...supervisors, { name: '', email: '', phone: '', personalNumber: '' }]);
  }

  const removeSupervisor = (index: number) => {
    if (supervisors.length > 1) {
      setSupervisors(supervisors.filter((_, i) => i !== index))
    }
  }

  const updateSupervisor = (index: number, field: keyof Supervisor, value: string) => {
    const updatedSupervisors = [...supervisors]
    updatedSupervisors[index] = { ...updatedSupervisors[index], [field]: value }
    setSupervisors(updatedSupervisors)
  }

  const validateForm = () => {
    if (!selectedStudentId) {
      setError('Välj en student')
      return false
    }

    for (let i = 0; i < supervisors.length; i++) {
      const supervisor = supervisors[i]
      if (!supervisor.name.trim()) {
        setError(`Fyll i namn för handledare ${i + 1}`)
        return false
      }
      if (!supervisor.email.trim()) {
        setError(`Fyll i e-post för handledare ${i + 1}`)
        return false
      }
      if (!supervisor.phone.trim()) {
        setError(`Fyll i telefon för handledare ${i + 1}`)
        return false
      }
      if (!supervisor.personalNumber.trim()) {
        setError(`Fyll i personnummer för handledare ${i + 1}`)
        return false
      }

      // Validate Swedish personal number format (YYYYMMDD-XXXX)
      const personalNumberRegex = /^\d{6}-\d{4}$/;
      if (!personalNumberRegex.test(supervisor.personalNumber.trim())) {
        setError(`Ogiltigt personnummer format för handledare ${i + 1}. Använd format: YYYYMMDD-XXXX`)
        return false
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(supervisor.email.trim())) {
        setError(`Ogiltig e-postadress för handledare ${i + 1}`)
        return false
      }
    }

    setError('')
    return true
  }

  const handleComplete = () => {
    if (!validateForm()) return

    const participantCount = 1 + supervisors.length // 1 student + supervisors

    // First handledare is FREE, additional handledare cost extra
    const freeHandledare = 1
    const additionalHandledare = Math.max(0, supervisors.length - freeHandledare)
    const totalPrice = basePrice + (additionalHandledare * pricePerSupervisor)

    onComplete({
      studentId: selectedStudentId,
      supervisors: supervisors,
      totalPrice,
      participantCount
    })
  }

  const selectedStudent = students.find(s => s.id === selectedStudentId)

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card className="bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <User className="w-5 h-5" />
            {sessionType === 'handledarutbildning' ? 'Handledarutbildning' : 'Riskettan'} - Deltagare
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Student Selection */}
          <div className="space-y-3">
            <Label className="text-white font-medium">Student *</Label>
            <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                <SelectValue placeholder="Välj student" />
              </SelectTrigger>
              <SelectContent>
                {students.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.firstName} {student.lastName} ({student.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedStudent && (
              <div className="p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
                <p className="text-green-300 text-sm">
                  Vald student: <strong>{selectedStudent.firstName} {selectedStudent.lastName}</strong>
                </p>
              </div>
            )}
          </div>

          {/* Supervisors */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-white font-medium">
                Handledare ({supervisors.length})
              </Label>
              <Button
                type="button"
                onClick={addSupervisor}
                variant="outline"
                size="sm"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <Plus className="w-4 h-4 mr-1" />
                Lägg till handledare
              </Button>
            </div>

            {supervisors.map((supervisor, index) => (
              <Card key={index} className="bg-white/5 border border-white/10">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-white font-medium">Handledare {index + 1}</h4>
                    {supervisors.length > 1 && (
                      <Button
                        type="button"
                        onClick={() => removeSupervisor(index)}
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-white text-sm">Namn *</Label>
                      <Input
                        value={supervisor.name}
                        onChange={(e) => updateSupervisor(index, 'name', e.target.value)}
                        placeholder="Förnamn Efternamn"
                        className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white text-sm">E-post *</Label>
                      <Input
                        type="email"
                        value={supervisor.email}
                        onChange={(e) => updateSupervisor(index, 'email', e.target.value)}
                        placeholder="email@exempel.se"
                        className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-white text-sm">Telefon *</Label>
                      <Input
                        type="tel"
                        value={supervisor.phone}
                        onChange={(e) => updateSupervisor(index, 'phone', e.target.value)}
                        placeholder="070-123 45 67"
                        className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white text-sm">Personnummer *</Label>
                      <Input
                        value={supervisor.personalNumber}
                        onChange={(e) => updateSupervisor(index, 'personalNumber', e.target.value)}
                        placeholder="YYYYMMDD-XXXX"
                        className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                        required
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Price Summary */}
          <Card className="bg-white/5 border border-white/10">
            <CardContent className="p-4">
              <h4 className="text-white font-medium mb-3">Prisöversikt</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-300">Baspris (student + 1 handledare):</span>
                  <span className="text-white">{basePrice} kr</span>
                </div>
                {supervisors.length > 1 && (
                  <div className="flex justify-between">
                    <span className="text-slate-300">Extra handledare ({supervisors.length - 1} × {pricePerSupervisor} kr):</span>
                    <span className="text-white">{(supervisors.length - 1) * pricePerSupervisor} kr</span>
                  </div>
                )}
                {supervisors.length <= 1 && (
                  <div className="flex justify-between">
                    <span className="text-slate-300">Handledare:</span>
                    <span className="text-green-400">INGEN KOSTNAD</span>
                  </div>
                )}
                <div className="border-t border-white/20 pt-2 mt-2">
                  <div className="flex justify-between font-medium">
                    <span className="text-white">Totalt:</span>
                    <span className="text-green-400">{(() => {
                      // First handledare is FREE, additional handledare cost extra
                      const freeHandledare = 1
                      const additionalHandledare = Math.max(0, supervisors.length - freeHandledare)
                      return basePrice + (additionalHandledare * pricePerSupervisor)
                    })()} kr</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Deltagare:</span>
                    <span>{1 + supervisors.length} personer</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              Tillbaka
            </Button>
            <Button
              type="button"
              onClick={handleComplete}
              disabled={!selectedStudentId || supervisors.some(s => !s.name || !s.email || !s.phone)}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              Fortsätt till betalning
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
