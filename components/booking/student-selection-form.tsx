import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'

interface Student {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  personalNumber?: string
  inskriven: boolean
}

interface StudentSelectionFormProps {
  selectedStudent: string
  onStudentChange: (studentId: string) => void
  onShowAddStudent: () => void
}

export function StudentSelectionForm({
  selectedStudent,
  onStudentChange,
  onShowAddStudent,
}: StudentSelectionFormProps) {
  const { toast } = useToast()
  const { user: authUser } = useAuth()
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchStudents()
  }, [])

  const fetchStudents = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/students?excludeTemp=true')
      if (response.ok) {
        const data = await response.json()
        setStudents(data.students || [])
      } else {
        toast({
          title: 'Fel',
          description: 'Kunde inte hämta studentlista',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error fetching students:', error)
      toast({
        title: 'Fel',
        description: 'Ett fel uppstod vid hämtning av studenter',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredStudents = students.filter(student =>
    `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const selectedStudentData = students.find(s => s.id === selectedStudent)

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="student-search" className="text-sm font-medium">
          Sök student
        </Label>
        <Input
          id="student-search"
          type="text"
          placeholder="Sök efter namn eller e-post..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mt-1"
        />
      </div>

      <div className="space-y-2">
        {loading ? (
          <div className="text-sm text-gray-500">Laddar studenter...</div>
        ) : (
          <>
            {filteredStudents.length === 0 ? (
              <div className="text-sm text-gray-500">
                Inga studenter hittades.{' '}
                <Button
                  variant="link"
                  className="p-0 h-auto text-blue-600"
                  onClick={onShowAddStudent}
                >
                  Lägg till ny student
                </Button>
              </div>
            ) : (
              <>
                {selectedStudentData && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-blue-900">
                          Vald student: {`${selectedStudentData.firstName} ${selectedStudentData.lastName}`}
                        </p>
                        <p className="text-sm text-blue-700">
                          {selectedStudentData.email}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="max-h-40 overflow-y-auto space-y-1 z-50">
                  {filteredStudents.map((student) => (
                    <button
                      key={student.id}
                      type="button"
                      onClick={() => onStudentChange(student.id)}
                      className={`w-full text-left p-2 rounded border transition-colors ${
                        selectedStudent === student.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <p className="font-medium">{`${student.firstName} ${student.lastName}`}</p>
                      <p className="text-sm text-gray-600">{student.email}</p>
                    </button>
                  ))}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={onShowAddStudent}
                  className="w-full"
                >
                  Lägg till ny student
                </Button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
