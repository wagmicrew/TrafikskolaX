'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Save, Users, Calendar, Clock, Plus, Eye, ChevronUp, ChevronDown, MoveRight, Trash2, User as UserIcon, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { DatePickerPopover } from '@/components/ui/date-picker';
import { TimePickerPopover } from '@/components/ui/time-picker';

type Session = {
  id: string;
  title: string;
  description: string | null;
  date: string;
  startTime: string;
  endTime: string;
  maxParticipants: number;
  currentParticipants: number;
  pricePerParticipant: string;
  teacherId: string | null;
  isActive: boolean | null;
  createdAt: string;
};

export default function HandledarKursClient({ sessions: initialSessions }: { sessions: Session[] }) {
  const [tab, setTab] = useState<'future'|'past'>('future');
  const [sessions, setSessions] = useState<Session[]>(initialSessions.filter(s=>new Date(s.date)>=new Date(new Date().toDateString())));
  const [pastPage, setPastPage] = useState(1);
  const [pastTotalPages, setPastTotalPages] = useState(1);
  const [listLoading, setListLoading] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [showParticipantsFor, setShowParticipantsFor] = useState<string | null>(null);
  const [participants, setParticipants] = useState<Record<string, any[]>>({});
  const [participantLoadingId, setParticipantLoadingId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newSession, setNewSession] = useState({
    title: 'Handledarutbildning',
    description: '',
    date: '',
    startTime: '09:00',
    endTime: '11:00',
    maxParticipants: 10,
    pricePerParticipant: 500,
  });

  // Add booking modal state
  const [addOpenFor, setAddOpenFor] = useState<string | null>(null);
  const [addForm, setAddForm] = useState({
    supervisorName: '',
    supervisorEmail: '',
    supervisorPhone: '',
    studentId: '',
    sendPaymentEmail: true,
  });
  const [studentOptions, setStudentOptions] = useState<any[]>([]);
  const [moving, setMoving] = useState<{ bookingId: string, open: boolean, sessions: any[], targetId: string } | null>(null);
  const [unbookingId, setUnbookingId] = useState<string | null>(null);
  const [userPopup, setUserPopup] = useState<{ open: boolean, userId: string | null, user: any | null }>({ open: false, userId: null, user: null });
  const [participantsDialog, setParticipantsDialog] = useState<{ open: boolean, sessionId: string | null, title: string }>({ open: false, sessionId: null, title: '' });

  // Refresh lists
  const loadFuture = async () => {
    setListLoading(true);
    try {
      const res = await fetch('/api/admin/handledar-sessions?scope=future');
      if (res.ok) { const data = await res.json(); if (Array.isArray(data.sessions)) setSessions(data.sessions); }
    } finally { setListLoading(false); }
  };
  const loadPast = async (page=1) => {
    setListLoading(true);
    try {
      const res = await fetch(`/api/admin/handledar-sessions?scope=past&page=${page}`);
      if (res.ok) { const data = await res.json(); if (Array.isArray(data.sessions)) { setSessions(data.sessions); setPastPage(data.page||1); setPastTotalPages(data.totalPages||1); } }
    } finally { setListLoading(false); }
  };
  useEffect(() => {
    const refresh = async () => {
      try {
        if (tab==='future') await loadFuture(); else await loadPast(pastPage);
        const ures = await fetch('/api/admin/users');
        if (ures.ok) {
          const all = await ures.json();
          const students = (all||[])
            .filter((u:any)=>String(u.role).toLowerCase()==='student' && (u.firstName!=='Temporary'))
            .map((u:any)=>({ id:u.id, label:`${u.firstName||''} ${u.lastName||''}`.trim()||u.email }));
          setStudentOptions(students);
        }
      } catch {}
    };
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // Load user when popup opens
  useEffect(() => {
    const run = async () => {
      if (userPopup.open && userPopup.userId) {
        try {
          const res = await fetch(`/api/admin/users/${userPopup.userId}`);
          if (res.ok) {
            const d = await res.json();
            setUserPopup(prev => ({ ...prev, user: d.user }));
          } else {
            setUserPopup(prev => ({ ...prev, user: { firstName:'Okänd', lastName:'', email:'' } }));
          }
        } catch {
          setUserPopup(prev => ({ ...prev, user: { firstName:'Okänd', lastName:'', email:'' } }));
        }
      }
    };
    run();
  }, [userPopup.open, userPopup.userId]);

  const loadParticipants = async (sessionId: string) => {
    try {
      // open dialog and load
      setParticipantLoadingId(sessionId);
      const res = await fetch(`/api/admin/handledar-sessions/${sessionId}/participants`);
      if (!res.ok) throw new Error('Kunde inte hämta deltagare');
      const data = await res.json();
      setParticipants(prev => ({ ...prev, [sessionId]: data.participants || [] }));
      setParticipantLoadingId(null);
      // Also refresh sessions to update the Bokade count
      try { if (tab==='future') await loadFuture(); else await loadPast(pastPage); } catch {}
    } catch (e: any) {
      toast.error(e.message || 'Fel vid hämtning av deltagare');
      setParticipantLoadingId(null);
    }
  };

  const openParticipants = async (session: Session) => {
    setParticipantsDialog({ open: true, sessionId: session.id, title: session.title });
    await loadParticipants(session.id);
  };

  // Auto-close participants list after 10s if empty
  useEffect(() => {
    if (!showParticipantsFor) return;
    const list = participants[showParticipantsFor];
    if (list && list.length === 0) {
      const t = setTimeout(() => setShowParticipantsFor(null), 10000);
      return () => clearTimeout(t);
    }
  }, [showParticipantsFor, participants]);

  const saveSession = async (s: Session) => {
    try {
      setLoadingId(s.id);
      const res = await fetch(`/api/admin/handledar-sessions/${s.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(s) });
      if (!res.ok) throw new Error('Kunde inte spara session');
      const updated = await res.json();
      setSessions(prev => prev.map(x => x.id === s.id ? { ...x, ...updated.session } : x));
      toast.success('Session sparad');
    } catch (e: any) {
      toast.error(e.message || 'Fel vid sparande');
    } finally {
      setLoadingId(null);
    }
  };

  const createSession = async () => {
    try {
      setCreating(true);
      const res = await fetch('/api/admin/handledar-sessions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newSession) });
      if (!res.ok) throw new Error('Kunde inte skapa session');
      const data = await res.json();
      setSessions(prev => [data.session, ...prev]);
      setCreateOpen(false);
      toast.success('Session skapad');
    } catch (e: any) {
      toast.error(e.message || 'Fel vid skapande');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-white">Handledarkurs</h1>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg overflow-hidden border border-white/20">
            <button onClick={()=>setTab('future')} className={`px-3 py-1.5 ${tab==='future'?'bg-white/20 text-white':'bg-white/10 text-slate-200'}`}>Kommande</button>
            <button onClick={()=>{setTab('past'); setPastPage(1);}} className={`px-3 py-1.5 ${tab==='past'?'bg-white/20 text-white':'bg-white/10 text-slate-200'}`}>Tidigare</button>
          </div>
          {tab==='past' && (
            <div className="flex items-center gap-2 text-slate-200">
              <button disabled={pastPage<=1} onClick={async()=>{ const p=Math.max(1,pastPage-1); setPastPage(p); await loadPast(p); }} className="px-3 py-1 rounded-lg bg-white/10 border border-white/20 disabled:opacity-50">Föregående</button>
              <span>Sida {pastPage} / {pastTotalPages}</span>
              <button disabled={pastPage>=pastTotalPages} onClick={async()=>{ const p=Math.min(pastTotalPages,pastPage+1); setPastPage(p); await loadPast(p); }} className="px-3 py-1 rounded-lg bg-white/10 border border-white/20 disabled:opacity-50">Nästa</button>
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
            <Loader2 className="w-5 h-5 animate-spin"/> Laddar innehåll…
          </div>
        )}
        {!listLoading && sessions.map(s => (
          <Card key={s.id} className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white shadow-2xl">
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="text-white font-extrabold">{s.title}</CardTitle>
              <Button size="sm" onClick={() => saveSession(s)} disabled={loadingId===s.id} className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50">
                {loadingId===s.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-slate-300">Datum</label>
                    <DatePickerPopover value={s.date} onChange={(v)=>setSessions(prev=>prev.map(x=>x.id===s.id?{...x,date:v}:x))} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm text-slate-300">Start</label>
                      <TimePickerPopover value={s.startTime?.slice(0,5) || null} onChange={(v)=>setSessions(prev=>prev.map(x=>x.id===s.id?{...x,startTime:v}:x))} />
                    </div>
                    <div>
                      <label className="text-sm text-slate-300">Slut</label>
                      <TimePickerPopover value={s.endTime?.slice(0,5) || null} onChange={(v)=>setSessions(prev=>prev.map(x=>x.id===s.id?{...x,endTime:v}:x))} />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-slate-300">Max platser</label>
                    <div className="flex items-center gap-2">
                      <Input type="number" value={s.maxParticipants} onChange={e=>setSessions(prev=>prev.map(x=>x.id===s.id?{...x,maxParticipants:parseInt(e.target.value)||0}:x))} className="bg-white/10 border-white/20 text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                      <div className="flex flex-col">
                        <button aria-label="Öka" onClick={()=>setSessions(prev=>prev.map(x=>x.id===s.id?{...x,maxParticipants:(x.maxParticipants||0)+1}:x))} className="p-1 rounded-md bg-white/10 border border-white/20 hover:bg-white/20"><ChevronUp className="w-4 h-4"/></button>
                        <button aria-label="Minska" onClick={()=>setSessions(prev=>prev.map(x=>x.id===s.id?{...x,maxParticipants:Math.max(0,(x.maxParticipants||0)-1)}:x))} className="mt-1 p-1 rounded-md bg-white/10 border border-white/20 hover:bg-white/20"><ChevronDown className="w-4 h-4"/></button>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-slate-300">Pris / deltagare</label>
                    <Input type="number" value={s.pricePerParticipant as any} onChange={e=>setSessions(prev=>prev.map(x=>x.id===s.id?{...x,pricePerParticipant:e.target.value}:x))} className="bg-white/10 border-white/20 text-white" />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-slate-300">Beskrivning</label>
                  <Textarea value={s.description||''} onChange={e=>setSessions(prev=>prev.map(x=>x.id===s.id?{...x,description:e.target.value}:x))} className="bg-white/10 border-white/20 text-white" rows={3} />
                </div>
                <div className="flex items-center justify-between py-2 border-t border-white/10">
                  <div className="flex items-center gap-2 text-slate-200 text-sm">
                    <Users className="w-4 h-4" /> Bokade: <span className="font-bold text-white">{s.currentParticipants}/{s.maxParticipants}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={()=>openParticipants(s)} className="border-white/20 text-white">
                      <Eye className="w-4 h-4 mr-1" /> Deltagare
                    </Button>
                    {tab==='future' && (
                      <Button onClick={()=>{ setAddOpenFor(s.id); setAddForm({ supervisorName:'', supervisorEmail:'', supervisorPhone:'', studentId:'', sendPaymentEmail:true }); }} className="bg-green-600 hover:bg-green-500 text-white">Lägg till</Button>
                    )}
                  </div>
                </div>
                {/* Participants moved to dialog */}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Ny handledarsession</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="title" className="text-slate-200">Titel</Label>
              <Input id="title" value={newSession.title} onChange={e=>setNewSession(v=>({...v,title:e.target.value}))} className="bg-white/10 border-white/20 text-white"/>
            </div>
            <div>
              <Label htmlFor="date" className="text-slate-200">Datum</Label>
              <DatePickerPopover value={newSession.date || null} onChange={(v)=>setNewSession(s=>({...s,date:v}))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-slate-200">Start</Label>
                <TimePickerPopover value={newSession.startTime} onChange={(v)=>setNewSession(s=>({...s,startTime:v}))} />
              </div>
              <div>
                <Label className="text-slate-200">Slut</Label>
                <TimePickerPopover value={newSession.endTime} onChange={(v)=>setNewSession(s=>({...s,endTime:v}))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-slate-200">Max platser</Label>
                <div className="flex items-center gap-2">
                  <Input type="number" value={newSession.maxParticipants} onChange={e=>setNewSession(v=>({...v,maxParticipants:parseInt(e.target.value)||0}))} className="bg-white/10 border-white/20 text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                  <div className="flex flex-col">
                    <button aria-label="Öka" onClick={()=>setNewSession(v=>({...v,maxParticipants:(v.maxParticipants||0)+1}))} className="p-1 rounded-md bg-white/10 border border-white/20 hover:bg-white/20"><ChevronUp className="w-4 h-4"/></button>
                    <button aria-label="Minska" onClick={()=>setNewSession(v=>({...v,maxParticipants:Math.max(0,(v.maxParticipants||0)-1)}))} className="mt-1 p-1 rounded-md bg-white/10 border border-white/20 hover:bg-white/20"><ChevronDown className="w-4 h-4"/></button>
                  </div>
                </div>
              </div>
              <div>
                <Label className="text-slate-200">Pris / deltagare</Label>
                <Input type="number" value={newSession.pricePerParticipant as any} onChange={e=>setNewSession(v=>({...v,pricePerParticipant:parseFloat(e.target.value)||0}))} className="bg-white/10 border-white/20 text-white" />
              </div>
            </div>
            <div>
              <Label className="text-slate-200">Beskrivning</Label>
              <Textarea value={newSession.description} onChange={e=>setNewSession(v=>({...v,description:e.target.value}))} className="bg-white/10 border-white/20 text-white" rows={3} />
            </div>
          </div>
          <DialogFooter className="sm:justify-end">
            <Button variant="outline" onClick={()=>setCreateOpen(false)} className="text-white border-white/20 hover:bg-white/10">Avbryt</Button>
            <Button onClick={createSession} disabled={creating} className="bg-emerald-600 hover:bg-emerald-500">
              {creating ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Skapa'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add participant dialog */}
      <Dialog open={!!addOpenFor} onOpenChange={(o)=>{ if(!o) setAddOpenFor(null); }}>
        <DialogContent className="bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Lägg till deltagare</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-slate-200">Handledarens namn</Label>
              <Input value={addForm.supervisorName} onChange={e=>setAddForm(f=>({...f, supervisorName:e.target.value}))} className="bg-white/10 border-white/20 text-white" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-slate-200">E-post</Label>
                <Input type="email" value={addForm.supervisorEmail} onChange={e=>setAddForm(f=>({...f, supervisorEmail:e.target.value}))} className="bg-white/10 border-white/20 text-white" />
              </div>
              <div>
                <Label className="text-slate-200">Telefon</Label>
                <Input value={addForm.supervisorPhone} onChange={e=>setAddForm(f=>({...f, supervisorPhone:e.target.value}))} className="bg-white/10 border-white/20 text-white" />
              </div>
            </div>
            <div className="relative z-[60]">
              <Label className="text-slate-200">Koppla till användare (valfritt)</Label>
              <div className="relative">
                <select value={addForm.studentId} onChange={e=>setAddForm(f=>({...f, studentId:e.target.value}))} className="w-full rounded-xl bg-white/10 border border-white/20 text-white p-3 pr-10 appearance-none z-[60]">
                  <option value="">Ingen</option>
                  {studentOptions.map(s => (
                    <option key={s.id} value={s.id} className="bg-slate-900 text-white">{s.label}</option>
                  ))}
                </select>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-white/70">▼</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input id="sendPay" type="checkbox" checked={addForm.sendPaymentEmail} onChange={e=>setAddForm(f=>({...f, sendPaymentEmail:e.target.checked}))} className="w-4 h-4" />
              <Label htmlFor="sendPay" className="text-slate-200">Skicka betalningsinformation (Swish)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={()=>setAddOpenFor(null)} className="text-white border-white/20 hover:bg-white/10">Avbryt</Button>
            <Button onClick={async()=>{
              if(!addOpenFor) return;
              const t = toast.loading('Lägger till deltagare...');
              try{
                const res = await fetch(`/api/admin/handledar-sessions/${addOpenFor}/add-booking`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(addForm)});
                if(res.ok){
                  toast.success('Deltagare tillagd',{id:t});
                  setAddOpenFor(null);
                  // refresh sessions count
                  try{ if (tab==='future') await loadFuture(); else await loadPast(pastPage); }catch{}
                } else {
                  const e=await res.json().catch(()=>({}));
                  toast.error(e.error||'Kunde inte lägga till',{id:t});
                }
              } finally {
                // no-op
              }
            }} className="bg-emerald-600 hover:bg-emerald-500">Lägg till</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Participants dialog */}
      <Dialog open={participantsDialog.open} onOpenChange={(o)=>{ if(!o) setParticipantsDialog({ open:false, sessionId:null, title:'' }); }}>
        <DialogContent className="bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-2xl shadow-2xl max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Deltagare – {participantsDialog.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {participantLoadingId===participantsDialog.sessionId && (
              <div className="flex items-center gap-2 text-slate-200 py-2"><Loader2 className="w-4 h-4 animate-spin"/> Hämtar deltagare…</div>
            )}
            {participantsDialog.sessionId && (participants[participantsDialog.sessionId]||[]).map((p:any)=> (
              <div key={p.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-white/90">
                <div className="flex flex-wrap items-center gap-2">
                  {p.studentId ? (
                    <button className="text-white hover:underline inline-flex items-center gap-1" onClick={() => setUserPopup({ open: true, userId: p.studentId, user: null })}>
                      <UserIcon className="w-4 h-4" /> {p.supervisorName}
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-white/80 cursor-default">
                      <UserIcon className="w-4 h-4" /> {p.supervisorName}
                    </span>
                  )}
                  {p.paymentStatus === 'paid' ? (
                    <span className="px-2 py-0.5 text-xs rounded bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 whitespace-nowrap">Betald</span>
                  ) : (
                    <span className="px-2 py-0.5 text-xs rounded bg-amber-500/20 border border-amber-500/30 text-amber-300 whitespace-nowrap">Ej betald</span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button size="sm" variant="outline" className="border-white/20 text-white w-full sm:w-auto justify-center" onClick={async()=>{
                    try {
                      const res = await fetch('/api/admin/handledar-sessions/future');
                      const data = await res.json();
                      setMoving({ bookingId: p.id, open: true, sessions: (data.sessions||[]), targetId: '' });
                    } catch { toast.error('Kunde inte hämta framtida sessioner'); }
                  }}>
                    <MoveRight className="w-4 h-4 mr-1"/> Flytta
                  </Button>
                  <Button size="sm" variant="destructive" className="bg-red-600 hover:bg-red-500 w-full sm:w-auto justify-center" onClick={()=>setUnbookingId(p.id)}>
                    <Trash2 className="w-4 h-4 mr-1"/> Avboka
                  </Button>
                </div>
              </div>
            ))}
            {participantsDialog.sessionId && (participants[participantsDialog.sessionId]||[]).length===0 && participantLoadingId!==participantsDialog.sessionId && (
              <div className="text-slate-300">Inga deltagare</div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Move dialog */}
      {moving?.open && (
        <Dialog open={moving.open} onOpenChange={(o)=>{ if(!o) setMoving(null); }}>
          <DialogContent className="bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-2xl shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-white">Flytta deltagare</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Label className="text-slate-200">Mål-session</Label>
              <div className="relative z-[70]">
                <select value={moving.targetId} onChange={e=>setMoving(m=>m?{...m,targetId:e.target.value}:m)} className="w-full rounded-xl bg-white/10 border border-white/20 text-white p-3 pr-10 appearance-none">
                  <option value="">Välj framtida session</option>
                  {moving.sessions.map((fs:any)=>(
                    <option key={fs.id} value={fs.id} className="bg-slate-900 text-white">{fs.title} — {fs.date} {String(fs.startTime||'').slice(0,5)}-{String(fs.endTime||'').slice(0,5)}</option>
                  ))}
                </select>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-white/70">▼</span>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={()=>setMoving(null)} className="text-white border-white/20 hover:bg-white/10">Avbryt</Button>
              <Button disabled={!moving.targetId} onClick={async()=>{
                if(!moving?.targetId) return;
                const t = toast.loading('Flyttar deltagare...');
                try{
                  const res = await fetch(`/api/admin/handledar-bookings/${moving.bookingId}`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'move', targetSessionId: moving.targetId })});
                  if(res.ok){
                    toast.success('Deltagare flyttad',{id:t});
                    setMoving(null);
                    // refresh sessions count
                    try{ if (tab==='future') await loadFuture(); else await loadPast(pastPage); }catch{}
                  } else {
                    const e=await res.json().catch(()=>({}));
                    toast.error(e.error||'Kunde inte flytta',{id:t});
                  }
                } finally {}
              }} className="bg-emerald-600 hover:bg-emerald-500">Flytta</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Unbook confirm */}
      <Dialog open={!!unbookingId} onOpenChange={(o)=>{ if(!o) setUnbookingId(null); }}>
        <DialogContent className="bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Avboka deltagare</DialogTitle>
          </DialogHeader>
          <p className="text-slate-200">Är du säker på att du vill avboka deltagaren? Denna åtgärd kan inte ångras.</p>
          {(() => {
            const all = Object.values(participants).flat() as any[];
            const b = all.find((x)=> x.id === unbookingId);
            if (b?.paymentStatus === 'paid') {
              return (
                <div className="mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200">
                  <div className="font-semibold mb-1">Bokningen är markerad som betald</div>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="accent-amber-400" onChange={(e)=> (window as any).__confirmPaidRemoval = e.target.checked} />
                    <span>Jag har gjort en manuell återbetalning. Gå vidare och avboka.</span>
                  </label>
                </div>
              );
            }
            return null;
          })()}
          <DialogFooter>
            <Button variant="outline" onClick={()=>setUnbookingId(null)} className="text-white border-white/20 hover:bg-white/10">Avbryt</Button>
            <Button variant="destructive" onClick={async()=>{
              if(!unbookingId) return;
              const t = toast.loading('Avbokar...');
              try{
                const payload: any = {};
                const all = Object.values(participants).flat() as any[];
                const b = all.find((x)=> x.id === unbookingId);
                if (b?.paymentStatus === 'paid') {
                  payload.confirmPaidRemoval = Boolean((window as any).__confirmPaidRemoval);
                  if (!payload.confirmPaidRemoval) {
                    toast.error('Bekräfta återbetalning för att avboka betald bokning', { id: t });
                    return;
                  }
                }
                const res = await fetch(`/api/admin/handledar-bookings/${unbookingId}`, { method:'DELETE', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
                if(res.ok){
                  toast.success('Avbokad',{id:t});
                  setUnbookingId(null);
                  // refresh sessions count
                  try{ if (tab==='future') await loadFuture(); else await loadPast(pastPage); }catch{}
                } else {
                  const e=await res.json().catch(()=>({}));
                  toast.error(e.error||'Kunde inte avboka',{id:t});
                }
              } finally {}
            }}>Avboka</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User popup */}
      {userPopup.open && (
        <Dialog open={userPopup.open} onOpenChange={(o)=>{ if(!o) setUserPopup({ open:false, user: null, userId: null }); }}>
          <DialogContent className="bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-2xl shadow-2xl max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2"><UserIcon className="w-5 h-5"/> Användare</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              {!userPopup.user && <div className="flex items-center gap-2 text-slate-200"><Loader2 className="w-4 h-4 animate-spin"/> Hämtar användare…</div>}
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


