'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { UserPlus, AlertCircle, CheckCircle, Mail } from 'lucide-react';
import Link from 'next/link';

interface GuestRegistrationProps {
  onGuestRegister: (guestData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    personalNumber: string;
  }) => void;
}

export function GuestRegistration({ onGuestRegister }: GuestRegistrationProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    personalNumber: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Förnamn är obligatoriskt';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Efternamn är obligatoriskt';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'E-post är obligatoriskt';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Ogiltig e-postadress';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Telefonnummer är obligatoriskt';
    }

    if (!formData.personalNumber.trim()) {
      newErrors.personalNumber = 'Personnummer är obligatoriskt';
    } else {
      const cleanNumber = formData.personalNumber.replace(/[-\s]/g, '');
      if (cleanNumber.length < 10 || cleanNumber.length > 12 || !/^\d+$/.test(cleanNumber)) {
        newErrors.personalNumber = 'Personnummer måste vara 10-12 siffror';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      onGuestRegister(formData);
    } catch (error) {
      console.error('Error registering guest:', error);
      setErrors({ general: 'Ett fel uppstod vid registrering' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Gästinformation
        </h2>
        <p className="text-lg text-gray-600 mb-4">
          Fyll i dina uppgifter för att fortsätta med bokningen
        </p>
        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
          <UserPlus className="w-4 h-4 mr-1" />
          Gästbokning
        </Badge>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <UserPlus className="w-5 h-5" />
            <span>Dina uppgifter</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">Förnamn *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => updateField('firstName', e.target.value)}
                  placeholder="Ange ditt förnamn"
                  className={errors.firstName ? 'border-red-500' : ''}
                />
                {errors.firstName && (
                  <p className="text-sm text-red-600 mt-1">{errors.firstName}</p>
                )}
              </div>

              <div>
                <Label htmlFor="lastName">Efternamn *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => updateField('lastName', e.target.value)}
                  placeholder="Ange ditt efternamn"
                  className={errors.lastName ? 'border-red-500' : ''}
                />
                {errors.lastName && (
                  <p className="text-sm text-red-600 mt-1">{errors.lastName}</p>
                )}
              </div>
            </div>

            {/* Contact Fields */}
            <div>
              <Label htmlFor="email">E-post *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="din@email.se"
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && (
                <p className="text-sm text-red-600 mt-1">{errors.email}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Telefon *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  placeholder="070-123 45 67"
                  className={errors.phone ? 'border-red-500' : ''}
                />
                {errors.phone && (
                  <p className="text-sm text-red-600 mt-1">{errors.phone}</p>
                )}
              </div>

              <div>
                <Label htmlFor="personalNumber">Personnummer *</Label>
                <Input
                  id="personalNumber"
                  value={formData.personalNumber}
                  onChange={(e) => updateField('personalNumber', e.target.value)}
                  placeholder="ÅÅÅÅMMDD-XXXX"
                  className={errors.personalNumber ? 'border-red-500' : ''}
                />
                {errors.personalNumber && (
                  <p className="text-sm text-red-600 mt-1">{errors.personalNumber}</p>
                )}
              </div>
            </div>

            {/* General Error */}
            {errors.general && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{errors.general}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 py-3 text-lg"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Registrerar...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Fortsätt till bekräftelse
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Account Creation Info */}
      <Card className="bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <Mail className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-blue-900 mb-2">
                Skapa konto för bättre upplevelse
              </h4>
              <p className="text-blue-800 text-sm mb-3">
                Genom att skapa ett konto kan du enkelt hantera dina bokningar,
                få påminnelser och spara dina uppgifter för framtida bokningar.
              </p>
              <Link href="/registrera">
                <Button variant="outline" size="sm" className="border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white">
                  Skapa konto istället
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info */}
      <div className="bg-amber-50 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-amber-800 mb-1">Viktig information</h4>
            <ul className="text-amber-700 text-sm space-y-1">
              <li>• Alla uppgifter måste vara korrekta för att få intyg</li>
              <li>• Du får en bekräftelse via e-post efter bokningen</li>
              <li>• Bokningen måste betalas inom 10 minuter</li>
              <li>• Du kan skapa ett konto senare från din bekräftelse</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
