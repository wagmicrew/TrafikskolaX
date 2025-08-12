'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Save, Users, Calendar, Clock, Plus, Eye, ChevronUp, ChevronDown } from 'lucide-react';
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
  const [sessions, setSessions] = useState<Session[]>(initialSessions);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [showParticipantsFor, setShowParticipantsFor] = useState<string | null>(null);
  const [participants, setParticipants] = useState<Record<string, any[]>>({});
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

  // Refresh from admin API so counts exclude temporary
  useEffect(() => {
    const refresh = async () => {
      try {
        const res = await fetch('/api/admin/handledar-sessions');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.sessions)) setSessions(data.sessions);
        }
        // load students list (exclude temp)
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
  }, []);

  const loadParticipants = async (sessionId: string) => {
    try {
      // toggle open/close
      if (showParticipantsFor === sessionId) {
        setShowParticipantsFor(null);
        return;
      }
      const res = await fetch(`/api/admin/handledar-sessions/${sessionId}/participants`);
      if (!res.ok) throw new Error('Kunde inte hämta deltagare');
      const data = await res.json();
      setParticipants(prev => ({ ...prev, [sessionId]: data.participants || [] }));
      setShowParticipantsFor(sessionId);
    } catch (e: any) {
      toast.error(e.message || 'Fel vid hämtning av deltagare');
    }
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
        <Button onClick={() => setCreateOpen(true)} className="rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white">
          <Plus className="w-4 h-4 mr-1" /> Ny session
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        {sessions.map(s => (
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
                    <Button variant="outline" onClick={()=>loadParticipants(s.id)} className="border-white/20 text-white">
                      <Eye className="w-4 h-4 mr-1" /> Deltagare
                    </Button>
                    <Button onClick={()=>{ setAddOpenFor(s.id); setAddForm({ supervisorName:'', supervisorEmail:'', supervisorPhone:'', studentId:'', sendPaymentEmail:true }); }} className="bg-green-600 hover:bg-green-500 text-white">Lägg till</Button>
                  </div>
                </div>
                {showParticipantsFor===s.id && (
                  <div className="rounded-xl bg-white/5 border border-white/10 p-3">
                    <h4 className="text-white font-semibold mb-2">Deltagarlista</h4>
                    <div className="space-y-1">
                      {(participants[s.id]||[]).map((p:any)=> (
                        <div key={p.id} className="flex items-center justify-between text-white/90">
                          <span>{p.supervisorName}</span>
                          <span className="text-slate-300">{p.supervisorPhone || '-'}</span>
                        </div>
                      ))}
                      {(participants[s.id]||[]).length===0 && (
                        <div className="text-slate-300">Inga deltagare</div>
                      )}
                    </div>
                  </div>
                )}
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
            <div>
              <Label className="text-slate-200">Koppla till användare (valfritt)</Label>
              <div className="relative">
                <select value={addForm.studentId} onChange={e=>setAddForm(f=>({...f, studentId:e.target.value}))} className="w-full rounded-xl bg-white/10 border border-white/20 text-white p-3 pr-10 appearance-none">
                  <option value="">Ingen</option>
                  {studentOptions.map(s => (
                    <option key={s.id} value={s.id}>{s.label}</option>
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
              const res = await fetch(`/api/admin/handledar-sessions/${addOpenFor}/add-booking`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(addForm)});
              if(res.ok){ toast.success('Deltagare tillagd'); setAddOpenFor(null); } else { const e=await res.json().catch(()=>({})); toast.error(e.error||'Kunde inte lägga till'); }
            }} className="bg-emerald-600 hover:bg-emerald-500">Lägg till</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


