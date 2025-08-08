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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  Lock, 
  Camera, 
  Save, 
  X, 
  Edit, 
  Shield,
  Mail,
  Phone,
  MapPin,
  Calendar,
  FileText
} from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState('profile');

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
      if (refreshUser) refreshUser();
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
      addToast({ type: 'error', message: 'Lösenordet måste vara minst 6 tecken långt.' });
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) throw new Error('Failed to update password');

      addToast({ type: 'success', message: 'Lösenordet har uppdaterats!' });
      setPassword('');
      setConfirmPassword('');
    } catch (error) {
      addToast({ type: 'error', message: 'Kunde inte uppdatera lösenordet.' });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) return;
    setSaving(true);

    try {
      const formData = new FormData();
      formData.append('avatar', avatarFile);

      const response = await fetch('/api/user/avatar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        },
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to upload avatar');

      addToast({ type: 'success', message: 'Profilbilden har uppdaterats!' });
      if (refreshUser) refreshUser();
      setAvatarFile(null);
    } catch (error) {
      addToast({ type: 'error', message: 'Kunde inte ladda upp profilbilden.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-white/10 border border-white/20">
          <TabsTrigger 
            value="profile" 
            className="text-white data-[state=active]:bg-white/20 data-[state=active]:text-white"
          >
            <User className="w-4 h-4 mr-2" />
            Profil
          </TabsTrigger>
          <TabsTrigger 
            value="security" 
            className="text-white data-[state=active]:bg-white/20 data-[state=active]:text-white"
          >
            <Lock className="w-4 h-4 mr-2" />
            Säkerhet
          </TabsTrigger>
          <TabsTrigger 
            value="avatar" 
            className="text-white data-[state=active]:bg-white/20 data-[state=active]:text-white"
          >
            <Camera className="w-4 h-4 mr-2" />
            Profilbild
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card className="bg-white/10 border border-white/20 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <User className="w-5 h-5 mr-2" />
                Personlig Information
              </CardTitle>
              <CardDescription className="text-gray-300">
                Uppdatera din personliga information och kontaktuppgifter
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-white">Förnamn</Label>
                    <Input
                      name="firstName"
                      value={userData?.firstName || ''}
                      onChange={handleInputChange}
                      className="bg-white/5 border-white/20 text-white placeholder:text-gray-400"
                      placeholder="Ditt förnamn"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white">Efternamn</Label>
                    <Input
                      name="lastName"
                      value={userData?.lastName || ''}
                      onChange={handleInputChange}
                      className="bg-white/5 border-white/20 text-white placeholder:text-gray-400"
                      placeholder="Ditt efternamn"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-white flex items-center">
                    <Mail className="w-4 h-4 mr-2" />
                    E-post
                  </Label>
                  <Input
                    name="email"
                    type="email"
                    value={userData?.email || ''}
                    onChange={handleInputChange}
                    className="bg-white/5 border-white/20 text-white placeholder:text-gray-400"
                    placeholder="din.email@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-white flex items-center">
                    <Phone className="w-4 h-4 mr-2" />
                    Telefon
                  </Label>
                  <Input
                    name="phone"
                    value={userData?.phone || ''}
                    onChange={handleInputChange}
                    className="bg-white/5 border-white/20 text-white placeholder:text-gray-400"
                    placeholder="070-123 45 67"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Personnummer</Label>
                  <Input
                    name="personalNumber"
                    value={userData?.personalNumber || ''}
                    onChange={handleInputChange}
                    className="bg-white/5 border-white/20 text-white placeholder:text-gray-400"
                    placeholder="YYYYMMDD-XXXX"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-white flex items-center">
                    <MapPin className="w-4 h-4 mr-2" />
                    Adress
                  </Label>
                  <Input
                    name="address"
                    value={userData?.address || ''}
                    onChange={handleInputChange}
                    className="bg-white/5 border-white/20 text-white placeholder:text-gray-400"
                    placeholder="Gatunamn 123"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-white">Postnummer</Label>
                    <Input
                      name="postalCode"
                      value={userData?.postalCode || ''}
                      onChange={handleInputChange}
                      className="bg-white/5 border-white/20 text-white placeholder:text-gray-400"
                      placeholder="123 45"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white">Stad</Label>
                    <Input
                      name="city"
                      value={userData?.city || ''}
                      onChange={handleInputChange}
                      className="bg-white/5 border-white/20 text-white placeholder:text-gray-400"
                      placeholder="Stockholm"
                    />
                  </div>
                </div>

                <CardFooter className="flex justify-end space-x-4 pt-6 border-t border-white/10">
                  <Button
                    type="submit"
                    disabled={saving}
                    className="bg-sky-500 hover:bg-sky-600 text-white"
                  >
                    {saving ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Sparar...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <Save className="w-4 h-4 mr-2" />
                        Spara Ändringar
                      </div>
                    )}
                  </Button>
                </CardFooter>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card className="bg-white/10 border border-white/20 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Säkerhet
              </CardTitle>
              <CardDescription className="text-gray-300">
                Ändra ditt lösenord för att hålla ditt konto säkert
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-white">Nytt Lösenord</Label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-white/5 border-white/20 text-white placeholder:text-gray-400"
                    placeholder="Minst 6 tecken"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Bekräfta Lösenord</Label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-white/5 border-white/20 text-white placeholder:text-gray-400"
                    placeholder="Upprepa lösenordet"
                  />
                </div>

                <CardFooter className="flex justify-end space-x-4 pt-6 border-t border-white/10">
                  <Button
                    type="submit"
                    disabled={saving || !password || !confirmPassword}
                    className="bg-sky-500 hover:bg-sky-600 text-white"
                  >
                    {saving ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Uppdaterar...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <Lock className="w-4 h-4 mr-2" />
                        Uppdatera Lösenord
                      </div>
                    )}
                  </Button>
                </CardFooter>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="avatar" className="space-y-6">
          <Card className="bg-white/10 border border-white/20 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Camera className="w-5 h-5 mr-2" />
                Profilbild
              </CardTitle>
              <CardDescription className="text-gray-300">
                Ladda upp en ny profilbild för ditt konto
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center space-x-6">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={userData?.profileImage} />
                    <AvatarFallback className="bg-white/10 text-white text-xl">
                      {userData?.firstName?.[0]}{userData?.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <Label className="text-white">Välj Bild</Label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="bg-white/5 border-white/20 text-white file:bg-white/10 file:border-white/20 file:text-white file:rounded file:px-3 file:py-1 file:mr-4"
                    />
                  </div>
                </div>

                <CardFooter className="flex justify-end space-x-4 pt-6 border-t border-white/10">
                  <Button
                    onClick={handleAvatarUpload}
                    disabled={saving || !avatarFile}
                    className="bg-sky-500 hover:bg-sky-600 text-white"
                  >
                    {saving ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Laddar upp...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <Camera className="w-4 h-4 mr-2" />
                        Ladda Upp Bild
                      </div>
                    )}
                  </Button>
                </CardFooter>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default SettingsClient;
