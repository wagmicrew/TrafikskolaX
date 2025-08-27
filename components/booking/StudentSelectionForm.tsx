"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, UserPlus, Users, CheckCircle, AlertTriangle, X } from 'lucide-react';
import { OrbSpinner } from '@/components/ui/orb-loader';
import toast from 'react-hot-toast';

interface Student {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
}

interface StudentSelectionFormProps {
  selectedStudent: Student | null;
  onStudentSelect: (student: Student | null) => void;
  userIsStudent: boolean;
  user: Student | null;
  onClose?: () => void;
  sessionType: 'handledar' | 'teori' | 'lesson';
}

const StudentSelectionForm: React.FC<StudentSelectionFormProps> = ({
  selectedStudent,
  onStudentSelect,
  userIsStudent,
  user,
  onClose,
  sessionType
}) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [guestStudent, setGuestStudent] = useState({
    name: '',
    email: '',
    phone: '',
    personalNumber: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      const response = await fetch('/api/admin/users?role=student&limit=100');
      if (response.ok) {
        const data = await response.json();
        // Handle both possible response formats
        const usersData = data.users || data;
        const formattedStudents = usersData.map((user: any) => ({
          id: user.id,
          name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          email: user.email,
          phone: user.phone,
          role: user.role
        }));
        setStudents(formattedStudents);
      } else {
        // Try fallback API
        const fallbackResponse = await fetch('/api/users?role=student&limit=100');
        if (fallbackResponse.ok) {
          const data = await fallbackResponse.json();
          const usersData = data.users || data;
          const formattedStudents = usersData.map((user: any) => ({
            id: user.id,
            name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
            email: user.email,
            phone: user.phone,
            role: user.role
          }));
          setStudents(formattedStudents);
        } else {
          throw new Error('Failed to load students');
        }
      }
    } catch (error) {
      console.error('Error loading students:', error);
      toast.error('Kunde inte ladda elever');
      setStudents([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleStudentSelect = (studentId: string) => {
    if (studentId === 'guest') {
      setShowGuestForm(true);
      setGuestStudent({ name: '', email: '', phone: '', personalNumber: '' });
      setErrors({});
    } else {
      const student = students.find(s => s.id === studentId);
      if (student) {
        onStudentSelect(student);
        toast.success(`Elev ${student.name} vald`);
        if (onClose) onClose();
      }
    }
  };

  const handleGuestStudentSubmit = async () => {
    // Validate guest student data
    const newErrors: Record<string, string> = {};

    if (!guestStudent.name.trim()) {
      newErrors.name = 'Namn är obligatoriskt';
    }
    if (!guestStudent.email.trim()) {
      newErrors.email = 'E-post är obligatoriskt';
    } else if (!guestStudent.email.includes('@')) {
      newErrors.email = 'Ogiltig e-postadress';
    }
    if (!guestStudent.phone.trim()) {
      newErrors.phone = 'Telefon är obligatoriskt';
    }
    if (!guestStudent.personalNumber.trim()) {
      newErrors.personalNumber = 'Personnummer är obligatoriskt';
    } else if (!/^\d{10,12}$/.test(guestStudent.personalNumber.replace(/[-\s]/g, ''))) {
      newErrors.personalNumber = 'Ogiltigt personnummer (10-12 siffror)';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      // Create guest student account
      const response = await fetch('/api/users/create-guest-student', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: guestStudent.name,
          email: guestStudent.email,
          phone: guestStudent.phone,
          personalNumber: guestStudent.personalNumber,
          createdByUserId: user?.id || null
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create student account');
      }

      const data = await response.json();
      const newStudent: Student = {
        id: data.user.id,
        name: data.user.firstName + ' ' + data.user.lastName,
        email: data.user.email,
        phone: data.user.phone,
        role: 'student'
      };

      onStudentSelect(newStudent);
      toast.success(`Elevkonto skapat och valt: ${newStudent.name}`);
      if (onClose) onClose();
    } catch (error) {
      console.error('Error creating guest student:', error);
      toast.error(error instanceof Error ? error.message : 'Kunde inte skapa elevkonto');
    }
  };

  const updateGuestStudent = (field: string, value: string) => {
    setGuestStudent(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Auto-select current user if they are a student
  useEffect(() => {
    if (userIsStudent && user && !selectedStudent) {
      onStudentSelect(user);
    }
  }, [userIsStudent, user, selectedStudent, onStudentSelect]);

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5 text-green-600" />
          Välj Elev
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Current User Info */}
          {user && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-800">
                    Inloggad som: {user.name}
                  </p>
                  <p className="text-sm text-blue-600">
                    {user.email}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Roll: {user.role === 'student' ? 'Elev' : user.role === 'admin' ? 'Administratör' : user.role}
                  </p>
                </div>
                {userIsStudent && (
                  <Badge className="bg-green-100 text-green-800 border-green-300">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Du är vald som elev
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Student Selection */}
          {!userIsStudent && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="student-select">Välj elev från lista *</Label>
                <Select onValueChange={handleStudentSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Välj en elev eller skapa ny" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="guest">
                      <div className="flex items-center gap-2">
                        <UserPlus className="w-4 h-4" />
                        Skapa ny elev (gäst)
                      </div>
                    </SelectItem>
                    {students.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{student.name}</span>
                          <span className="text-xs text-gray-500">{student.email}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Guest Student Form */}
              {showGuestForm && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-yellow-800 flex items-center gap-2">
                      <UserPlus className="w-4 h-4" />
                      Skapa nytt elevkonto
                    </h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowGuestForm(false)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="guest-name">Namn *</Label>
                      <Input
                        id="guest-name"
                        value={guestStudent.name}
                        onChange={(e) => updateGuestStudent('name', e.target.value)}
                        placeholder="För- och efternamn"
                        className={errors.name ? 'border-red-500' : ''}
                      />
                      {errors.name && (
                        <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="guest-email">E-post *</Label>
                      <Input
                        id="guest-email"
                        type="email"
                        value={guestStudent.email}
                        onChange={(e) => updateGuestStudent('email', e.target.value)}
                        placeholder="namn@exempel.se"
                        className={errors.email ? 'border-red-500' : ''}
                      />
                      {errors.email && (
                        <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="guest-phone">Telefon *</Label>
                      <Input
                        id="guest-phone"
                        value={guestStudent.phone}
                        onChange={(e) => updateGuestStudent('phone', e.target.value)}
                        placeholder="07X-XXX XX XX"
                        className={errors.phone ? 'border-red-500' : ''}
                      />
                      {errors.phone && (
                        <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="guest-personalNumber">Personnummer *</Label>
                      <Input
                        id="guest-personalNumber"
                        value={guestStudent.personalNumber}
                        onChange={(e) => updateGuestStudent('personalNumber', e.target.value)}
                        placeholder="ÅÅÅÅMMDD-XXXX"
                        className={errors.personalNumber ? 'border-red-500' : ''}
                      />
                      {errors.personalNumber && (
                        <p className="text-red-500 text-xs mt-1">{errors.personalNumber}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3 mt-4">
                    <Button
                      onClick={handleGuestStudentSubmit}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Skapa och välj elev
                    </Button>
                  </div>
                </div>
              )}

              {/* Selected Student Display */}
              {selectedStudent && !showGuestForm && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <User className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-medium text-green-800">
                          Vald elev: {selectedStudent.name}
                        </p>
                        <p className="text-sm text-green-600">
                          {selectedStudent.email}
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-800 border-green-300">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Vald
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          {onClose && (
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <Button
                onClick={onClose}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Klar
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default StudentSelectionForm;
