"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Users, UserPlus } from 'lucide-react'
import { toast } from 'sonner'

interface Student {
  id: string
  firstName: string
  lastName: string
  email: string
  personalNumber?: string
}

interface StudentSelectionProps {
  onSelectStudent: (student: Student | null) => void
  onAddNewStudent: () => void
  onCreateNewStudent: (studentData: Omit<Student, 'id'>) => void
  selectedStudent?: Student | null
}

export function StudentSelection({ onSelectStudent, onAddNewStudent, onCreateNewStudent, selectedStudent }: StudentSelectionProps) {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newStudentData, setNewStudentData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    personalNumber: '',
    phone: ''
  })
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetchStudents()
  }, [])

  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/admin/students')
      if (response.ok) {
        const data = await response.json()
        setStudents(data.students || [])
      } else {
        console.error('Failed to fetch students')
        toast.error('Kunde inte hämta elever')
      }
    } catch (error) {
      console.error('Error fetching students:', error)
      toast.error('Ett fel uppstod när elever skulle hämtas')
    } finally {
      setLoading(false)
    }
  }

  const handleStudentChange = (studentId: string) => {
    if (studentId === 'new') {
      setShowCreateForm(true)
      return
    }

    const student = students.find(s => s.id === studentId) || null
    onSelectStudent(student)
  }

  const handleCreateStudent = async () => {
    if (!newStudentData.firstName || !newStudentData.lastName || !newStudentData.email) {
      toast.error('Vänligen fyll i namn och e-post')
      return
    }

    setCreating(true)
    try {
      const studentData = {
        firstName: newStudentData.firstName,
        lastName: newStudentData.lastName,
        email: newStudentData.email,
        personalNumber: newStudentData.personalNumber,
        phone: newStudentData.phone
      }

      await onCreateNewStudent(studentData)

      // Reset form
      setNewStudentData({
        firstName: '',
        lastName: '',
        email: '',
        personalNumber: '',
        phone: ''
      })
      setShowCreateForm(false)
      toast.success('Elev tillagd!')
    } catch (error) {
      toast.error('Kunde inte skapa elev')
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Laddar elever...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Välj Elev för Handledarutbildning
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="student-select">Välj elev från lista eller lägg till ny</Label>
          <Select
            value={selectedStudent?.id || ''}
            onValueChange={handleStudentChange}
          >
            <SelectTrigger id="student-select" className="relative z-50">
              <SelectValue placeholder="Välj en elev..." />
            </SelectTrigger>
            <SelectContent className="max-h-60 z-50">
              <SelectItem value="new" className="flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                Lägg till ny elev
              </SelectItem>
              {students.map((student) => (
                <SelectItem key={student.id} value={student.id}>
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {student.firstName} {student.lastName}
                    </span>
                    <span className="text-sm text-gray-500">
                      {student.email}
                      {student.personalNumber && ` • ${student.personalNumber.substring(0, 6)}••••`}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Create New Student Form */}
        {showCreateForm && (
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg border">
            <h4 className="font-medium text-gray-900">Lägg till ny elev</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Förnamn *</Label>
                <Input
                  id="firstName"
                  value={newStudentData.firstName}
                  onChange={(e) => setNewStudentData(prev => ({ ...prev, firstName: e.target.value }))}
                  placeholder="Förnamn"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Efternamn *</Label>
                <Input
                  id="lastName"
                  value={newStudentData.lastName}
                  onChange={(e) => setNewStudentData(prev => ({ ...prev, lastName: e.target.value }))}
                  placeholder="Efternamn"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-post *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newStudentData.email}
                  onChange={(e) => setNewStudentData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="email@exempel.se"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefon</Label>
                <Input
                  id="phone"
                  value={newStudentData.phone}
                  onChange={(e) => setNewStudentData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="070-123 45 67"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="personalNumber">Personnummer</Label>
              <Input
                id="personalNumber"
                value={newStudentData.personalNumber}
                onChange={(e) => setNewStudentData(prev => ({ ...prev, personalNumber: e.target.value }))}
                placeholder="ÅÅÅÅMMDD-XXXX"
                maxLength={13}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleCreateStudent}
                disabled={creating}
                className="bg-green-600 hover:bg-green-700"
              >
                {creating ? 'Skapar...' : 'Skapa elev'}
              </Button>
              <Button
                onClick={() => setShowCreateForm(false)}
                variant="outline"
              >
                Avbryt
              </Button>
            </div>
          </div>
        )}

        {selectedStudent && (
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2">Vald elev:</h4>
            <div className="text-sm text-blue-800">
              <p><strong>Namn:</strong> {selectedStudent.firstName} {selectedStudent.lastName}</p>
              <p><strong>E-post:</strong> {selectedStudent.email}</p>
              {selectedStudent.personalNumber && (
                <p><strong>Personnummer:</strong> {selectedStudent.personalNumber.substring(0, 6)}••••</p>
              )}
            </div>
          </div>
        )}

        <div className="text-sm text-gray-600">
          <p><strong>Observera:</strong> För handledarutbildning krävs personnummer för att skapa elevkort.</p>
        </div>
      </CardContent>
    </Card>
  )
}
