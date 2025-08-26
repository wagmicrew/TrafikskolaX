"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Select as FBSelect, Button as FBButton, Card as FBCard, Label as FBLabel } from 'flowbite-react';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  Plus,
  Edit3,
  Trash2,
  Save,
  X,
  Calendar,
  Clock,
  Users,
  DollarSign,
  BookOpen,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  MoveRight,
  User as UserIcon,
  Search,
  RotateCcw,
  Download,
  Link as LinkIcon,
  RefreshCw,
  Loader2,
  ChevronUp,
  ChevronDown,
  CreditCard,
  MailCheck,
  ShieldAlert
} from 'lucide-react';

interface SessionType {
  id: string;
  name: string;
  description: string | null;
  type: 'handledarutbildning' | 'riskettan' | 'teorilektion' | 'handledarkurs';
  creditType: string;
  basePrice: string;
  pricePerSupervisor: string | null;
  durationMinutes: number;
  maxParticipants: number;
  allowsSupervisors: boolean;
  requiresPersonalId: boolean;
  isActive: boolean;
  sortOrder: number;
}

interface Session {
  id: string;
  sessionTypeId: string;
  title: string;
  description: string | null;
  date: string;
  startTime: string;
  endTime: string;
  maxParticipants: number;
  currentParticipants: number;
  teacherId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  sessionType: SessionType;
}

interface SessionFormData {
  sessionTypeId: string;
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  maxParticipants: string;
  isActive: boolean;
}

interface BookingFormData {
  supervisorName: string;
  supervisorEmail: string;
  supervisorPhone: string;
  personalId: string;
  supervisorCount: string;
  studentId: string;
  sendPaymentEmail: boolean;
}

export default function UnifiedSessionsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [tab, setTab] = useState<'future' | 'past'>('future');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionTypes, setSessionTypes] = useState<SessionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [pastPage, setPastPage] = useState(1);
  const [pastTotalPages, setPastTotalPages] = useState(1);
  const [listLoading, setListLoading] = useState(false);

  // Authentication check
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const [formData, setFormData] = useState<SessionFormData>({
    sessionTypeId: '',
    title: '',
    description: '',
    date: '',
    startTime: '09:00',
    endTime: '11:00',
    maxParticipants: '10',
    isActive: true
  });

  // Add participant dialog state
  const [addOpenFor, setAddOpenFor] = useState<string | null>(null);
  const [addForm, setAddForm] = useState<BookingFormData>({
    supervisorName: '',
    supervisorEmail: '',
    supervisorPhone: '',
    personalId: '',
    supervisorCount: '1',
    studentId: '',
    sendPaymentEmail: true,
  });
  const [studentOptions, setStudentOptions] = useState<any[]>([]);
  const [moving, setMoving] = useState<{ bookingId: string, open: boolean, sessions: any[], targetId: string } | null>(null);
  const [unbookingId, setUnbookingId] = useState<string | null>(null);
  const [userPopup, setUserPopup] = useState<{ open: boolean, userId: string | null, user: any | null }>({ open: false, userId: null, user: null });
  const [participantsDialog, setParticipantsDialog] = useState<{ open: boolean, sessionId: string | null, title: string }>({ open: false, sessionId: null, title: '' });
  const [participants, setParticipants] = useState<Record<string, any[]>>({});
  const [participantLoadingId, setParticipantLoadingId] = useState<string | null>(null);

  // Load data
  const loadData = async () => {
    try {
      setLoading(true);

      // Get auth token for admin API calls
      const token = document.cookie.split('; ').find(row => row.startsWith('auth-token='))?.split('=')[1];

      const headers = token ? {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      } : undefined;

      const [sessionsResponse, typesResponse, usersResponse] = await Promise.all([
        fetch(`/api/admin/sessions?scope=${tab === 'future' ? 'future' : 'past'}&page=${tab === 'past' ? pastPage : 1}`, {
          headers
        }),
        fetch('/api/admin/session-types', {
          headers
        }),
        fetch('/api/admin/users', {
          headers
        })
      ]);

      if (sessionsResponse.ok) {
        const sessionsData = await sessionsResponse.json();
        setSessions(sessionsData.sessions || []);
        if (tab === 'past') {
          setPastPage(sessionsData.page || 1);
          setPastTotalPages(sessionsData.totalPages || 1);
        }
      }

      if (typesResponse.ok) {
        const typesData = await typesResponse.json();
        setSessionTypes(typesData.sessionTypes || []);
      }

      if (usersResponse.ok) {
        const all = await usersResponse.json();
        const students = (all?.users || [])
          .filter((u: any) => String(u.role).toLowerCase() === 'student' && (u.firstName !== 'Temporary'))
          .map((u: any) => ({
            id: u.id,
            label: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email
          }));
        setStudentOptions(students);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Kunde inte ladda data');
    } finally {
      setLoading(false);
      setListLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'admin') {
      loadData();
    }
  }, [tab, pastPage, user]);

  // Load user when popup opens
  useEffect(() => {
    const run = async () => {
      if (userPopup.open && userPopup.userId) {
        try {
          // Get auth token for admin API calls
          const token = document.cookie.split('; ').find(row => row.startsWith('auth-token='))?.split('=')[1];

          const headers = token ? {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          } : undefined;

          const res = await fetch(`/api/admin/users/${userPopup.userId}`, { headers });
          if (res.ok) {
            const d = await res.json();
            setUserPopup(prev => ({ ...prev, user: d.user }));
          } else {
            setUserPopup(prev => ({ ...prev, user: { firstName: 'Okänd', lastName: '', email: '' } }));
          }
        } catch {
          setUserPopup(prev => ({ ...prev, user: { firstName: 'Okänd', lastName: '', email: '' } }));
        }
      }
    };
    run();
  }, [userPopup.open, userPopup.userId]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const method = editingSession ? 'PUT' : 'POST';
      const url = editingSession
        ? `/api/admin/sessions/${editingSession.id}`
        : '/api/admin/sessions';

      // Get auth token for admin API calls
      const token = document.cookie.split('; ').find(row => row.startsWith('auth-token='))?.split('=')[1];

      const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      };

      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify({
          sessionTypeId: formData.sessionTypeId,
          title: formData.title,
          description: formData.description,
          date: formData.date,
          startTime: formData.startTime,
          endTime: formData.endTime,
          maxParticipants: parseInt(formData.maxParticipants),
          isActive: formData.isActive
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        setCreateOpen(false);
        resetForm();
        loadData();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Ett fel uppstod');
      }
    } catch (error) {
      console.error('Error saving session:', error);
      toast.error('Kunde inte spara session');
    } finally {
      setSaving(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setEditingSession(null);
    setFormData({
      sessionTypeId: '',
      title: '',
      description: '',
      date: '',
      startTime: '09:00',
      endTime: '11:00',
      maxParticipants: '10',
      isActive: true
    });
  };

  // Handle edit
  const handleEdit = (session: Session) => {
    setEditingSession(session);
    setFormData({
      sessionTypeId: session.sessionTypeId,
      title: session.title,
      description: session.description || '',
      date: session.date,
      startTime: session.startTime?.slice(0, 5) || '09:00',
      endTime: session.endTime?.slice(0, 5) || '11:00',
      maxParticipants: session.maxParticipants.toString(),
      isActive: session.isActive
    });
    setCreateOpen(true);
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm('Är du säker på att du vill ta bort denna session?')) {
      return;
    }

    try {
      // Get auth token for admin API calls
      const token = document.cookie.split('; ').find(row => row.startsWith('auth-token='))?.split('=')[1];

      const headers = token ? {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      } : undefined;

      const response = await fetch(`/api/admin/sessions/${id}`, {
        method: 'DELETE',
        headers
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        loadData();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Kunde inte radera session');
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      toast.error('Kunde inte radera session');
    }
  };

  // Load participants
  const loadParticipants = async (sessionId: string) => {
    try {
      setParticipantLoadingId(sessionId);
      // Get auth token for admin API calls
      const token = document.cookie.split('; ').find(row => row.startsWith('auth-token='))?.split('=')[1];

      const headers = token ? {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      } : undefined;

      const res = await fetch(`/api/admin/sessions/${sessionId}/participants`, { headers });
      if (!res.ok) throw new Error('Kunde inte hämta deltagare');
      const data = await res.json();
      setParticipants(prev => ({ ...prev, [sessionId]: data.participants || [] }));
      setParticipantLoadingId(null);
    } catch (e: any) {
      toast.error(e.message || 'Fel vid hämtning av deltagare');
      setParticipantLoadingId(null);
    }
  };

  const openParticipants = async (session: Session) => {
    setParticipantsDialog({ open: true, sessionId: session.id, title: session.title });
    await loadParticipants(session.id);
  };

  // Format date and time
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sv-SE');
  };

  const formatTime = (timeString: string) => {
    return timeString?.slice(0, 5) || '';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-slate-300" />
          <p className="text-slate-300">Laddar sessioner...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-white">Sessionshantering</h1>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg overflow-hidden border border-white/20">
            <button onClick={() => setTab('future')} className={`px-3 py-1.5 ${tab === 'future' ? 'bg-white/20 text-white' : 'bg-white/10 text-slate-200'}`}>Kommande</button>
            <button onClick={() => { setTab('past'); setPastPage(1); }} className={`px-3 py-1.5 ${tab === 'past' ? 'bg-white/20 text-white' : 'bg-white/10 text-slate-200'}`}>Tidigare</button>
          </div>
          {tab === 'past' && (
            <div className="flex items-center gap-2 text-slate-200">
              <button disabled={pastPage <= 1} onClick={async () => { const p = Math.max(1, pastPage - 1); setPastPage(p); await loadData(); }} className="px-3 py-1 rounded-lg bg-white/10 border border-white/20 disabled:opacity-50">Föregående</button>
              <span>Sida {pastPage} / {pastTotalPages}</span>
              <button disabled={pastPage >= pastTotalPages} onClick={async () => { const p = Math.min(pastTotalPages, pastPage + 1); setPastPage(p); await loadData(); }} className="px-3 py-1 rounded-lg bg-white/10 border border-white/20 disabled:opacity-50">Nästa</button>
            </div>
          )}
          <Button onClick={() => setCreateOpen(true)} className="rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white">
            <Plus className="w-4 h-4 mr-1" /> Ny session
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        {listLoading && (
          <div className="col-span-full flex items-center justify-center text-slate-200 gap-2 py-6">
            <Loader2 className="w-5 h-5 animate-spin" /> Laddar innehåll…
          </div>
        )}
        {!listLoading && sessions.map(s => (
          <Card key={s.id} className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white shadow-2xl">
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="text-white font-extrabold">{s.title}</CardTitle>
              <Button size="sm" onClick={() => handleEdit(s)} className="bg-emerald-600 hover:bg-emerald-500">
                <Save className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-slate-300">Datum</label>
                    <div className="text-white font-semibold">{formatDate(s.date)}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm text-slate-300">Start</label>
                      <div className="text-white font-semibold">{formatTime(s.startTime)}</div>
                    </div>
                    <div>
                      <label className="text-sm text-slate-300">Slut</label>
                      <div className="text-white font-semibold">{formatTime(s.endTime)}</div>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-slate-300">Typ</label>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {s.sessionType.name}
                    </Badge>
                    <Badge variant={s.sessionType.allowsSupervisors ? "default" : "secondary"} className="text-xs">
                      {s.sessionType.allowsSupervisors ? "Med handledare" : "Utan handledare"}
                    </Badge>
                  </div>
                </div>
                {s.description && (
                  <div>
                    <label className="text-sm text-slate-300">Beskrivning</label>
                    <p className="text-slate-200 text-sm">{s.description}</p>
                  </div>
                )}
                <div className="flex items-center justify-between py-2 border-t border-white/10">
                  <div className="flex items-center gap-2 text-slate-200 text-sm">
                    <Users className="w-4 h-4" /> Bokade: <span className="font-bold text-white">{s.currentParticipants}/{s.maxParticipants}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => openParticipants(s)} className="border-white/20 text-white">
                      <Eye className="w-4 h-4 mr-1" /> Deltagare
                    </Button>
                    {tab === 'future' && (
                      <Button onClick={() => {
                        setAddOpenFor(s.id);
                        setAddForm({
                          supervisorName: '',
                          supervisorEmail: '',
                          supervisorPhone: '',
                          personalId: '',
                          supervisorCount: '1',
                          studentId: '',
                          sendPaymentEmail: true
                        });
                      }} className="bg-green-600 hover:bg-green-500 text-white">
                        Lägg till
            </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-2xl shadow-2xl max-w-2xl">
            <DialogHeader>
            <DialogTitle className="text-white">{editingSession ? 'Redigera Session' : 'Ny Session'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
              <Label className="text-slate-200">Sessionstyp *</Label>
              <Select value={formData.sessionTypeId} onValueChange={(v) => setFormData(prev => ({ ...prev, sessionTypeId: v }))}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Välj sessionstyp" />
                  </SelectTrigger>
                <SelectContent className="bg-slate-900/90 text-white border-white/10">
                  {sessionTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id} className="text-white">
                      {type.name} - {type.basePrice} SEK
                        {type.allowsSupervisors && ' (med handledare)'}
                      {type.requiresPersonalId && ' (kräver personnummer)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            <div>
              <Label className="text-slate-200">Titel *</Label>
              <Input value={formData.title} onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))} className="bg-white/10 border-white/20 text-white" required />
            </div>
              <div>
              <Label className="text-slate-200">Beskrivning</Label>
              <Textarea value={formData.description} onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))} className="bg-white/10 border-white/20 text-white" rows={3} />
              </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-slate-200">Datum *</Label>
                <Input type="date" value={formData.date} onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))} className="bg-white/10 border-white/20 text-white" required />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-slate-200">Start</Label>
                  <Input type="time" value={formData.startTime} onChange={e => setFormData(prev => ({ ...prev, startTime: e.target.value }))} className="bg-white/10 border-white/20 text-white" />
                </div>
                  <div>
                  <Label className="text-slate-200">Slut</Label>
                  <Input type="time" value={formData.endTime} onChange={e => setFormData(prev => ({ ...prev, endTime: e.target.value }))} className="bg-white/10 border-white/20 text-white" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div>
                <Label className="text-slate-200">Max platser</Label>
                <Input type="number" value={formData.maxParticipants} onChange={e => setFormData(prev => ({ ...prev, maxParticipants: e.target.value }))} className="bg-white/10 border-white/20 text-white" />
                </div>
              <div className="flex items-center pt-8">
                <Switch checked={formData.isActive} onCheckedChange={checked => setFormData(prev => ({ ...prev, isActive: checked }))} />
                <Label className="ml-2 text-slate-200">Aktiv</Label>
              </div>
            </div>
              <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)} className="text-white border-white/20 hover:bg-white/10">Avbryt</Button>
              <Button type="submit" disabled={saving} className="bg-emerald-600 hover:bg-emerald-500">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      {editingSession ? 'Uppdatera' : 'Skapa'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

      {/* Add participant dialog */}
      <Dialog open={!!addOpenFor} onOpenChange={(o) => { if (!o) setAddOpenFor(null); }}>
        <DialogContent className="bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-2xl shadow-2xl max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Lägg till deltagare</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-slate-200">Handledarens namn</Label>
              <Input value={addForm.supervisorName} onChange={e => setAddForm(f => ({ ...f, supervisorName: e.target.value }))} className="bg-white/10 border-white/20 text-white" />
                  </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-slate-200">E-post</Label>
                <Input type="email" value={addForm.supervisorEmail} onChange={e => setAddForm(f => ({ ...f, supervisorEmail: e.target.value }))} className="bg-white/10 border-white/20 text-white" />
                </div>
              <div>
                <Label className="text-slate-200">Telefon</Label>
                <Input value={addForm.supervisorPhone} onChange={e => setAddForm(f => ({ ...f, supervisorPhone: e.target.value }))} className="bg-white/10 border-white/20 text-white" />
              </div>
                </div>
            <div>
              <Label className="text-slate-200">Personnummer (krävs för handledare)</Label>
              <Input
                type="password"
                value={addForm.personalId}
                onChange={e => setAddForm(f => ({ ...f, personalId: e.target.value }))}
                className="bg-white/10 border-white/20 text-white"
                placeholder="ÅÅMMDD-XXXX"
              />
              <p className="text-xs text-slate-400 mt-1">Endast de 4 sista siffrorna visas, resten krypteras</p>
                </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-slate-200">Antal handledare</Label>
                <Input type="number" value={addForm.supervisorCount} onChange={e => setAddForm(f => ({ ...f, supervisorCount: e.target.value }))} className="bg-white/10 border-white/20 text-white" />
                </div>
              <div className="flex items-center pt-8">
                <input id="sendPay" type="checkbox" checked={addForm.sendPaymentEmail} onChange={e => setAddForm(f => ({ ...f, sendPaymentEmail: e.target.checked }))} className="mr-2" />
                <Label htmlFor="sendPay" className="text-slate-200">Skicka betalningsinformation</Label>
              </div>
            </div>
            <div className="relative z-[60]">
              <FBLabel className="text-slate-200 block mb-2">Koppla till användare (valfritt)</FBLabel>
              <FBSelect
                value={addForm.studentId}
                onChange={(e) => setAddForm(f => ({ ...f, studentId: e.target.value }))}
                className="w-full bg-white/10 border border-white/20 text-white focus:border-blue-500 focus:ring-blue-500 rounded-lg"
              >
                <option value="" className="bg-slate-900 text-white">Ingen</option>
                {studentOptions.map(s => (
                  <option key={s.id} value={s.id} className="bg-slate-900 text-white">{s.label}</option>
                ))}
              </FBSelect>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpenFor(null)} className="text-white border-white/20 hover:bg-white/10">Avbryt</Button>
            <Button onClick={async () => {
              if (!addOpenFor) return;
              const t = toast.loading('Lägger till deltagare...');
              try {
                // Get auth token for admin API calls
                const token = document.cookie.split('; ').find(row => row.startsWith('auth-token='))?.split('=')[1];

                const headers = {
                  'Content-Type': 'application/json',
                  ...(token && { 'Authorization': `Bearer ${token}` })
                };

                const res = await fetch(`/api/admin/sessions/${addOpenFor}/add-booking`, {
                  method: 'POST',
                  headers,
                  body: JSON.stringify(addForm)
                });
                if (res.ok) {
                  toast.success('Deltagare tillagd', { id: t });
                  setAddOpenFor(null);
                  loadData();
                } else {
                  const e = await res.json().catch(() => ({}));
                  toast.error(e.error || 'Kunde inte lägga till', { id: t });
                }
              } catch {
                toast.error('Ett fel uppstod', { id: t });
              }
            }} className="bg-emerald-600 hover:bg-emerald-500">Lägg till</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Participants dialog */}
      <Dialog open={participantsDialog.open} onOpenChange={(o) => { if (!o) setParticipantsDialog({ open: false, sessionId: null, title: '' }); }}>
        <DialogContent className="bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-2xl shadow-2xl max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Deltagare – {participantsDialog.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {participantLoadingId === participantsDialog.sessionId && (
              <div className="flex items-center gap-2 text-slate-200 py-2"><Loader2 className="w-4 h-4 animate-spin" /> Hämtar deltagare…</div>
            )}
            {participantsDialog.sessionId && (participants[participantsDialog.sessionId] || []).map((p: any) => (
              <div key={p.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-white/90">
                <div className="flex flex-wrap items-center gap-2">
                  {p.studentId ? (
                    <button className="text-white hover:underline inline-flex items-center gap-1" onClick={() => setUserPopup({ open: true, userId: p.studentId, user: null })}>
                      <UserIcon className="w-4 h-4" /> {p.supervisorName}
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-white/80">
                      <UserIcon className="w-4 h-4" /> {p.supervisorName}
                    </span>
                  )}
                  {p.paymentStatus === 'paid' ? (
                    <Badge className="bg-emerald-500/20 border-emerald-500/30 text-emerald-300">Betald</Badge>
                  ) : (
                    <Badge className="bg-amber-500/20 border-amber-500/30 text-amber-300">Ej betald</Badge>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button size="sm" variant="outline" className="border-white/20 text-white" onClick={async () => {
                    try {
                      // Get auth token for admin API calls
                      const token = document.cookie.split('; ').find(row => row.startsWith('auth-token='))?.split('=')[1];

                      const headers = token ? {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                      } : undefined;

                      const res = await fetch('/api/admin/sessions/future', { headers });
                      const data = await res.json();
                      setMoving({ bookingId: p.id, open: true, sessions: (data.sessions || []), targetId: '' });
                    } catch { toast.error('Kunde inte hämta framtida sessioner'); }
                  }}>
                    <MoveRight className="w-4 h-4 mr-1" /> Flytta
                  </Button>
                  <Button size="sm" variant="destructive" className="bg-red-600 hover:bg-red-500" onClick={() => setUnbookingId(p.id)}>
                    <Trash2 className="w-4 h-4 mr-1" /> Avboka
                  </Button>
                </div>
              </div>
            ))}
            {participantsDialog.sessionId && (participants[participantsDialog.sessionId] || []).length === 0 && participantLoadingId !== participantsDialog.sessionId && (
              <div className="text-slate-300">Inga deltagare</div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Move dialog */}
      {moving?.open && (
        <Dialog open={moving.open} onOpenChange={(o) => { if (!o) setMoving(null); }}>
          <DialogContent className="bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-2xl shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-white">Flytta deltagare</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <FBLabel className="text-slate-200 block">Mål-session</FBLabel>
              <div className="relative z-[70]">
                <FBSelect
                  value={moving.targetId}
                  onChange={(e) => setMoving(m => m ? { ...m, targetId: e.target.value } : m)}
                  className="w-full bg-white/10 border border-white/20 text-white focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                >
                  <option value="" className="bg-slate-900 text-white">Välj framtida session</option>
                  {moving.sessions.map((fs: any) => (
                    <option key={fs.id} value={fs.id} className="bg-slate-900 text-white">{fs.title} — {fs.date} {String(fs.startTime || '').slice(0, 5)}-{String(fs.endTime || '').slice(0, 5)}</option>
                  ))}
                </FBSelect>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setMoving(null)} className="text-white border-white/20 hover:bg-white/10">Avbryt</Button>
              <Button disabled={!moving.targetId} onClick={async () => {
                if (!moving?.targetId) return;
                const t = toast.loading('Flyttar deltagare...');
                try {
                  // Get auth token for admin API calls
                  const token = document.cookie.split('; ').find(row => row.startsWith('auth-token='))?.split('=')[1];

                  const headers = {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                  };

                  const res = await fetch(`/api/admin/session-bookings/${moving.bookingId}`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({ action: 'move', targetSessionId: moving.targetId })
                  });
                  if (res.ok) {
                    toast.success('Deltagare flyttad', { id: t });
                    setMoving(null);
                    loadData();
                  } else {
                    const e = await res.json().catch(() => ({}));
                    toast.error(e.error || 'Kunde inte flytta', { id: t });
                  }
                } catch {
                  toast.error('Ett fel uppstod', { id: t });
                }
              }} className="bg-emerald-600 hover:bg-emerald-500">Flytta</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Unbook confirm */}
      <Dialog open={!!unbookingId} onOpenChange={(o) => { if (!o) setUnbookingId(null); }}>
        <DialogContent className="bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Avboka deltagare</DialogTitle>
          </DialogHeader>
          <p className="text-slate-200">Är du säker på att du vill avboka deltagaren? Denna åtgärd kan inte ångras.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUnbookingId(null)} className="text-white border-white/20 hover:bg-white/10">Avbryt</Button>
            <Button variant="destructive" onClick={async () => {
              if (!unbookingId) return;
              const t = toast.loading('Avbokar...');
              try {
                // Get auth token for admin API calls
                const token = document.cookie.split('; ').find(row => row.startsWith('auth-token='))?.split('=')[1];

                const headers = token ? {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                } : undefined;

                const res = await fetch(`/api/admin/session-bookings/${unbookingId}`, {
                  method: 'DELETE',
                  headers
                });
                if (res.ok) {
                  toast.success('Avbokad', { id: t });
                  setUnbookingId(null);
                  loadData();
                } else {
                  const e = await res.json().catch(() => ({}));
                  toast.error(e.error || 'Kunde inte avboka', { id: t });
                }
              } catch {
                toast.error('Ett fel uppstod', { id: t });
              }
            }}>Avboka</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User popup */}
      {userPopup.open && (
        <Dialog open={userPopup.open} onOpenChange={(o) => { if (!o) setUserPopup({ open: false, user: null, userId: null }); }}>
          <DialogContent className="bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-2xl shadow-2xl max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2"><UserIcon className="w-5 h-5" /> Användare</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              {!userPopup.user && <div className="flex items-center gap-2 text-slate-200"><Loader2 className="w-4 h-4 animate-spin" /> Hämtar användare…</div>}
              {userPopup.user && (
                <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                  <div className="text-lg font-bold">{userPopup.user.firstName} {userPopup.user.lastName}</div>
                  <div className="text-slate-200">{userPopup.user.email}</div>
                  {userPopup.user.phone && <div className="text-slate-300">{userPopup.user.phone}</div>}
                  <div className="mt-3 flex items-center gap-2 text-slate-200"><span className="px-2 py-0.5 rounded bg-white/10 border border-white/20">{userPopup.user.role}</span>{userPopup.user.inskriven && <span className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/30 text-emerald-300">Inskriven</span>}</div>
                  <div className="mt-4">
                    <a href={`/dashboard/admin/users/${userPopup.user.id}`} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white">Öppna profilsida</a>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
