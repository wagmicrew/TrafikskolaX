
// @ts-nocheck
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, Mail, Calendar, CreditCard, Key, Edit3, Save, ShieldAlert } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import UserCreditsPanel from "@/components/Admin/UserCreditsPanel";

interface UserDetailProps {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: "student" | "teacher" | "admin";
    isActive: boolean;
    inskriven: boolean;
    inskrivenDate: string | null;
    customPrice: string | null;
    bookingCount: number;
    profileImage?: string;
    personalNumber?: string;
    riskEducation1?: string;
    riskEducation2?: string;
    knowledgeTest?: string;
    drivingTest?: string;
    teacherNotes?: string;
    password?: string;
    confirmPassword?: string;
  };
}

export default function UserDetailClient({ user }: UserDetailProps) {
  const [formData, setFormData] = useState({
    ...user,
    password: '',
    confirmPassword: '',
  } as typeof user & { password?: string; confirmPassword?: string });
  const [detailsChanged, setDetailsChanged] = useState(false);
  const [educationChanged, setEducationChanged] = useState(false);
  const [detailsEditMode, setDetailsEditMode] = useState(false);
  const [educationEditMode, setEducationEditMode] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const isNew = user.id === 'new';
  const [showCreateDialog, setShowCreateDialog] = useState(isNew);
  const [creating, setCreating] = useState(false);
  const [impersonating, setImpersonating] = useState(false);
  const [showImpersonationBar, setShowImpersonationBar] = useState(false);

  const handleDetailsInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setDetailsChanged(true);
    const target = event.target;
    const value = target.type === 'checkbox' ? (target as HTMLInputElement).checked : target.value;
    setFormData((prev: typeof formData) => ({ ...prev, [target.name]: value }));
  };

  const handleEducationInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setEducationChanged(true);
    const target = event.target;
    const value = target.type === 'checkbox' ? (target as HTMLInputElement).checked : target.value;
    setFormData((prev: typeof formData) => ({ ...prev, [target.name]: value }));
  };

  const handleRoleChange = (value: "student" | "teacher" | "admin") => {
    setDetailsChanged(true);
    setFormData(prev => ({ ...prev, role: value }));
  };

  const handleSaveDetails = async () => {
    try {
      const {
        password: _omitPwd,
        confirmPassword: _omitConfirm,
        personalNumber: _omitPersonal,
        riskEducation1: _omitR1,
        riskEducation2: _omitR2,
        knowledgeTest: _omitKT,
        drivingTest: _omitDT,
        teacherNotes: _omitNotes,
        ...general
      } = formData as any;

      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(general),
      });

      if (response.ok) {
        toast({ title: 'Klart', description: 'Uppgifter sparade', variant: 'default' });
        setDetailsEditMode(false);
        setDetailsChanged(false);
        router.refresh();
      } else {
        toast({ title: 'Fel', description: 'Kunde inte spara uppgifter', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Fel', description: 'Ett fel uppstod vid sparande', variant: 'destructive' });
    }
  };

  const handleGeneratePassword = async () => {
    try {
      const response = await fetch('/api/admin/users/generate-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id }),
      });

      if (response.ok) {
        const result = await response.json();
        toast({ title: 'Nytt lösenord', description: result.password, variant: 'default' });
      } else {
        toast({ title: 'Fel', description: 'Kunde inte generera lösenord', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Fel', description: 'Ett fel uppstod vid generering', variant: 'destructive' });
    }
  };

const handlePasswordChange = async () => {
    if (!formData.password || formData.password !== formData.confirmPassword) {
      toast({ title: 'Fel', description: 'Lösenorden matchar inte', variant: 'destructive' });
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: formData.password }),
      });

      if (response.ok) {
        toast({ title: 'Klart', description: 'Lösenord uppdaterat', variant: 'default' });
        setFormData((prev: typeof formData) => ({ ...prev, password: '', confirmPassword: '' }));
      } else {
        toast({ title: 'Fel', description: 'Kunde inte uppdatera lösenord', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Fel', description: 'Misslyckades att uppdatera lösenord', variant: 'destructive' });
    }
  };

  const handleSaveEducation = async () => {
    try {
      const payload: any = {
        personalNumber: formData.personalNumber,
        riskEducation1: formData.riskEducation1,
        riskEducation2: formData.riskEducation2,
        knowledgeTest: formData.knowledgeTest,
        drivingTest: formData.drivingTest,
        teacherNotes: formData.teacherNotes,
      };

      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast({ title: 'Klart', description: 'Utbildningsuppgifter sparade', variant: 'default' });
        setEducationEditMode(false);
        setEducationChanged(false);
        router.refresh();
      } else {
        toast({ title: 'Fel', description: 'Kunde inte spara utbildningsuppgifter', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Fel', description: 'Ett fel uppstod vid sparande', variant: 'destructive' });
    }
  };

  const handleCreateUser = async () => {
    setCreating(true);
    try {
      const payload = {
        email: formData.email,
        password: formData.password || 'Password123!',
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: (formData as any).phone || '',
        role: formData.role,
      };
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: 'Fel', description: data.error || 'Misslyckades att skapa användare', variant: 'destructive' });
        return;
      }
      toast({ title: 'Klart', description: 'Användare skapad', variant: 'default' });
      setShowCreateDialog(false);
      router.push(`/dashboard/admin/users/${data.user.id}`);
    } catch (e) {
      toast({ title: 'Fel', description: 'Misslyckades att skapa användare', variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const impersonateUser = async () => {
    try {
      setImpersonating(true);
      const res = await fetch('/api/auth/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast({ title: 'Fel', description: data.error || 'Kunde inte hämta användarsession', variant: 'destructive' });
        return;
      }
      const json = await res.json();
      if (json?.adminToken) {
        try { localStorage.setItem('admin-session-token', json.adminToken); } catch {}
      }
      if (json?.token) {
        // Persist token in both cookie and localStorage
        try { localStorage.setItem('auth-token', json.token); } catch {}
        document.cookie = `auth-token=${json.token}; path=/; max-age=604800; SameSite=Lax`;
        try {
          const payload = JSON.parse(atob(json.token.split('.')[1] || ''))
          const role = payload?.role
          const target = role === 'admin' ? '/dashboard/admin' : role === 'teacher' ? '/dashboard/teacher' : '/dashboard/student'
          toast({ title: 'Aktivt', description: `Tillfällig session: ${role}`, variant: 'default' });
          setShowImpersonationBar(true);
          router.push(target);
          return;
        } catch {}
      }
      toast({ title: 'Aktivt', description: 'Tillfällig användarsession satt', variant: 'default' });
      setShowImpersonationBar(true);
      router.push('/dashboard/student');
    } catch (e) {
      toast({ title: 'Fel', description: 'Misslyckades att hämta användarsession', variant: 'destructive' });
    } finally {
      setImpersonating(false);
    }
  };

  const restoreAdminSession = async () => {
    try {
      const res = await fetch('/api/auth/impersonate', { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast({ title: 'Fel', description: data.error || 'Kunde inte återställa adminsession', variant: 'destructive' });
        return;
      }
      try {
        const data = await res.json();
        if (data?.token) {
          try { localStorage.setItem('auth-token', data.token); } catch {}
          document.cookie = `auth-token=${data.token}; path=/; max-age=604800; SameSite=Lax`;
        } else {
          const backup = localStorage.getItem('admin-session-token');
          if (backup) {
            try { localStorage.setItem('auth-token', backup); } catch {}
            document.cookie = `auth-token=${backup}; path=/; max-age=604800; SameSite=Lax`;
          } else {
            try { localStorage.removeItem('auth-token'); } catch {}
            document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
          }
        }
      } catch {}
      toast({ title: 'Återställd', description: 'Adminsession återställd', variant: 'default' });
      setShowImpersonationBar(false);
      router.push('/dashboard/admin');
    } catch {
      toast({ title: 'Fel', description: 'Misslyckades att återställa adminsession', variant: 'destructive' });
    }
  };

return (
    <>
      {showCreateDialog && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Ny användare</h3>
                <button onClick={() => { setShowCreateDialog(false); router.back(); }} className="text-white/70 hover:text-white">×</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input placeholder="Förnamn" value={formData.firstName} onChange={(e) => setFormData((prev)=>({...prev, firstName: e.target.value}))} className="bg-white/10 border-white/20 text-white placeholder:text-slate-300" />
                <Input placeholder="Efternamn" value={formData.lastName} onChange={(e) => setFormData((prev)=>({...prev, lastName: e.target.value}))} className="bg-white/10 border-white/20 text-white placeholder:text-slate-300" />
                <Input placeholder="E-post" type="email" value={formData.email} onChange={(e) => setFormData((prev)=>({...prev, email: e.target.value}))} className="bg-white/10 border-white/20 text-white placeholder:text-slate-300 col-span-1 md:col-span-2" />
                <Input placeholder="Telefon (valfritt)" value={(formData as any).phone || ''} onChange={(e) => setFormData((prev)=>({...prev, phone: e.target.value as any}))} className="bg-white/10 border-white/20 text-white placeholder:text-slate-300" />
                <Select value={formData.role} onValueChange={(value: any) => setFormData((prev)=>({...prev, role: value}))}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white"><SelectValue placeholder="Roll" /></SelectTrigger>
                  <SelectContent className="bg-slate-900/90 text-white border-white/10 z-[100]">
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="teacher">Lärare</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
                <Input placeholder="Lösenord" type="password" value={formData.password || ''} onChange={(e)=>setFormData((prev)=>({...prev, password: e.target.value}))} className="bg-white/10 border-white/20 text-white placeholder:text-slate-300" />
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={()=>{ setShowCreateDialog(false); router.back(); }} className="text-white border-white/20 hover:bg-white/10">Avbryt</Button>
                <Button onClick={handleCreateUser} disabled={creating} className="bg-sky-500 hover:bg-sky-600 text-white">{creating ? 'Skapar...' : 'Skapa användare'}</Button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showImpersonationBar && (
        <div className="fixed top-0 inset-x-0 z-[95] bg-yellow-500 text-black px-4 py-2 flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-2 font-semibold">
            <ShieldAlert className="w-5 h-5" />
            Du använder en tillfällig användarsession
          </div>
          <Button onClick={restoreAdminSession} className="bg-black/80 hover:bg-black text-yellow-300">Återgå till admin</Button>
        </div>
      )}
      <Card className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white shadow-2xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-white font-extrabold drop-shadow">
            <User className="w-6 h-6 text-sky-300" /> Användaruppgifter
          </CardTitle>
          <div className="flex items-center gap-2">
            {detailsEditMode ? (
              <Button
                onClick={handleSaveDetails}
                className="bg-emerald-600 hover:bg-emerald-500"
                disabled={!detailsChanged}
                title="Spara"
              >
                <Save className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={() => setDetailsEditMode(true)}
                variant="outline"
                className="bg-white/5 hover:bg-white/10 border-white/20 text-white"
                title="Redigera"
              >
                <Edit3 className="w-4 h-4" />
              </Button>
            )}
      </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Password Reset */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input
          type="password"
          name="password"
          placeholder="Nytt lösenord"
              value={formData.password || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              className="bg-white/10 border-white/20 text-white placeholder:text-slate-300"
        />
            <Input
          type="password"
          name="confirmPassword"
          placeholder="Bekräfta lösenord"
              value={formData.confirmPassword || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              className="bg-white/10 border-white/20 text-white placeholder:text-slate-300"
        />
            <Button onClick={handlePasswordChange} className="bg-emerald-600 hover:bg-emerald-500">
              <Key className="w-4 h-4" /> Spara lösenord
            </Button>
          </div>
      
      {/* Inskriven toggle */}
          {detailsEditMode && (
            <div className="flex items-center gap-3">
              <span className="font-semibold">Skriv in?</span>
              <Switch
                checked={!!formData.inskriven}
                onCheckedChange={(checked) => {
                  setDetailsChanged(true);
                  setFormData(prev => ({ ...prev, inskriven: checked }));
                }}
              />
            </div>
          )}
      
      {/* Booking */}
          <div>
            <Button
          onClick={() => router.push(`/dashboard/admin/bookings?user=${user.id}`)}
              className="bg-white/10 hover:bg-white/20 border border-white/20 text-white"
              variant="outline"
            >
              <Calendar className="w-4 h-4" /> Boka för användare
            </Button>
            <Button onClick={impersonateUser} disabled={impersonating} className="ml-3 bg-amber-500 hover:bg-amber-600 text-black">
              {impersonating ? 'Hämtar session...' : 'Gå till användarsession'}
            </Button>
      </div>

          {/* Name fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {detailsEditMode ? (
              <Input
            name="firstName"
            value={formData.firstName}
                onChange={handleDetailsInputChange}
                className="bg-white/10 border-white/20 text-white placeholder:text-slate-300"
          />
        ) : (
              <p className="text-lg font-semibold">{user.firstName}</p>
        )}

            {detailsEditMode ? (
              <Input
            name="lastName"
            value={formData.lastName}
                onChange={handleDetailsInputChange}
                className="bg-white/10 border-white/20 text-white placeholder:text-slate-300"
          />
        ) : (
              <p className="text-lg font-semibold">{user.lastName}</p>
        )}
      </div>

          {/* Email */}
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-slate-300" />
            {detailsEditMode ? (
              <Input
            name="email"
            value={formData.email}
                onChange={handleDetailsInputChange}
                className="bg-white/10 border-white/20 text-white placeholder:text-slate-300"
          />
        ) : (
              <p className="text-slate-200">{user.email}</p>
        )}
      </div>

          {/* Role */}
          <div className="flex items-center gap-4">
            <span className="font-semibold">Roll:</span>
            {detailsEditMode ? (
              <Select value={formData.role} onValueChange={handleRoleChange}>
                <SelectTrigger className="w-[200px] bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Välj roll" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900/90 text-white border-white/10">
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="teacher">Lärare</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <span className="text-slate-200">{user.role}</span>
        )}
      </div>

          {detailsEditMode && (
            <div>
              <Button onClick={handleGeneratePassword} className="bg-amber-600 hover:bg-amber-500">
            Generera lösenord
              </Button>
        </div>
      )}
        </CardContent>
      </Card>

      {/* Utbildningskort B Section */}
      <Card className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white shadow-2xl mt-8">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-white font-extrabold drop-shadow">
            <CreditCard className="w-6 h-6 text-sky-300" /> Utbildningskort B
          </CardTitle>
          <div className="flex items-center gap-2">
            {educationEditMode ? (
              <Button
                onClick={handleSaveEducation}
                className="bg-emerald-600 hover:bg-emerald-500"
                disabled={!educationChanged}
                title="Spara"
              >
                <Save className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={() => setEducationEditMode(true)}
                variant="outline"
                className="bg-white/5 hover:bg-white/10 border-white/20 text-white"
                title="Redigera"
              >
                <Edit3 className="w-4 h-4" />
              </Button>
        )}
      </div>
        </CardHeader>
        <CardContent>
      {/* User Info with Avatar */}
          <div className="flex items-center mb-8 p-4 rounded-xl bg-white/5 border border-white/10">
        <div className="flex-shrink-0 mr-6">
              <div className="h-24 w-24 rounded-full overflow-hidden border-4 border-white/20 shadow-xl">
            {user.profileImage ? (
              <img src={user.profileImage} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
                  <div className="h-full w-full flex items-center justify-center bg-sky-600 text-white text-2xl font-bold">
                {user.firstName?.[0]}{user.lastName?.[0]}
              </div>
            )}
          </div>
        </div>
        <div>
              <h4 className="font-bold text-xl text-white">{user.firstName} {user.lastName}</h4>
              <p className="text-slate-300">{user.email}</p>
              <div className="mt-1 flex items-center gap-2 text-sm text-slate-300">
                <span>Personnummer:</span>
                {educationEditMode ? (
                  <Input
              type="text"
              name="personalNumber"
              placeholder="ÅÅÅÅMMDD-XXXX"
              value={formData.personalNumber || ''}
                    onChange={handleEducationInputChange}
                    className="bg-white/10 border-white/20 text-white placeholder:text-slate-300 max-w-xs"
            />
          ) : (
            <span>{user.personalNumber || 'Ej angivet'}</span>
                )}
              </div>
        </div>
      </div>

      {/* Education Progress Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="space-y-4">
              <h4 className="font-bold text-white mb-3 drop-shadow">Teoretisk utbildning</h4>
          {/* Riskutbildning 1 */}
              <div className="flex items-center p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="flex-shrink-0 mr-3">
              {formData.riskEducation1 ? (
                    <div className="h-8 w-8 bg-emerald-600 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              ) : (
                    <div className="h-8 w-8 bg-white/10 rounded-full" />
              )}
            </div>
            <div className="flex-1">
                  <p className="font-medium text-white">Riskutbildning 1</p>
                  {educationEditMode ? (
                    <Input
                  type="date"
                  name="riskEducation1"
                  value={formData.riskEducation1 || ''}
                      onChange={handleEducationInputChange}
                      className="mt-1 bg-white/10 border-white/20 text-white placeholder:text-slate-300 max-w-xs"
                />
              ) : (
                    <p className="text-sm text-slate-300">
                  {formData.riskEducation1 ? `Genomförd: ${formData.riskEducation1}` : 'Ej genomförd'}
                </p>
              )}
            </div>
          </div>

          {/* Riskutbildning 2 */}
              <div className="flex items-center p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="flex-shrink-0 mr-3">
              {formData.riskEducation2 ? (
                    <div className="h-8 w-8 bg-emerald-600 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              ) : (
                    <div className="h-8 w-8 bg-white/10 rounded-full" />
              )}
            </div>
            <div className="flex-1">
                  <p className="font-medium text-white">Riskutbildning 2</p>
                  {educationEditMode ? (
                    <Input
                  type="date"
                  name="riskEducation2"
                  value={formData.riskEducation2 || ''}
                      onChange={handleEducationInputChange}
                      className="mt-1 bg-white/10 border-white/20 text-white placeholder:text-slate-300 max-w-xs"
                />
              ) : (
                    <p className="text-sm text-slate-300">
                  {formData.riskEducation2 ? `Genomförd: ${formData.riskEducation2}` : 'Ej genomförd'}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
              <h4 className="font-bold text-white mb-3 drop-shadow">Examination</h4>
          {/* Kunskapsprov */}
              <div className="flex items-center p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="flex-shrink-0 mr-3">
              {formData.knowledgeTest ? (
                    <div className="h-8 w-8 bg-emerald-600 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              ) : (
                    <div className="h-8 w-8 bg-white/10 rounded-full" />
              )}
            </div>
            <div className="flex-1">
                  <p className="font-medium text-white">Kunskapsprov</p>
                  {educationEditMode ? (
                    <Input
                  type="date"
                  name="knowledgeTest"
                  value={formData.knowledgeTest || ''}
                      onChange={handleEducationInputChange}
                      className="mt-1 bg-white/10 border-white/20 text-white placeholder:text-slate-300 max-w-xs"
                />
              ) : (
                    <p className="text-sm text-slate-300">
                  {formData.knowledgeTest ? `Godkänd: ${formData.knowledgeTest}` : 'Ej avlagt'}
                </p>
              )}
            </div>
          </div>

          {/* Körprov */}
              <div className="flex items-center p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="flex-shrink-0 mr-3">
              {formData.drivingTest ? (
                    <div className="h-8 w-8 bg-emerald-600 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              ) : (
                    <div className="h-8 w-8 bg-white/10 rounded-full" />
              )}
            </div>
            <div className="flex-1">
                  <p className="font-medium text-white">Körprov</p>
                  {educationEditMode ? (
                    <Input
                  type="date"
                  name="drivingTest"
                  value={formData.drivingTest || ''}
                      onChange={handleEducationInputChange}
                      className="mt-1 bg-white/10 border-white/20 text-white placeholder:text-slate-300 max-w-xs"
                />
              ) : (
                    <p className="text-sm text-slate-300">
                  {formData.drivingTest ? `Godkänd: ${formData.drivingTest}` : 'Ej avlagt'}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Teacher Notes Section */}
          <div className="border-t border-white/10 pt-6">
            <h4 className="font-bold text-white mb-3 drop-shadow">Lärarens anteckningar</h4>
            {educationEditMode ? (
              <Textarea
            name="teacherNotes"
            value={formData.teacherNotes || ''}
                onChange={handleEducationInputChange}
            placeholder="Lägg till anteckningar om elevens framsteg..."
                className="w-full bg-white/10 border-white/20 text-white placeholder:text-slate-300"
            rows={4}
          />
        ) : (
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 min-h-[100px]">
                <p className="text-slate-200">{formData.teacherNotes || 'Inga anteckningar tillagda.'}</p>
          </div>
        )}
      </div>
        </CardContent>
      </Card>

      {/* Kredit-hantering */}
      <Card className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white shadow-2xl mt-8">
        <CardHeader>
          <CardTitle className="text-white font-extrabold drop-shadow flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-sky-300" /> Kredit-hantering
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl bg-white/5 border border-white/10 p-4">
            <UserCreditsPanel userId={user.id} />
    </div>
        </CardContent>
      </Card>
    </>
  );
}
