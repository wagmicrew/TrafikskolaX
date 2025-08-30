'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Users, Plus, Minus, Trash2, CheckCircle, AlertCircle } from 'lucide-react';

interface TeoriLessonType {
  id: string;
  name: string;
  description: string | null;
  allowsSupervisors: boolean;
  price: number;
  pricePerSupervisor?: number;
  durationMinutes: number;
  maxParticipants: number;
  isActive: boolean;
}

interface TeoriSession {
  id: string;
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  maxParticipants: number;
  currentParticipants: number;
  price: number;
  pricePerSupervisor?: number;
  availableSpots: number;
  formattedDateTime: string;
  allowsSupervisors: boolean;
}

interface Supervisor {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  personalNumber: string;
}

interface SupervisorManagementProps {
  lessonType: TeoriLessonType;
  selectedSession: TeoriSession;
  onComplete: (supervisors: Supervisor[]) => void;
}

export function SupervisorManagement({
  lessonType,
  selectedSession,
  onComplete
}: SupervisorManagementProps) {
  const [supervisors, setSupervisors] = useState<Supervisor[]>([
    { firstName: '', lastName: '', email: '', phone: '', personalNumber: '' }
  ]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const addSupervisor = () => {
    if (supervisors.length < 5) { // Max 5 supervisors
      setSupervisors(prev => [...prev, {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        personalNumber: ''
      }]);
    }
  };

  const removeSupervisor = (index: number) => {
    if (supervisors.length > 1) {
      setSupervisors(prev => prev.filter((_, i) => i !== index));
    }
  };

  const updateSupervisor = (index: number, field: keyof Supervisor, value: string) => {
    setSupervisors(prev => prev.map((supervisor, i) =>
      i === index ? { ...supervisor, [field]: value } : supervisor
    ));

    // Clear error for this field
    const fieldKey = `${index}-${field}`;
    if (errors[fieldKey]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldKey];
        return newErrors;
      });
    }
  };

  const validateSupervisor = (supervisor: Supervisor, index: number): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    if (!supervisor.firstName.trim()) {
      newErrors[`${index}-firstName`] = 'Förnamn är obligatoriskt';
      isValid = false;
    }

    if (!supervisor.lastName.trim()) {
      newErrors[`${index}-lastName`] = 'Efternamn är obligatoriskt';
      isValid = false;
    }

    if (!supervisor.email.trim()) {
      newErrors[`${index}-email`] = 'E-post är obligatoriskt';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supervisor.email)) {
      newErrors[`${index}-email`] = 'Ogiltig e-postadress';
      isValid = false;
    }

    if (!supervisor.phone.trim()) {
      newErrors[`${index}-phone`] = 'Telefonnummer är obligatoriskt';
      isValid = false;
    }

    if (!supervisor.personalNumber.trim()) {
      newErrors[`${index}-personalNumber`] = 'Personnummer är obligatoriskt';
      isValid = false;
    } else {
      // Swedish personal number validation (10-12 digits)
      const cleanNumber = supervisor.personalNumber.replace(/[-\s]/g, '');
      if (cleanNumber.length < 10 || cleanNumber.length > 12 || !/^\d+$/.test(cleanNumber)) {
        newErrors[`${index}-personalNumber`] = 'Personnummer måste vara 10-12 siffror';
        isValid = false;
      }
    }

    setErrors(prev => ({ ...prev, ...newErrors }));
    return isValid;
  };

  const validateAllSupervisors = (): boolean => {
    let isValid = true;
    supervisors.forEach((supervisor, index) => {
      if (!validateSupervisor(supervisor, index)) {
        isValid = false;
      }
    });
    return isValid;
  };

  const calculateTotalPrice = (): number => {
    const basePrice = selectedSession.price;
    const supervisorPrice = lessonType.pricePerSupervisor || 0;
    const supervisorCount = supervisors.length;
    return basePrice + (supervisorPrice * supervisorCount);
  };

  const handleContinue = () => {
    if (validateAllSupervisors()) {
      onComplete(supervisors);
    }
  };

  const isFormValid = supervisors.every(supervisor =>
    supervisor.firstName.trim() &&
    supervisor.lastName.trim() &&
    supervisor.email.trim() &&
    supervisor.phone.trim() &&
    supervisor.personalNumber.trim()
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Handledare för {lessonType.name}
        </h2>
        <p className="text-lg text-gray-600 mb-4">
          Lägg till minst en handledare för denna utbildning
        </p>
        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
          <Users className="w-4 h-4 mr-1" />
          {supervisors.length} handledare
        </Badge>
      </div>

      {/* Session Info */}
      <Card className="bg-gray-50">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Vald utbildning</h3>
              <p className="text-gray-700">{selectedSession.title}</p>
              <p className="text-sm text-gray-600">
                {selectedSession.formattedDateTime}
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Prissammanfattning</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Baspris:</span>
                  <span>{selectedSession.price}€</span>
                </div>
                <div className="flex justify-between">
                  <span>Handledare ({supervisors.length}):</span>
                  <span>{(lessonType.pricePerSupervisor || 0) * supervisors.length}€</span>
                </div>
                <div className="flex justify-between font-semibold border-t pt-1">
                  <span>Totalt:</span>
                  <span className="text-red-600">{calculateTotalPrice()}€</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Supervisors Form */}
      <div className="space-y-4">
        {supervisors.map((supervisor, index) => (
          <Card key={index} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  Handledare {index + 1}
                  {index === 0 && (
                    <Badge variant="secondary" className="ml-2 bg-red-100 text-red-800 text-xs">
                      Obligatorisk
                    </Badge>
                  )}
                </CardTitle>
                {supervisors.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSupervisor(index)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`firstName-${index}`}>Förnamn *</Label>
                  <Input
                    id={`firstName-${index}`}
                    value={supervisor.firstName}
                    onChange={(e) => updateSupervisor(index, 'firstName', e.target.value)}
                    placeholder="Ange förnamn"
                    className={errors[`${index}-firstName`] ? 'border-red-500' : ''}
                  />
                  {errors[`${index}-firstName`] && (
                    <p className="text-sm text-red-600 mt-1">{errors[`${index}-firstName`]}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor={`lastName-${index}`}>Efternamn *</Label>
                  <Input
                    id={`lastName-${index}`}
                    value={supervisor.lastName}
                    onChange={(e) => updateSupervisor(index, 'lastName', e.target.value)}
                    placeholder="Ange efternamn"
                    className={errors[`${index}-lastName`] ? 'border-red-500' : ''}
                  />
                  {errors[`${index}-lastName`] && (
                    <p className="text-sm text-red-600 mt-1">{errors[`${index}-lastName`]}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor={`email-${index}`}>E-post *</Label>
                <Input
                  id={`email-${index}`}
                  type="email"
                  value={supervisor.email}
                  onChange={(e) => updateSupervisor(index, 'email', e.target.value)}
                  placeholder="namn@exempel.se"
                  className={errors[`${index}-email`] ? 'border-red-500' : ''}
                />
                {errors[`${index}-email`] && (
                  <p className="text-sm text-red-600 mt-1">{errors[`${index}-email`]}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`phone-${index}`}>Telefon *</Label>
                  <Input
                    id={`phone-${index}`}
                    value={supervisor.phone}
                    onChange={(e) => updateSupervisor(index, 'phone', e.target.value)}
                    placeholder="070-123 45 67"
                    className={errors[`${index}-phone`] ? 'border-red-500' : ''}
                  />
                  {errors[`${index}-phone`] && (
                    <p className="text-sm text-red-600 mt-1">{errors[`${index}-phone`]}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor={`personalNumber-${index}`}>Personnummer *</Label>
                  <Input
                    id={`personalNumber-${index}`}
                    value={supervisor.personalNumber}
                    onChange={(e) => updateSupervisor(index, 'personalNumber', e.target.value)}
                    placeholder="ÅÅÅÅMMDD-XXXX"
                    className={errors[`${index}-personalNumber`] ? 'border-red-500' : ''}
                  />
                  {errors[`${index}-personalNumber`] && (
                    <p className="text-sm text-red-600 mt-1">{errors[`${index}-personalNumber`]}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Supervisor Button */}
      {supervisors.length < 5 && (
        <div className="text-center">
          <Button
            variant="outline"
            onClick={addSupervisor}
            className="border-dashed border-2 border-gray-300 hover:border-red-600 hover:text-red-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Lägg till handledare
          </Button>
        </div>
      )}

      {/* Continue Button */}
      <div className="text-center pt-6">
        <Button
          onClick={handleContinue}
          disabled={!isFormValid}
          className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 px-8 py-3 text-lg"
        >
          <CheckCircle className="w-5 h-5 mr-2" />
          Fortsätt till bekräftelse
        </Button>
        {!isFormValid && (
          <p className="text-sm text-gray-600 mt-2">
            Fyll i alla obligatoriska fält för att fortsätta
          </p>
        )}
      </div>

      {/* Info */}
      <div className="bg-amber-50 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-amber-800 mb-1">Viktig information om handledare</h4>
            <ul className="text-amber-700 text-sm space-y-1">
              <li>• Minst en handledare måste anges</li>
              <li>• Alla uppgifter måste vara korrekta för att få intyg</li>
              <li>• Handledare får separat bekräftelse via e-post</li>
              <li>• Extra handledare kostar {lessonType.pricePerSupervisor}€ per person</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
