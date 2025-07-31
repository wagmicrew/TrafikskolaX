import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export default function HandledarSessionManager() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentSession, setCurrentSession] = useState(null);
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

  const handleOpenDialog = (session = null) => {
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

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
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


  const handleDelete = async (sessionId) => {
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
        <h1 className="text-2xl font-bold">Hantera Handledarkurser</h1>
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
        <DialogContent className="backdrop-blur-md bg-white/90 border border-white/20 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold text-gray-800">{isEditing ? 'Redigera Session' : 'Skapa Ny Session'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Titel</Label>
              <Input id="title" name="title" value={formData.title} onChange={handleFormChange} required />
            </div>
            <div>
              <Label htmlFor="description">Beskrivning</Label>
              <Textarea id="description" name="description" value={formData.description} onChange={handleFormChange} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date">Datum</Label>
                <Input id="date" name="date" type="date" value={formData.date} onChange={handleFormChange} required />
              </div>
              <div>
                <Label htmlFor="maxParticipants">Max Antal Deltagare</Label>
                <Input id="maxParticipants" name="maxParticipants" type="number" value={formData.maxParticipants} onChange={handleFormChange} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startTime">Starttid</Label>
                <Input id="startTime" name="startTime" type="time" value={formData.startTime} onChange={handleFormChange} required />
              </div>
              <div>
                <Label htmlFor="endTime">Sluttid</Label>
                <Input id="endTime" name="endTime" type="time" value={formData.endTime} onChange={handleFormChange} required />
              </div>
            </div>
            <div>
              <Label htmlFor="pricePerParticipant">Pris per Deltagare</Label>
              <Input id="pricePerParticipant" name="pricePerParticipant" type="number" value={formData.pricePerParticipant} onChange={handleFormChange} required />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={handleCloseDialog}>Avbryt</Button>
              <Button type="submit">{isEditing ? 'Spara Ändringar' : 'Skapa Session'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
