"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserPlus, UserMinus, AlertTriangle, CheckCircle, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface Handledare {
  id?: string;
  name: string;
  email: string;
  phone: string;
  personalNumber: string;
}

interface DynamicHandledareFormProps {
  handledare: Handledare[];
  onChange: (handledare: Handledare[]) => void;
  maxSpots: number;
  currentOccupancy: number;
  sessionType: 'handledar' | 'teori' | 'lesson';
  onClose?: () => void;
}

const DynamicHandledareForm: React.FC<DynamicHandledareFormProps> = ({
  handledare,
  onChange,
  maxSpots,
  currentOccupancy,
  sessionType,
  onClose
}) => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Calculate available spots
  const availableSpots = maxSpots - currentOccupancy;
  const studentSpots = sessionType === 'handledar' ? 1 : 1; // 1 student spot for handledar sessions
  const availableHandledareSpots = availableSpots - studentSpots;

  // Validate if session is fully booked
  const isFullyBooked = availableHandledareSpots <= 0;

  const addHandledare = () => {
    if (isFullyBooked) {
      toast.error('Denna session är fullbokad. Välj en annan session eller tid.');
      return;
    }

    if (handledare.length >= availableHandledareSpots) {
      toast.error(`Max ${availableHandledareSpots} handledare kan läggas till denna session.`);
      return;
    }

    const newHandledare: Handledare = {
      name: '',
      email: '',
      phone: '',
      personalNumber: ''
    };

    onChange([...handledare, newHandledare]);
  };

  const removeHandledare = (index: number) => {
    const updatedHandledare = handledare.filter((_, i) => i !== index);
    onChange(updatedHandledare);
  };

  const updateHandledare = (index: number, field: keyof Handledare, value: string) => {
    const updatedHandledare = handledare.map((h, i) =>
      i === index ? { ...h, [field]: value } : h
    );
    onChange(updatedHandledare);

    // Clear error for this field
    const errorKey = `${field}-${index}`;
    if (errors[errorKey]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  };

  const validateHandledare = () => {
    const newErrors: Record<string, string> = {};

    handledare.forEach((handledare, index) => {
      if (!handledare.name.trim()) {
        newErrors[`name-${index}`] = 'Namn är obligatoriskt';
      }
      if (!handledare.email.trim()) {
        newErrors[`email-${index}`] = 'E-post är obligatoriskt';
      } else if (!handledare.email.includes('@')) {
        newErrors[`email-${index}`] = 'Ogiltig e-postadress';
      }
      if (!handledare.phone.trim()) {
        newErrors[`phone-${index}`] = 'Telefon är obligatoriskt';
      }
      if (!handledare.personalNumber.trim()) {
        newErrors[`personalNumber-${index}`] = 'Personnummer är obligatoriskt';
      } else if (!/^\d{10,12}$/.test(handledare.personalNumber.replace(/[-\s]/g, ''))) {
        newErrors[`personalNumber-${index}`] = 'Ogiltigt personnummer (10-12 siffror)';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateHandledare()) {
      if (onClose) onClose();
      toast.success(`${handledare.length} handledare har lagts till`);
    } else {
      toast.error('Vänligen rätta till felen innan du fortsätter');
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-blue-600" />
            Handledare ({handledare.length}/{availableHandledareSpots})
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={isFullyBooked ? "destructive" : "secondary"}>
              {availableHandledareSpots} platser kvar
            </Badge>
            {onClose && (
              <Button variant="outline" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isFullyBooked ? (
          <div className="text-center py-8">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-red-800 mb-2">
              Sessionen är fullbokad
            </h3>
            <p className="text-red-600 mb-4">
              Det finns inga fler platser tillgängliga för denna session.
            </p>
            <p className="text-sm text-gray-500">
              Välj en annan session eller tidpunkt, eller dela upp handledarna på flera sessioner.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Handledare Forms */}
            <div className="space-y-4">
              {handledare.map((handledare, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-gray-800">
                      Handledare {index + 1}
                    </h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeHandledare(index)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <UserMinus className="w-4 h-4 mr-1" />
                      Ta bort
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`name-${index}`}>Namn *</Label>
                      <Input
                        id={`name-${index}`}
                        value={handledare.name}
                        onChange={(e) => updateHandledare(index, 'name', e.target.value)}
                        placeholder="För- och efternamn"
                        className={errors[`name-${index}`] ? 'border-red-500' : ''}
                      />
                      {errors[`name-${index}`] && (
                        <p className="text-red-500 text-xs mt-1">{errors[`name-${index}`]}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor={`email-${index}`}>E-post *</Label>
                      <Input
                        id={`email-${index}`}
                        type="email"
                        value={handledare.email}
                        onChange={(e) => updateHandledare(index, 'email', e.target.value)}
                        placeholder="namn@exempel.se"
                        className={errors[`email-${index}`] ? 'border-red-500' : ''}
                      />
                      {errors[`email-${index}`] && (
                        <p className="text-red-500 text-xs mt-1">{errors[`email-${index}`]}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor={`phone-${index}`}>Telefon *</Label>
                      <Input
                        id={`phone-${index}`}
                        value={handledare.phone}
                        onChange={(e) => updateHandledare(index, 'phone', e.target.value)}
                        placeholder="07X-XXX XX XX"
                        className={errors[`phone-${index}`] ? 'border-red-500' : ''}
                      />
                      {errors[`phone-${index}`] && (
                        <p className="text-red-500 text-xs mt-1">{errors[`phone-${index}`]}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor={`personalNumber-${index}`}>Personnummer *</Label>
                      <Input
                        id={`personalNumber-${index}`}
                        value={handledare.personalNumber}
                        onChange={(e) => updateHandledare(index, 'personalNumber', e.target.value)}
                        placeholder="ÅÅÅÅMMDD-XXXX"
                        className={errors[`personalNumber-${index}`] ? 'border-red-500' : ''}
                      />
                      {errors[`personalNumber-${index}`] && (
                        <p className="text-red-500 text-xs mt-1">{errors[`personalNumber-${index}`]}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Handledare Button */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                {handledare.length === 0 && (
                  <span className="text-blue-600">Minst 1 handledare krävs för denna session</span>
                )}
                {handledare.length > 0 && availableHandledareSpots > handledare.length && (
                  <span>{availableHandledareSpots - handledare.length} platser kvar</span>
                )}
              </div>

              <Button
                onClick={addHandledare}
                disabled={handledare.length >= availableHandledareSpots}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Lägg till handledare
              </Button>
            </div>

            {/* Action Buttons */}
            {onClose && (
              <div className="flex gap-3 pt-6 border-t border-gray-200">
                <Button
                  onClick={handleSave}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Spara handledare
                </Button>
                <Button
                  variant="outline"
                  onClick={onClose}
                >
                  Avbryt
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DynamicHandledareForm;
