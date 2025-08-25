'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  BookOpen,
  Calendar,
  Plus,
  Edit,
  Trash2,
  Users,
  Clock,
  DollarSign,
  UserCheck,
  RefreshCw,
  Save,
  X
} from 'lucide-react';

interface TeoriLessonType {
  id: string;
  name: string;
  description: string | null;
  allowsSupervisors: boolean;
  price: string;
  pricePerSupervisor: string | null;
  durationMinutes: number;
  maxParticipants: number;
  isActive: boolean;
  sortOrder: number;
}

interface TeoriSession {
  id: string;
  lessonTypeId: string;
  title: string;
  description: string | null;
  date: string;
  startTime: string;
  endTime: string;
  maxParticipants: number;
  currentParticipants: number;
  sessionType: 'teori' | 'handledar';
  price: string;
  isActive: boolean;
  lessonTypeName?: string;
}

export default function TeoriManagementPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [lessonTypes, setLessonTypes] = useState<TeoriLessonType[]>([]);
  const [sessions, setSessions] = useState<TeoriSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingType, setEditingType] = useState<TeoriLessonType | null>(null);
  const [editingSession, setEditingSession] = useState<TeoriSession | null>(null);
  const [showTypeDialog, setShowTypeDialog] = useState(false);
  const [showSessionDialog, setShowSessionDialog] = useState(false);

  // Authentication check
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Load data
  useEffect(() => {
    if (user && user.role === 'admin') {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load lesson types
      const typesResponse = await fetch('/api/admin/teori/lesson-types');
      if (typesResponse.ok) {
        const typesData = await typesResponse.json();
        setLessonTypes(typesData.lessonTypes || []);
      }

      // Load sessions
      const sessionsResponse = await fetch('/api/admin/teori/sessions');
      if (sessionsResponse.ok) {
        const sessionsData = await sessionsResponse.json();
        setSessions(sessionsData.sessions || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Kunde inte ladda data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveLessonType = async (typeData: Partial<TeoriLessonType>) => {
    try {
      const url = editingType 
        ? `/api/admin/teori/lesson-types/${editingType.id}`
        : '/api/admin/teori/lesson-types';
      
      const method = editingType ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(typeData)
      });

      if (response.ok) {
        toast.success(editingType ? 'Lektionstyp uppdaterad' : 'Lektionstyp skapad');
        setShowTypeDialog(false);
        setEditingType(null);
        loadData();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Kunde inte spara lektionstyp');
      }
    } catch (error) {
      console.error('Error saving lesson type:', error);
      toast.error('Kunde inte spara lektionstyp');
    }
  };

  const handleSaveSession = async (sessionData: Partial<TeoriSession>) => {
    try {
      const url = editingSession 
        ? `/api/admin/teori/sessions/${editingSession.id}`
        : '/api/admin/teori/sessions';
      
      const method = editingSession ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData)
      });

      if (response.ok) {
        toast.success(editingSession ? 'Session uppdaterad' : 'Session skapad');
        setShowSessionDialog(false);
        setEditingSession(null);
        loadData();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Kunde inte spara session');
      }
    } catch (error) {
      console.error('Error saving session:', error);
      toast.error('Kunde inte spara session');
    }
  };

  const handleDeleteLessonType = async (id: string) => {
    if (!confirm('Är du säker på att du vill ta bort denna lektionstyp?')) return;

    try {
      const response = await fetch(`/api/admin/teori/lesson-types/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Lektionstyp borttagen');
        loadData();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Kunde inte ta bort lektionstyp');
      }
    } catch (error) {
      console.error('Error deleting lesson type:', error);
      toast.error('Kunde inte ta bort lektionstyp');
    }
  };

  const handleDeleteSession = async (id: string) => {
    if (!confirm('Är du säker på att du vill ta bort denna session?')) return;

    try {
      const response = await fetch(`/api/admin/teori/sessions/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Session borttagen');
        loadData();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Kunde inte ta bort session');
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      toast.error('Kunde inte ta bort session');
    }
  };

  if (authLoading || !user) {
    return <div className="flex items-center justify-center min-h-screen">Laddar...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Teori Hantering</h1>
          <p className="text-gray-600">Hantera teorilektionstyper och sessioner</p>
        </div>
        <Button
          onClick={loadData}
          disabled={loading}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Uppdatera
        </Button>
      </div>

      <Tabs defaultValue="lesson-types" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="lesson-types" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Lektionstyper
          </TabsTrigger>
          <TabsTrigger value="sessions" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Sessioner
          </TabsTrigger>
        </TabsList>

        {/* Lesson Types Tab */}
        <TabsContent value="lesson-types" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Lektionstyper ({lessonTypes.length})</h2>
            <Button
              onClick={() => {
                setEditingType(null);
                setShowTypeDialog(true);
              }}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Ny Lektionstyp
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lessonTypes.map((type) => (
              <Card key={type.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{type.name}</CardTitle>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingType(type);
                          setShowTypeDialog(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteLessonType(type.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  {type.description && (
                    <CardDescription>{type.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Pris:</span>
                    <span className="font-semibold">{type.price} SEK</span>
                  </div>
                  
                  {type.allowsSupervisors && type.pricePerSupervisor && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Per handledare:</span>
                      <span className="font-semibold">{type.pricePerSupervisor} SEK</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Längd:</span>
                    <span>{type.durationMinutes} min</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Max deltagare:</span>
                    <span>{type.maxParticipants}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {type.allowsSupervisors ? (
                      <Badge variant="outline" className="border-green-300 text-green-700">
                        <UserCheck className="w-3 h-3 mr-1" />
                        Med Handledare
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-blue-300 text-blue-700">
                        <Users className="w-3 h-3 mr-1" />
                        Student
                      </Badge>
                    )}
                    
                    <Badge variant={type.isActive ? "default" : "secondary"}>
                      {type.isActive ? 'Aktiv' : 'Inaktiv'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Sessions Tab */}
        <TabsContent value="sessions" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Sessioner ({sessions.length})</h2>
            <Button
              onClick={() => {
                setEditingSession(null);
                setShowSessionDialog(true);
              }}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Ny Session
            </Button>
          </div>

          <div className="space-y-4">
            {sessions.map((session) => (
              <Card key={session.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold">{session.title}</h3>
                        <Badge variant={session.sessionType === 'handledar' ? 'default' : 'secondary'}>
                          {session.sessionType === 'handledar' ? 'Handledar' : 'Teori'}
                        </Badge>
                        <Badge variant={session.isActive ? "default" : "secondary"}>
                          {session.isActive ? 'Aktiv' : 'Inaktiv'}
                        </Badge>
                      </div>
                      
                      {session.description && (
                        <p className="text-gray-600 mb-3">{session.description}</p>
                      )}

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Datum:</span>
                          <div className="font-medium">{new Date(session.date).toLocaleDateString('sv-SE')}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Tid:</span>
                          <div className="font-medium">{session.startTime} - {session.endTime}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Deltagare:</span>
                          <div className="font-medium">{session.currentParticipants}/{session.maxParticipants}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Pris:</span>
                          <div className="font-medium">{session.price} SEK</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-1 ml-4">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingSession(session);
                          setShowSessionDialog(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteSession(session.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Lesson Type Dialog */}
      <LessonTypeDialog
        open={showTypeDialog}
        onOpenChange={setShowTypeDialog}
        lessonType={editingType}
        onSave={handleSaveLessonType}
      />

      {/* Session Dialog */}
      <SessionDialog
        open={showSessionDialog}
        onOpenChange={setShowSessionDialog}
        session={editingSession}
        lessonTypes={lessonTypes}
        onSave={handleSaveSession}
      />
    </div>
  );
}

// Lesson Type Dialog Component
function LessonTypeDialog({ 
  open, 
  onOpenChange, 
  lessonType, 
  onSave 
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lessonType: TeoriLessonType | null;
  onSave: (data: Partial<TeoriLessonType>) => void;
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    allowsSupervisors: false,
    price: '',
    pricePerSupervisor: '',
    durationMinutes: 60,
    maxParticipants: 1,
    isActive: true,
    sortOrder: 0
  });

  useEffect(() => {
    if (lessonType) {
      setFormData({
        name: lessonType.name,
        description: lessonType.description || '',
        allowsSupervisors: lessonType.allowsSupervisors,
        price: lessonType.price,
        pricePerSupervisor: lessonType.pricePerSupervisor || '',
        durationMinutes: lessonType.durationMinutes,
        maxParticipants: lessonType.maxParticipants,
        isActive: lessonType.isActive,
        sortOrder: lessonType.sortOrder
      });
    } else {
      setFormData({
        name: '',
        description: '',
        allowsSupervisors: false,
        price: '',
        pricePerSupervisor: '',
        durationMinutes: 60,
        maxParticipants: 1,
        isActive: true,
        sortOrder: 0
      });
    }
  }, [lessonType, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {lessonType ? 'Redigera Lektionstyp' : 'Ny Lektionstyp'}
          </DialogTitle>
          <DialogDescription>
            Fyll i informationen för lektionstypen
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Namn</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Beskrivning</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price">Pris (SEK)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="duration">Längd (min)</Label>
              <Input
                id="duration"
                type="number"
                value={formData.durationMinutes}
                onChange={(e) => setFormData(prev => ({ ...prev, durationMinutes: parseInt(e.target.value) }))}
                required
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="allowsSupervisors"
              checked={formData.allowsSupervisors}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, allowsSupervisors: !!checked }))}
            />
            <Label htmlFor="allowsSupervisors">Tillåt handledare</Label>
          </div>

          {formData.allowsSupervisors && (
            <div>
              <Label htmlFor="pricePerSupervisor">Pris per handledare (SEK)</Label>
              <Input
                id="pricePerSupervisor"
                type="number"
                step="0.01"
                value={formData.pricePerSupervisor}
                onChange={(e) => setFormData(prev => ({ ...prev, pricePerSupervisor: e.target.value }))}
              />
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: !!checked }))}
            />
            <Label htmlFor="isActive">Aktiv</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Avbryt
            </Button>
            <Button type="submit">
              <Save className="w-4 h-4 mr-2" />
              Spara
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Session Dialog Component
function SessionDialog({ 
  open, 
  onOpenChange, 
  session, 
  lessonTypes,
  onSave 
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: TeoriSession | null;
  lessonTypes: TeoriLessonType[];
  onSave: (data: Partial<TeoriSession>) => void;
}) {
  const [formData, setFormData] = useState({
    lessonTypeId: '',
    title: '',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
    maxParticipants: 1,
    sessionType: 'teori' as 'teori' | 'handledar',
    price: '',
    isActive: true
  });

  useEffect(() => {
    if (session) {
      setFormData({
        lessonTypeId: session.lessonTypeId,
        title: session.title,
        description: session.description || '',
        date: session.date,
        startTime: session.startTime,
        endTime: session.endTime,
        maxParticipants: session.maxParticipants,
        sessionType: session.sessionType,
        price: session.price,
        isActive: session.isActive
      });
    } else {
      setFormData({
        lessonTypeId: '',
        title: '',
        description: '',
        date: '',
        startTime: '',
        endTime: '',
        maxParticipants: 1,
        sessionType: 'teori',
        price: '',
        isActive: true
      });
    }
  }, [session, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {session ? 'Redigera Session' : 'Ny Session'}
          </DialogTitle>
          <DialogDescription>
            Fyll i informationen för sessionen
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="lessonTypeId">Lektionstyp</Label>
            <Select
              value={formData.lessonTypeId}
              onValueChange={(value) => setFormData(prev => ({ ...prev, lessonTypeId: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Välj lektionstyp" />
              </SelectTrigger>
              <SelectContent>
                {lessonTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="title">Titel</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Beskrivning</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="date">Datum</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startTime">Starttid</Label>
              <Input
                id="startTime"
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="endTime">Sluttid</Label>
              <Input
                id="endTime"
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="maxParticipants">Max deltagare</Label>
              <Input
                id="maxParticipants"
                type="number"
                value={formData.maxParticipants}
                onChange={(e) => setFormData(prev => ({ ...prev, maxParticipants: parseInt(e.target.value) }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="price">Pris (SEK)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="sessionType">Sessionstyp</Label>
            <Select
              value={formData.sessionType}
              onValueChange={(value: 'teori' | 'handledar') => setFormData(prev => ({ ...prev, sessionType: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="teori">Teori</SelectItem>
                <SelectItem value="handledar">Handledar</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: !!checked }))}
            />
            <Label htmlFor="isActive">Aktiv</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Avbryt
            </Button>
            <Button type="submit">
              <Save className="w-4 h-4 mr-2" />
              Spara
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
