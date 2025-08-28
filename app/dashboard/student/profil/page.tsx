"use client";

import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Spinner, TextInput, Label, Select } from 'flowbite-react';
import { User, Mail, Phone, MapPin, Calendar, Edit3, Save, X, Camera } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { toast } from 'sonner';

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  postalCode?: string;
  city?: string;
  dateOfBirth?: string;
  personalNumber?: string;
  profileImage?: string;
  customerNumber?: string;
  inskriven: boolean;
  inskrivenDate?: string;
}

export default function StudentProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Partial<UserProfile>>({});
  const { user } = useAuth();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/profile');
      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
        setEditedProfile(data.profile);
      } else {
        toast.error('Kunde inte hämta profil');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Ett fel uppstod vid hämtning av profil');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedProfile),
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
        setEditing(false);
        toast.success('Profil uppdaterad');
      } else {
        toast.error('Kunde inte uppdatera profil');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Ett fel uppstod vid uppdatering');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedProfile(profile || {});
    setEditing(false);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Ej angivet';
    return new Date(dateString).toLocaleDateString('sv-SE');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <Spinner size="xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <Card>
            <div className="p-8 text-center">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Profil kunde inte laddas</h3>
              <p className="text-gray-500">Ett fel uppstod vid hämtning av din profil.</p>
              <Button onClick={fetchProfile} className="mt-4">
                Försök igen
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Min Profil</h1>
          <p className="text-gray-600">Hantera dina personliga uppgifter och inställningar</p>
        </div>

        {/* Profile Card */}
        <Card className="mb-6">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="relative">
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                    {profile.profileImage ? (
                      <img
                        src={profile.profileImage}
                        alt="Profil"
                        className="w-20 h-20 rounded-full object-cover"
                      />
                    ) : (
                      <User className="h-10 w-10 text-blue-600" />
                    )}
                  </div>
                  <button className="absolute bottom-0 right-0 p-1 bg-blue-600 text-white rounded-full hover:bg-blue-700">
                    <Camera className="h-3 w-3" />
                  </button>
                </div>
                <div className="ml-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {profile.firstName} {profile.lastName}
                  </h2>
                  <p className="text-gray-600">{profile.email}</p>
                  {profile.customerNumber && (
                    <p className="text-sm text-gray-500">Kundnummer: {profile.customerNumber}</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {profile.inskriven && (
                  <Badge color="success" size="lg">
                    Inskriven elev
                  </Badge>
                )}
                {!editing ? (
                  <Button onClick={() => setEditing(true)} color="blue">
                    <Edit3 className="h-4 w-4 mr-2" />
                    Redigera
                  </Button>
                ) : (
                  <div className="flex space-x-2">
                    <Button onClick={handleSave} disabled={saving} color="blue">
                      <Save className="h-4 w-4 mr-2" />
                      {saving ? 'Sparar...' : 'Spara'}
                    </Button>
                    <Button onClick={handleCancel} color="gray">
                      <X className="h-4 w-4 mr-2" />
                      Avbryt
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Profile Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Personlig information</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="firstName">Förnamn</Label>
                    {editing ? (
                      <TextInput
                        id="firstName"
                        value={editedProfile.firstName || ''}
                        onChange={(e) => setEditedProfile({...editedProfile, firstName: e.target.value})}
                      />
                    ) : (
                      <p className="mt-1 text-gray-900">{profile.firstName}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="lastName">Efternamn</Label>
                    {editing ? (
                      <TextInput
                        id="lastName"
                        value={editedProfile.lastName || ''}
                        onChange={(e) => setEditedProfile({...editedProfile, lastName: e.target.value})}
                      />
                    ) : (
                      <p className="mt-1 text-gray-900">{profile.lastName}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="email">E-post</Label>
                    {editing ? (
                      <TextInput
                        id="email"
                        type="email"
                        value={editedProfile.email || ''}
                        onChange={(e) => setEditedProfile({...editedProfile, email: e.target.value})}
                      />
                    ) : (
                      <p className="mt-1 text-gray-900">{profile.email}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="phone">Telefon</Label>
                    {editing ? (
                      <TextInput
                        id="phone"
                        type="tel"
                        value={editedProfile.phone || ''}
                        onChange={(e) => setEditedProfile({...editedProfile, phone: e.target.value})}
                        placeholder="070-123 45 67"
                      />
                    ) : (
                      <p className="mt-1 text-gray-900">{profile.phone || 'Ej angivet'}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="dateOfBirth">Födelsedatum</Label>
                    {editing ? (
                      <TextInput
                        id="dateOfBirth"
                        type="date"
                        value={editedProfile.dateOfBirth || ''}
                        onChange={(e) => setEditedProfile({...editedProfile, dateOfBirth: e.target.value})}
                      />
                    ) : (
                      <p className="mt-1 text-gray-900">{formatDate(profile.dateOfBirth)}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Adressinformation</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="address">Adress</Label>
                    {editing ? (
                      <TextInput
                        id="address"
                        value={editedProfile.address || ''}
                        onChange={(e) => setEditedProfile({...editedProfile, address: e.target.value})}
                        placeholder="Gatunummer 123"
                      />
                    ) : (
                      <p className="mt-1 text-gray-900">{profile.address || 'Ej angivet'}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="postalCode">Postnummer</Label>
                      {editing ? (
                        <TextInput
                          id="postalCode"
                          value={editedProfile.postalCode || ''}
                          onChange={(e) => setEditedProfile({...editedProfile, postalCode: e.target.value})}
                          placeholder="12345"
                        />
                      ) : (
                        <p className="mt-1 text-gray-900">{profile.postalCode || 'Ej angivet'}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="city">Stad</Label>
                      {editing ? (
                        <TextInput
                          id="city"
                          value={editedProfile.city || ''}
                          onChange={(e) => setEditedProfile({...editedProfile, city: e.target.value})}
                          placeholder="Stockholm"
                        />
                      ) : (
                        <p className="mt-1 text-gray-900">{profile.city || 'Ej angivet'}</p>
                      )}
                    </div>
                  </div>

                  {/* Account Status */}
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Kontostatus</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <Badge color={profile.inskriven ? 'success' : 'warning'}>
                          {profile.inskriven ? 'Inskriven' : 'Ej inskriven'}
                        </Badge>
                      </div>
                      {profile.inskriven && profile.inskrivenDate && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Inskriven datum:</span>
                          <span className="text-gray-900">{formatDate(profile.inskrivenDate)}</span>
                        </div>
                      )}
                      {profile.customerNumber && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Kundnummer:</span>
                          <span className="text-gray-900">{profile.customerNumber}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <div className="p-4 text-center">
              <Mail className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-medium text-gray-900 mb-2">Ändra lösenord</h3>
              <p className="text-sm text-gray-600 mb-4">Uppdatera ditt kontolösenord</p>
              <Button size="sm" color="blue" onClick={() => toast.info('Funktion kommer snart')}>
                Ändra lösenord
              </Button>
            </div>
          </Card>

          <Card>
            <div className="p-4 text-center">
              <Calendar className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-medium text-gray-900 mb-2">Bokningsinställningar</h3>
              <p className="text-sm text-gray-600 mb-4">Hantera dina bokningspreferenser</p>
              <Button size="sm" color="green" onClick={() => toast.info('Funktion kommer snart')}>
                Inställningar
              </Button>
            </div>
          </Card>

          <Card>
            <div className="p-4 text-center">
              <User className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <h3 className="font-medium text-gray-900 mb-2">Sekretess</h3>
              <p className="text-sm text-gray-600 mb-4">Hantera dina sekretessinställningar</p>
              <Button size="sm" color="purple" onClick={() => toast.info('Funktion kommer snart')}>
                Sekretess
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
