'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useToast } from '@/lib/hooks/use-toast';
import { LoadingSpinner } from '@/components/loading-spinner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface UserData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  personalNumber?: string;
  address?: string;
  postalCode?: string;
  city?: string;
  profileImage?: string;
  workplace?: string;
  workPhone?: string;
  mobilePhone?: string;
  kkValidityDate?: string;
  riskEducation1?: string;
  riskEducation2?: string;
  knowledgeTest?: string;
  drivingTest?: string;
  notes?: string;
}

function SettingsClient() {
  const { user, refreshUser } = useAuth();
  const { addToast } = useToast();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
  try {
    const response = await fetch('/api/user/profile', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
      }
    });
    if (!response.ok) throw new Error('Failed to fetch user data');
    const data = await response.json();
    setUserData(data.user);
  } catch (error) {
    console.error('Error fetching user data:', error);
    addToast({ type: 'error', message: 'Kunde inte hämta användardata.' });
  } finally {
    setLoading(false);
  }
};

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setUserData(prev => prev ? { ...prev, [name]: value } : null);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAvatarFile(e.target.files[0]);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData) return;
    setSaving(true);

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) throw new Error('Failed to update profile');

      const result = await response.json();
      addToast({ type: 'success', message: 'Profilen har uppdaterats!' });
    } catch (error) {
      addToast({ type: 'error', message: 'Kunde inte uppdatera profilen.' });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      addToast({ type: 'error', message: 'Lösenorden matchar inte.' });
      return;
    }
    if (password.length < 6) {
      addToast({ type: 'error', message: 'Lösenordet måste vara minst 6 tecken.' });
      return;
    }
    setSaving(true);

    try {
      const response = await fetch(`/api/admin/users/${user?.userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) throw new Error('Failed to change password');

      addToast({ type: 'success', message: 'Lösenordet har ändrats!' });
      setPassword('');
      setConfirmPassword('');
    } catch (error) {
      addToast({ type: 'error', message: 'Kunde inte ändra lösenordet.' });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) return;
    setSaving(true);

    const formData = new FormData();
    formData.append('avatar', avatarFile);

    try {
      const response = await fetch('/api/user/avatar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        },
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to upload avatar');
      
      const result = await response.json();
      setUserData(prev => prev ? { ...prev, profileImage: result.avatarUrl } : null);
      addToast({ type: 'success', message: 'Profilbilden har laddats upp!' });
      setAvatarFile(null);
      // Refresh user data to update avatar in menu
      await refreshUser();
    } catch (error) {
      addToast({ type: 'error', message: 'Kunde inte ladda upp profilbilden.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!userData) return <div>Kunde inte ladda användardata.</div>;

  return (
    <div className="w-full space-y-6">
      {/* Profile Information Section */}
      <form onSubmit={handleProfileSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Personlig information</CardTitle>
            <CardDescription>Håll din information uppdaterad.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={userData.profileImage} alt="User avatar" />
                <AvatarFallback>{userData.firstName?.[0]}{userData.lastName?.[0]}</AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <Label htmlFor="avatar">Ladda upp ny profilbild</Label>
                <Input id="avatar" type="file" onChange={handleAvatarChange} accept="image/*" />
                <Button type="button" onClick={handleAvatarUpload} disabled={saving || !avatarFile}>
                  {saving ? 'Laddar upp...' : 'Ladda upp'}
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Förnamn</Label>
                <Input id="firstName" name="firstName" value={userData.firstName} onChange={handleInputChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Efternamn</Label>
                <Input id="lastName" name="lastName" value={userData.lastName} onChange={handleInputChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-post</Label>
                <Input id="email" name="email" type="email" value={userData.email} onChange={handleInputChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefonnummer</Label>
                <Input id="phone" name="phone" value={userData.phone || ''} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="personalNumber">Personnummer</Label>
                <Input id="personalNumber" name="personalNumber" value={userData.personalNumber || ''} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Adress</Label>
                <Input id="address" name="address" value={userData.address || ''} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postalCode">Postnummer</Label>
                <Input id="postalCode" name="postalCode" value={userData.postalCode || ''} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Stad</Label>
                <Input id="city" name="city" value={userData.city || ''} onChange={handleInputChange} />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={saving}>{saving ? 'Sparar...' : 'Spara ändringar'}</Button>
          </CardFooter>
        </Card>
      </form>

      {/* Education Card Section - Only show for students */}
      {user?.role === 'student' && (
        <form onSubmit={handleProfileSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Utbildningskort</CardTitle>
              <CardDescription>Information för ditt utbildningskort. Vissa fält kan bara redigeras av lärare eller administratörer.</CardDescription>
            </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="workplace">Arbetsplats</Label>
                <Input id="workplace" name="workplace" value={userData.workplace || ''} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="workPhone">Arbetstelefon</Label>
                <Input id="workPhone" name="workPhone" value={userData.workPhone || ''} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mobilePhone">Mobiltelefon</Label>
                <Input id="mobilePhone" name="mobilePhone" value={userData.mobilePhone || ''} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="kkValidityDate">KK-giltighetsdatum</Label>
                <Input id="kkValidityDate" name="kkValidityDate" type="date" value={userData.kkValidityDate || ''} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label>Riskutbildning 1</Label>
                <Input type="date" value={userData.riskEducation1 || ''} disabled />
              </div>
              <div className="space-y-2">
                <Label>Riskutbildning 2</Label>
                <Input type="date" value={userData.riskEducation2 || ''} disabled />
              </div>
              <div className="space-y-2">
                <Label>Kunskapsprov</Label>
                <Input type="date" value={userData.knowledgeTest || ''} disabled />
              </div>
              <div className="space-y-2">
                <Label>Körprov</Label>
                <Input type="date" value={userData.drivingTest || ''} disabled />
              </div>
              {/* Notes field - Hidden for students as they don't need to see teacher/admin notes */}
              {user?.role !== 'student' && (
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="notes">Anteckningar</Label>
                  <textarea 
                    id="notes" 
                    name="notes" 
                    value={userData.notes || ''} 
                    onChange={handleInputChange} 
                    className="w-full p-2 border rounded" 
                    rows={4} 
                  />
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={saving}>{saving ? 'Sparar...' : 'Spara Utbildningskort'}</Button>
          </CardFooter>
        </Card>
      </form>
      )}

      {/* Security Section */}
      <form onSubmit={handlePasswordSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Lösenord</CardTitle>
            <CardDescription>Ändra ditt lösenord här.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nytt lösenord</Label>
              <Input 
                id="password" 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Bekräfta nytt lösenord</Label>
              <Input 
                id="confirmPassword" 
                type="password" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={saving}>{saving ? 'Ändrar...' : 'Ändra lösenord'}</Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}

export default SettingsClient;
