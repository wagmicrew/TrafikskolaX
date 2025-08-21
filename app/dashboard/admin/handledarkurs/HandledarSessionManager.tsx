import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';

export default function HandledarSessionManager() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentSession, setCurrentSession] = useState<any>(null);
  const [isAddBookingOpen, setIsAddBookingOpen] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    supervisorName: '',
    supervisorEmail: '',
    supervisorPhone: '',
    studentId: '',
    sendPaymentEmail: true,
  });
  const [students, setStudents] = useState([]);
  const [formData, setFormData] = useState({
    title: 'Handledarutbildning',
    description: 'Handledarkurs enligt Transportstyrelsens krav. Kursen behandlar bland annat trafiksäkerhet, pedagogik, ansvar och skyldigheter för handledare. Obligatorisk för alla som ska handleda någon med körkortstillstånd.',
    date: '',
    startTime: '09:00',
    endTime: '11:00',
    maxParticipants: 10,
    pricePerParticipant: 500,
  });

  useEffect(() => {
    // Fetch sessions from API
    const fetchSessions = async () => {
      try {
        const response = await fetch('/api/admin/handledar-sessions');
        const data = await response.json();
        setSessions(data.sessions);
      } catch (error) {
        console.error('Error fetching sessions:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/handledar-sessions');
      const data = await response.json();
      setSessions(data.sessions || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (session: any = null) => {
    if (session) {
      setIsEditing(true);
      setCurrentSession(session);
      setFormData({
        title: session.title,
        description: session.description,
        date: new Date(session.date).toISOString().split('T')[0],
        startTime: session.startTime,
        endTime: session.endTime,
        maxParticipants: session.maxParticipants,
        pricePerParticipant: session.pricePerParticipant,
      });
    } else {
      setIsEditing(false);
      setCurrentSession(null);
      setFormData({
        title: 'Handledarutbildning',
        description: 'Handledarkurs enligt Transportstyrelsens krav. Kursen behandlar bland annat trafiksäkerhet, pedagogik, ansvar och skyldigheter för handledare. Obligatorisk för alla som ska handleda någon med körkortstillstånd.',
        date: '',
        startTime: '09:00',
        endTime: '11:00',
        maxParticipants: 10,
        pricePerParticipant: 500,
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
  };

  const openAddBooking = async (session: any) => {
    setCurrentSession(session);
    setBookingForm({ supervisorName: '', supervisorEmail: '', supervisorPhone: '', studentId: '', sendPaymentEmail: true });
    try {
      const res = await fetch('/api/admin/users');
      const all = await res.json();
      const onlyStudents = (all || []).filter((u:any) => String(u.role).toLowerCase() === 'student');
      setStudents(onlyStudents);
    } catch {}
    setIsAddBookingOpen(true);
  };

  const submitAddBooking = async () => {
    if (!currentSession) return;
    const url = `/api/admin/handledar-sessions/${currentSession.id}/add-booking`;
    const payload = { ...bookingForm, studentId: bookingForm.studentId || null };
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (res.ok) {
      setIsAddBookingOpen(false);
      await fetchSessions();
    }
  };

  const handleFormChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const url = isEditing ? `/api/admin/handledar-sessions/${currentSession.id}` : '/api/admin/handledar-sessions';
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to save session');
      }

      await fetchSessions();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving session:', error);
    }
  };


  const handleDelete = async (sessionId: string) => {
    if (window.confirm('Är du säker på att du vill ta bort denna session?')) {
      try {
        const response = await fetch(`/api/admin/handledar-sessions/${sessionId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('Failed to delete session');
        }

        await fetchSessions();
      } catch (error) {
        console.error('Error deleting session:', error);
      }
    }
  };

  if (loading) return <p className="text-center py-4">Laddar sessioner...</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Hantera Teorilektioner</h1>
        <Button onClick={() => handleOpenDialog()}>Skapa Ny Session</Button>
      </div>
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Titel</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Datum</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tid</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Platser</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pris</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Åtgärder</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sessions.map((session) => (
              <tr key={session.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{session.title}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(session.date).toLocaleDateString('sv-SE')}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{session.startTime} - {session.endTime}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{session.currentParticipants} / {session.maxParticipants}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{session.pricePerParticipant} kr</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <Button onClick={() => handleOpenDialog(session)} variant="outline" size="sm">Redigera</Button>
                  <Button onClick={() => handleDelete(session.id)} variant="destructive" size="sm" className="ml-2">Ta bort</Button>
                  <Button onClick={() => openAddBooking(session)} size="sm" className="ml-2 bg-green-600 hover:bg-green-700 text-white">Lägg till deltagare</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {sessions.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">Inga sessioner funna. Skapa en ny session för att komma igång.</p>
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-full max-w-lg p-0 overflow-hidden border-0 bg-transparent shadow-none">
          {/* Glassmorphism style */}
          <div className="dialog-glassmorphism relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 via-transparent to-blue-500/20 rounded-xl"></div>
            <div className="relative z-10 p-6 sm:p-8">
              <DialogHeader>
                <div className="flex items-center justify-between mb-4">
                  <DialogTitle className="text-xl font-bold text-white drop-shadow-lg">
                    {isEditing ? 'Redigera Session' : 'Skapa Ny Session'}
                  </DialogTitle>

                </div>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title" className="text-white">Titel</Label>
                  <Input 
                    id="title" 
                    name="title" 
                    value={formData.title} 
                    onChange={handleFormChange} 
                    required 
                    className="bg-white/5 border-white/20 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="description" className="text-white">Beskrivning</Label>
                  <Textarea 
                    id="description" 
                    name="description" 
                    value={formData.description} 
                    onChange={handleFormChange}
                    className="bg-white/5 border-white/20 text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date" className="text-white">Datum</Label>
                    <Input 
                      id="date" 
                      name="date" 
                      type="date" 
                      value={formData.date} 
                      onChange={handleFormChange} 
                      required 
                      className="bg-white/5 border-white/20 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxParticipants" className="text-white">Max Antal Deltagare</Label>
                    <Input 
                      id="maxParticipants" 
                      name="maxParticipants" 
                      type="number" 
                      value={formData.maxParticipants} 
                      onChange={handleFormChange} 
                      required 
                      className="bg-white/5 border-white/20 text-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startTime" className="text-white">Starttid</Label>
                    <Input 
                      id="startTime" 
                      name="startTime" 
                      type="time" 
                      value={formData.startTime} 
                      onChange={handleFormChange} 
                      required 
                      className="bg-white/5 border-white/20 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="endTime" className="text-white">Sluttid</Label>
                    <Input 
                      id="endTime" 
                      name="endTime" 
                      type="time" 
                      value={formData.endTime} 
                      onChange={handleFormChange} 
                      required 
                      className="bg-white/5 border-white/20 text-white"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="pricePerParticipant" className="text-white">Pris per Deltagare</Label>
                  <Input 
                    id="pricePerParticipant" 
                    name="pricePerParticipant" 
                    type="number" 
                    value={formData.pricePerParticipant} 
                    onChange={handleFormChange} 
                    required 
                    className="bg-white/5 border-white/20 text-white"
                  />
                </div>
                
                {/* Footer */}
                <div className="flex justify-end gap-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleCloseDialog}
                    className="text-white border-white/20 hover:bg-white/10"
                  >
                    Avbryt
                  </Button>
                  <Button 
                    type="submit"
                    className="bg-sky-500 hover:bg-sky-600 text-white"
                  >
                    {isEditing ? 'Spara Ändringar' : 'Skapa Session'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Booking Dialog */}
      <Dialog open={isAddBookingOpen} onOpenChange={setIsAddBookingOpen}>
        <DialogContent className="w-full max-w-lg p-0 overflow-hidden border-0 bg-transparent shadow-none">
          <div className="dialog-glassmorphism relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 via-transparent to-blue-500/20 rounded-xl"></div>
            <div className="relative z-10 p-6 sm:p-8">
              <DialogHeader>
                <div className="flex items-center justify-between mb-4">
                  <DialogTitle className="text-xl font-bold text-white drop-shadow-lg">
                    Lägg till deltagare
                  </DialogTitle>

                </div>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className="text-white">Handledarens namn</Label>
                  <Input value={bookingForm.supervisorName} onChange={(e)=>setBookingForm({...bookingForm, supervisorName: e.target.value})} className="bg-white/5 border-white/20 text-white" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white">E-post</Label>
                    <Input type="email" value={bookingForm.supervisorEmail} onChange={(e)=>setBookingForm({...bookingForm, supervisorEmail: e.target.value})} className="bg-white/5 border-white/20 text-white" />
                  </div>
                  <div>
                    <Label className="text-white">Telefon</Label>
                    <Input value={bookingForm.supervisorPhone} onChange={(e)=>setBookingForm({...bookingForm, supervisorPhone: e.target.value})} className="bg-white/5 border-white/20 text-white" />
                  </div>
                </div>
                <div>
                  <Label className="text-white">Koppla till användare (valfritt)</Label>
                  <select value={bookingForm.studentId} onChange={(e)=>setBookingForm({...bookingForm, studentId: e.target.value})} className="w-full rounded-lg bg-white/5 border border-white/20 text-white p-2">
                    <option value="">Ingen</option>
                    {students.map((s:any)=> (
                      <option key={s.id} value={s.id}>{`${s.firstName || ''} ${s.lastName || ''}`.trim() || s.email}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <input id="sendPaymentEmail" type="checkbox" checked={bookingForm.sendPaymentEmail} onChange={(e)=>setBookingForm({...bookingForm, sendPaymentEmail: e.target.checked})} className="w-4 h-4" />
                  <Label htmlFor="sendPaymentEmail" className="text-white">Skicka betalningsinformation (Swish)</Label>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={()=>setIsAddBookingOpen(false)} className="text-white border-white/20 hover:bg-white/10">Avbryt</Button>
                  <Button onClick={submitAddBooking} className="bg-green-600 hover:bg-green-700 text-white">Lägg till</Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
