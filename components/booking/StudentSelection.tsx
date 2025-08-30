'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Plus, Search, UserCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  personalNumber?: string;
  phone?: string;
  isActive: boolean;
  role: string;
}

interface StudentSelectionProps {
  onStudentSelect: (student: Student) => void;
  onGuestMode?: () => void;
}

export function StudentSelection({ onStudentSelect, onGuestMode }: StudentSelectionProps) {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // New student form
  const [newStudent, setNewStudent] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    personalNumber: ''
  });
  const [isCreating, setIsCreating] = useState(false);
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadStudents();
  }, []);

  useEffect(() => {
    filterStudents();
  }, [students, searchTerm]);

  const loadStudents = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/students');
      if (response.ok) {
        const data = await response.json();
        setStudents(data.students || []);
      } else {
        console.error('Failed to load students');
        setStudents([]);
      }
    } catch (error) {
      console.error('Error loading students:', error);
      setStudents([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filterStudents = () => {
    if (!searchTerm.trim()) {
      setFilteredStudents(students);
      return;
    }

    const filtered = students.filter(student =>
      student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.personalNumber && student.personalNumber.includes(searchTerm))
    );
    setFilteredStudents(filtered);
  };

  const handleStudentSelect = (student: Student) => {
    setSelectedStudent(student);
  };

  const handleConfirmSelection = () => {
    if (selectedStudent) {
      onStudentSelect(selectedStudent);
    }
  };

  const validateNewStudent = () => {
    const errors: Record<string, string> = {};

    if (!newStudent.firstName.trim()) {
      errors.firstName = 'Förnamn är obligatoriskt';
    }

    if (!newStudent.lastName.trim()) {
      errors.lastName = 'Efternamn är obligatoriskt';
    }

    if (!newStudent.email.trim()) {
      errors.email = 'E-post är obligatoriskt';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newStudent.email)) {
      errors.email = 'Ogiltig e-postadress';
    }

    if (!newStudent.phone.trim()) {
      errors.phone = 'Telefonnummer är obligatoriskt';
    }

    if (!newStudent.personalNumber.trim()) {
      errors.personalNumber = 'Personnummer är obligatoriskt';
    } else {
      const cleanNumber = newStudent.personalNumber.replace(/[-\s]/g, '');
      if (cleanNumber.length < 10 || cleanNumber.length > 12 || !/^\d+$/.test(cleanNumber)) {
        errors.personalNumber = 'Personnummer måste vara 10-12 siffror';
      }
    }

    setCreateErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateStudent = async () => {
    if (!validateNewStudent()) {
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch('/api/admin/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newStudent,
          role: 'student',
          isActive: true
        })
      });

      if (response.ok) {
        const data = await response.json();
        const createdStudent: Student = data.student;
        setStudents(prev => [...prev, createdStudent]);
        setSelectedStudent(createdStudent);
        setShowCreateForm(false);
        setNewStudent({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          personalNumber: ''
        });
      } else {
        const error = await response.json();
        setCreateErrors({ general: error.error || 'Kunde inte skapa elev' });
      }
    } catch (error) {
      console.error('Error creating student:', error);
      setCreateErrors({ general: 'Ett fel uppstod' });
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Laddar elever...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Välj elev för bokning
        </h2>
        <p className="text-lg text-gray-600">
          Välj en befintlig elev eller skapa en ny
        </p>
      </div>

      {/* Search and Create */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Sök efter elev (namn, e-post eller personnummer)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          onClick={() => setShowCreateForm(!showCreateForm)}
          variant="outline"
          className="border-dashed border-2 border-gray-300 hover:border-red-600 hover:text-red-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          Skapa ny elev
        </Button>
      </div>

      {/* Create Student Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Plus className="w-5 h-5" />
              <span>Skapa ny elev</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">Förnamn *</Label>
                <Input
                  id="firstName"
                  value={newStudent.firstName}
                  onChange={(e) => setNewStudent(prev => ({ ...prev, firstName: e.target.value }))}
                  placeholder="Ange förnamn"
                  className={createErrors.firstName ? 'border-red-500' : ''}
                />
                {createErrors.firstName && (
                  <p className="text-sm text-red-600 mt-1">{createErrors.firstName}</p>
                )}
              </div>

              <div>
                <Label htmlFor="lastName">Efternamn *</Label>
                <Input
                  id="lastName"
                  value={newStudent.lastName}
                  onChange={(e) => setNewStudent(prev => ({ ...prev, lastName: e.target.value }))}
                  placeholder="Ange efternamn"
                  className={createErrors.lastName ? 'border-red-500' : ''}
                />
                {createErrors.lastName && (
                  <p className="text-sm text-red-600 mt-1">{createErrors.lastName}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="email">E-post *</Label>
              <Input
                id="email"
                type="email"
                value={newStudent.email}
                onChange={(e) => setNewStudent(prev => ({ ...prev, email: e.target.value }))}
                placeholder="namn@exempel.se"
                className={createErrors.email ? 'border-red-500' : ''}
              />
              {createErrors.email && (
                <p className="text-sm text-red-600 mt-1">{createErrors.email}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Telefon *</Label>
                <Input
                  id="phone"
                  value={newStudent.phone}
                  onChange={(e) => setNewStudent(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="070-123 45 67"
                  className={createErrors.phone ? 'border-red-500' : ''}
                />
                {createErrors.phone && (
                  <p className="text-sm text-red-600 mt-1">{createErrors.phone}</p>
                )}
              </div>

              <div>
                <Label htmlFor="personalNumber">Personnummer *</Label>
                <Input
                  id="personalNumber"
                  value={newStudent.personalNumber}
                  onChange={(e) => setNewStudent(prev => ({ ...prev, personalNumber: e.target.value }))}
                  placeholder="ÅÅÅÅMMDD-XXXX"
                  className={createErrors.personalNumber ? 'border-red-500' : ''}
                />
                {createErrors.personalNumber && (
                  <p className="text-sm text-red-600 mt-1">{createErrors.personalNumber}</p>
                )}
              </div>
            </div>

            {createErrors.general && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{createErrors.general}</p>
              </div>
            )}

            <div className="flex space-x-3 pt-4">
              <Button
                onClick={handleCreateStudent}
                disabled={isCreating}
                className="bg-red-600 hover:bg-red-700"
              >
                {isCreating ? 'Skapar...' : 'Skapa elev'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowCreateForm(false)}
                disabled={isCreating}
              >
                Avbryt
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Students List */}
      <div className="space-y-3">
        {filteredStudents.map((student) => (
          <Card
            key={student.id}
            className={`cursor-pointer transition-colors ${
              selectedStudent?.id === student.id
                ? 'ring-2 ring-red-600 bg-red-50'
                : 'hover:bg-gray-50'
            }`}
            onClick={() => handleStudentSelect(student)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {student.firstName} {student.lastName}
                    </h3>
                    <p className="text-sm text-gray-600">{student.email}</p>
                    {student.phone && (
                      <p className="text-sm text-gray-600">{student.phone}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {student.personalNumber && (
                    <Badge variant="outline" className="text-xs">
                      {student.personalNumber}
                    </Badge>
                  )}
                  {selectedStudent?.id === student.id && (
                    <Badge className="bg-red-600">
                      <UserCheck className="w-3 h-3 mr-1" />
                      Vald
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredStudents.length === 0 && searchTerm && (
          <div className="text-center py-8">
            <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">Inga elever hittades för "{searchTerm}"</p>
          </div>
        )}
      </div>

      {/* Confirm Selection */}
      {selectedStudent && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <UserCheck className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-green-800">
                  Vald elev: {selectedStudent.firstName} {selectedStudent.lastName}
                </p>
                <p className="text-sm text-green-600">{selectedStudent.email}</p>
              </div>
            </div>
            <Button
              onClick={handleConfirmSelection}
              className="bg-green-600 hover:bg-green-700"
            >
              Bekräfta val
            </Button>
          </div>
        </div>
      )}

      {/* Guest Mode Option */}
      {onGuestMode && (
        <div className="text-center pt-4 border-t">
          <p className="text-gray-600 mb-3">Eller boka för gäst</p>
          <Button
            variant="outline"
            onClick={onGuestMode}
            className="border-dashed border-2"
          >
            Gästbokning
          </Button>
        </div>
      )}

      {/* Info */}
      <div className="bg-amber-50 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-amber-800 mb-1">Admin/Teacher bokningar</h4>
            <ul className="text-amber-700 text-sm space-y-1">
              <li>• Bokningar för elever kräver ingen betalning</li>
              <li>• Eleven får automatiskt en bekräftelse via e-post</li>
              <li>• Du kan skapa nya elever direkt från denna vy</li>
              <li>• Alla obligatoriska fält måste fyllas i för nya elever</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
