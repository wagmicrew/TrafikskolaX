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

// User data structure
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
  // Utbildningskort fields
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
  const { user } = useAuth();
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

  const fetchUserData = async () => { ... };

  const handleInputChange = (e) => { ... };

  const handleAvatarChange = (e) => { ... };

  const handleAvatarUpload = async () => { ... };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!userData) return;
    setSaving(true);
    // Submit logic here
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      addToast({ type: 'error', message: 'Password mismatch.' });
      return;
    }
    if (password.length < 6) {
      addToast({ type: 'error', message: 'Password too short.' });
      return;
    }
    setSaving(true);
    // Password update logic here
  };

  if (loading) return <LoadingSpinner />;
  if (!userData) return <div>Could not load user data.</div>;

  return (
    <div className="w-full space-y-6">
      <form onSubmit={handleProfileSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Keep your information up-to-date.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={userData.profileImage} alt="User avatar" />
                <AvatarFallback>{userData.firstName?.[0]}{userData.lastName?.[0]}</AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <Label htmlFor="avatar">Upload new profile image</Label>
                <Input id="avatar" type="file" onChange={handleAvatarChange} />
                <Button type="button" onClick={handleAvatarUpload} disabled={saving || !avatarFile}>
                  {saving ? 'Uploading...' : 'Upload'}
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" name="firstName" value={userData.firstName} onChange={handleInputChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" name="lastName" value={userData.lastName} onChange={handleInputChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" value={userData.email} onChange={handleInputChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" name="phone" value={userData.phone || ''} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="personalNumber">Personal Number</Label>
                <Input id="personalNumber" name="personalNumber" value={userData.personalNumber || ''} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" name="address" value={userData.address || ''} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postalCode">Postal Code</Label>
                <Input id="postalCode" name="postalCode" value={userData.postalCode || ''} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" name="city" value={userData.city || ''} onChange={handleInputChange} />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
          </CardFooter>
        </Card>
      </form>
      <form onSubmit={handleProfileSubmit}> {/* Education Form Logic */}
        <Card>
          <CardHeader>
            <CardTitle>Education Card</CardTitle>
            <CardDescription>Details for your education card. Some fields are editable only by teachers or admins.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="workplace">Workplace</Label>
                <Input id="workplace" name="workplace" value={userData.workplace || ''} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="workPhone">Work Phone</Label>
                <Input id="workPhone" name="workPhone" value={userData.workPhone || ''} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mobilePhone">Mobile Phone</Label>
                <Input id="mobilePhone" name="mobilePhone" value={userData.mobilePhone || ''} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="kkValidityDate">KK Validity Date</Label>
                <Input id="kkValidityDate" name="kkValidityDate" type="date" value={userData.kkValidityDate || ''} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label>Risk Education 1</Label>
                <Input type="date" value={userData.riskEducation1 || ''} disabled />
              </div>
              <div className="space-y-2">
                <Label>Risk Education 2</Label>
                <Input type="date" value={userData.riskEducation2 || ''} disabled />
              </div>
              <div className="space-y-2">
                <Label>Knowledge Test</Label>
                <Input type="date" value={userData.knowledgeTest || ''} disabled />
              </div>
              <div className="space-y-2">
                <Label>Driving Test</Label>
                <Input type="date" value={userData.drivingTest || ''} disabled />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <textarea id="notes" name="notes" value={userData.notes || ''} onChange={handleInputChange} className="w-full p-2 border rounded" rows={4} />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Education Card'}</Button>
          </CardFooter>
        </Card>
      </form>
      <form onSubmit={handlePasswordSubmit}> {/* Password Form Logic */}
        <Card>
          <CardHeader>
            <CardTitle>Password</CardTitle>
            <CardDescription>Change your password here.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={saving}>{saving ? 'Changing...' : 'Change Password'}</Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}

export default SettingsClient;

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

// Define the user data structure
interface UserData {
  firstName: string
  lastName: string
  email: string
  phone?: string
  personalNumber?: string
  address?: string
  postalCode?: string
  city?: string
  profileImage?: string
  // Utbildningskort fields
  workplace?: string
  workPhone?: string
  mobilePhone?: string
  kkValidityDate?: string
  riskEducation1?: string
  riskEducation2?: string
  knowledgeTest?: string
  drivingTest?: string
  notes?: string
}

function SettingsClient() {
  const { user, login } = useAuth()
  const { addToast } = useToast()
  const [userData, setUserData] = useState<UserData | null>(null)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)

  useEffect(() => {
    if (user) {
      fetchUserData()
    }
  }, [user])

  const fetchUserData = async () => {
    try {
      const response = await fetch(`/api/admin/users/${user?.userId}`)
      if (!response.ok) throw new Error('Failed to fetch user data')
      const data = await response.json()
      setUserData(data.user)
    } catch (error) {
      console.error('Error fetching user data:', error)
      addToast({ type: 'error', message: 'Kunde inte hämta användardata.' })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setUserData(prev => prev ? { ...prev, [name]: value } : null)
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAvatarFile(e.target.files[0])
    }
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userData) return
    setSaving(true)

    try {
      const response = await fetch(`/api/admin/users/${user?.userId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userData),
        }
      )

      if (!response.ok) throw new Error('Failed to update profile')

      const result = await response.json()
      addToast({ type: 'success', message: 'Profilen har uppdaterats!' })
      // Update user context if login function can handle a user object
      // login(result.token) // Assuming the API returns a new token
    } catch (error) {
      addToast({ type: 'error', message: 'Kunde inte uppdatera profilen.' })
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      addToast({ type: 'error', message: 'Lösenorden matchar inte.' })
      return
    }
    if (password.length < 6) {
      addToast({ type: 'error', message: 'Lösenordet måste vara minst 6 tecken.' })
      return
    }
    setSaving(true)

    try {
      const response = await fetch(`/api/admin/users/${user?.userId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password }),
        }
      )

      if (!response.ok) throw new Error('Failed to change password')

      addToast({ type: 'success', message: 'Lösenordet har ändrats!' })
      setPassword('')
      setConfirmPassword('')
    } catch (error) {
      addToast({ type: 'error', message: 'Kunde inte ändra lösenordet.' })
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarUpload = async () => {
    if (!avatarFile) return
    setSaving(true)

    const formData = new FormData()
    formData.append('avatar', avatarFile)

    try {
      const response = await fetch(`/api/admin/users/${user?.userId}/avatar`,
        {
          method: 'POST',
          body: formData,
        }
      )

      if (!response.ok) throw new Error('Failed to upload avatar')
      
      const result = await response.json()
      setUserData(prev => prev ? { ...prev, profileImage: result.imageUrl } : null)
      addToast({ type: 'success', message: 'Profilbilden har laddats upp!' })
      // Potentially update auth context

    } catch (error) {
      addToast({ type: 'error', message: 'Kunde inte ladda upp profilbilden.' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingSpinner />
  if (!userData) return <div>Kunde inte ladda användardata.</div>

  return (

     3cdiv className="w-full" 3e
       3cCard 3e
         3cCardHeader 3e
           3cCardTitle 3ePersonlig information 3c/CardTitle 3e
           3cCardDescription 3eHåll din information uppdaterad. 3c/CardDescription 3e
         3c/CardHeader 3e
         3cCardContent className="space-y-4" 3e
           3cdiv className="flex items-center space-x-4" 3e
             3cAvatar className="h-24 w-24" 3e
               3cAvatarImage src={userData.profileImage} alt="User avatar" / 3e
               3cAvatarFallback 3e{userData.firstName?.[0]}{userData.lastName?.[0]} 3c/AvatarFallback 3e
             3c/Avatar 3e
             3cdiv className="space-y-2" 3e
               3cLabel htmlFor="avatar" 3eLadda upp ny profilbild 3c/Label 3e
               3cInput id="avatar" type="file" onChange={handleAvatarChange} / 3e
               3cButton type="button" onClick={handleAvatarUpload} disabled={saving || !avatarFile} 3e
                {saving ? 'Laddar upp...' : 'Ladda upp'}
               3c/Button 3e
             3c/div 3e
           3c/div 3e
           3cdiv className="grid grid-cols-1 md:grid-cols-2 gap-4" 3e
             3cdiv className="space-y-2" 3e
               3cLabel htmlFor="firstName" 3eFörnamn 3c/Label 3e
               3cInput id="firstName" name="firstName" value={userData.firstName} onChange={handleInputChange} required / 3e
             3c/div 3e
             3cdiv className="space-y-2" 3e
               3cLabel htmlFor="lastName" 3eEfternamn 3c/Label 3e
               3cInput id="lastName" name="lastName" value={userData.lastName} onChange={handleInputChange} required / 3e
             3c/div 3e
             3cdiv className="space-y-2" 3e
               3cLabel htmlFor="email" 3eE-post 3c/Label 3e
               3cInput id="email" name="email" type="email" value={userData.email} onChange={handleInputChange} required / 3e
             3c/div 3e
             3cdiv className="space-y-2" 3e
               3cLabel htmlFor="phone" 3eTelefonnummer 3c/Label 3e
               3cInput id="phone" name="phone" value={userData.phone || ''} onChange={handleInputChange} / 3e
             3c/div 3e
              3cdiv className="space-y-2" 3e
               3cLabel htmlFor="personalNumber" 3ePersonnummer 3c/Label 3e
               3cInput id="personalNumber" name="personalNumber" value={userData.personalNumber || ''} onChange={handleInputChange} / 3e
             3c/div 3e
             3cdiv className="space-y-2" 3e
               3cLabel htmlFor="address" 3eAdress 3c/Label 3e
               3cInput id="address" name="address" value={userData.address || ''} onChange={handleInputChange} / 3e
             3c/div 3e
              3cdiv className="space-y-2" 3e
               3cLabel htmlFor="postalCode" 3ePostnummer 3c/Label 3e
               3cInput id="postalCode" name="postalCode" value={userData.postalCode || ''} onChange={handleInputChange} / 3e
             3c/div 3e
             3cdiv className="space-y-2" 3e
               3cLabel htmlFor="city" 3eStad 3c/Label 3e
               3cInput id="city" name="city" value={userData.city || ''} onChange={handleInputChange} / 3e
             3c/div 3e
           3c/div 3e
           3c/CardContent 3e
           3cCardFooter 3e
             3cButton type="submit" disabled={saving} 3e{saving ? 'Sparar...' : 'Spara ändringar'} 3c/Button 3e
           3c/CardFooter 3e
         3c/Card 3e
       3c/form 3e

       3cform onSubmit={handleProfileSubmit} 3e
             3cdiv className="grid grid-cols-1 md:grid-cols-2 gap-4" 3e
               3cdiv className="space-y-2" 3e
                 3cLabel htmlFor="workplace" 3eArbetsplats 3c/Label 3e
                 3cInput id="workplace" name="workplace" value={userData.workplace || ''} onChange={handleInputChange} / 3e
               3c/div 3e
               3cdiv className="space-y-2" 3e
                 3cLabel htmlFor="workPhone" 3eArbetstelefon 3c/Label 3e
                 3cInput id="workPhone" name="workPhone" value={userData.workPhone || ''} onChange={handleInputChange} / 3e
               3c/div 3e
               3cdiv className="space-y-2" 3e
                 3cLabel htmlFor="mobilePhone" 3eMobiltelefon 3c/Label 3e
                 3cInput id="mobilePhone" name="mobilePhone" value={userData.mobilePhone || ''} onChange={handleInputChange} / 3e
               3c/div 3e
               3cdiv className="space-y-2" 3e
                 3cLabel htmlFor="kkValidityDate" 3eKK-giltighetsdatum 3c/Label 3e
                 3cInput id="kkValidityDate" name="kkValidityDate" type="date" value={userData.kkValidityDate || ''} onChange={handleInputChange} / 3e
               3c/div 3e
              
              {/* Fields editable only by admin/teacher */}
               3cdiv className="space-y-2" 3e
                 3cLabel 3eRiskutbildning 1 3c/Label 3e
                 3cInput type="date" value={userData.riskEducation1 || ''} disabled / 3e
               3c/div 3e
               3cdiv className="space-y-2" 3e
                 3cLabel 3eRiskutbildning 2 3c/Label 3e
                 3cInput type="date" value={userData.riskEducation2 || ''} disabled / 3e
               3c/div 3e
               3cdiv className="space-y-2" 3e
                 3cLabel 3eKunskapsprov 3c/Label 3e
                 3cInput type="date" value={userData.knowledgeTest || ''} disabled / 3e
               3c/div 3e
               3cdiv className="space-y-2" 3e
                 3cLabel 3eKörprov 3c/Label 3e
                 3cInput type="date" value={userData.drivingTest || ''} disabled / 3e
               3c/div 3e
              
               3cdiv className="md:col-span-2 space-y-2" 3e
                 3cLabel htmlFor="notes" 3eAnteckningar 3c/Label 3e
                 3ctextarea id="notes" name="notes" value={userData.notes || ''} onChange={handleInputChange} className="w-full p-2 border rounded" rows={4} / 3e
               3c/div 3e
             3c/div 3e
           3c/CardContent 3e
           3cCardFooter 3e
             3cButton type="submit" disabled={saving} 3e{saving ? 'Spara Utbildningskort...' : 'Spara Utbildningskort'} 3c/Button 3e
           3c/CardFooter 3e
         3c/Card 3e
       3c/form 3e

       3cform onSubmit={handlePasswordSubmit} 3e
         3cCard 3e
           3cCardHeader 3e
             3cCardTitle 3eLösenord 3c/CardTitle 3e
             3cCardDescription 3eÄndra ditt lösenord här. 3c/CardDescription 3e
           3c/CardHeader 3e
           3cCardContent className="space-y-4" 3e
             3cdiv className="space-y-2" 3e
               3cLabel htmlFor="password" 3eNytt lösenord 3c/Label 3e
               3cInput id="password" type="password" value={password} onChange={(e) = 3e setPassword(e.target.value)} / 3e
             3c/div 3e
             3cdiv className="space-y-2" 3e
               3cLabel htmlFor="confirmPassword" 3eBekräfta nytt lösenord 3c/Label 3e
               3cInput id="confirmPassword" type="password" value={confirmPassword} onChange={(e) = 3e setConfirmPassword(e.target.value)} / 3e
             3c/div 3e
           3c/CardContent 3e
           3cCardFooter 3e
             3cButton type="submit" disabled={saving} 3e{saving ? 'Ändrar...' : 'Ändra lösenord'} 3c/Button 3e
           3c/CardFooter 3e
          3c/Card 3e
       3c/form 3e
     3c/div 3e
  )
}

export default SettingsClient

