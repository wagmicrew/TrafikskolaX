"use client";

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OrbSpinner } from '@/components/ui/orb-loader';
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
  BookOpen,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Mail,
  UserPlus,
  UserMinus,
  Settings,
  CheckCircle,
  AlertCircle,
  Crown
} from 'lucide-react';

interface TeoriLessonType {
  id: string;
  name: string;
  description?: string;
  allowsSupervisors: boolean;
  price: string;
  priceStudent: string;
  pricePerSupervisor: string | null;
  durationMinutes: number;
  maxParticipants: number;
  isActive: boolean;
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
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lessonType: TeoriLessonType;
  participants?: TeoriParticipant[];
}

interface TeoriParticipant {
  id: string;
  sessionId: string;
  userId: string;
  userName: string;
  userEmail: string;
  isSupervisor: boolean;
  createdAt: string;
  status: 'confirmed' | 'pending' | 'cancelled';
}

interface SessionFormData {
  lessonTypeId: string;
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  maxParticipants: string;
  isActive: boolean;
}

interface LessonTypeFormData {
  name: string;
  description: string;
  price: string;
  priceStudent: string;
  pricePerSupervisor: string;
  durationMinutes: string;
  maxParticipants: string;
  allowsSupervisors: boolean;
  isActive: boolean;
}

export function TeoriSessionsClient() {
  // State management
  const [activeTab, setActiveTab] = useState<'sessions' | 'types'>('sessions');
  const [sessions, setSessions] = useState<TeoriSession[]>([]);
  const [lessonTypes, setLessonTypes] = useState<TeoriLessonType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Session management
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<TeoriSession | null>(null);
  const [sessionFormData, setSessionFormData] = useState<SessionFormData>({
    lessonTypeId: '',
    title: '',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
    maxParticipants: '8',
    isActive: true
  });

  // Lesson type management
  const [typeDialogOpen, setTypeDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<TeoriLessonType | null>(null);
  const [typeFormData, setTypeFormData] = useState<LessonTypeFormData>({
    name: '',
    description: '',
    price: '',
    priceStudent: '',
    pricePerSupervisor: '',
    durationMinutes: '60',
    maxParticipants: '12',
    allowsSupervisors: false,
    isActive: true
  });

  // Participant management
  const [participantDialogOpen, setParticipantDialogOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<TeoriSession | null>(null);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);

  // Load data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [sessionsResponse, typesResponse] = await Promise.all([
        fetch('/api/teori/sessions'),
        fetch('/api/teori/lesson-types')
      ]);

      if (sessionsResponse.ok) {
        const sessionsData = await sessionsResponse.json();
        setSessions(sessionsData.sessions || []);
      }

      if (typesResponse.ok) {
        const typesData = await typesResponse.json();
        setLessonTypes(typesData.lessonTypes || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Kunde inte ladda data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Format currency
  const formatCurrency = (amount: string | number) => {
    const price = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('sv-SE').format(price);
  };

  // Format date and time
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('sv-SE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return timeString.slice(0, 5).replace(':', '.');
  };

  // Session CRUD operations
  const handleSessionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const method = editingSession ? 'PUT' : 'POST';
      const url = editingSession
        ? `/api/teori/sessions/${editingSession.id}`
        : '/api/teori/sessions';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonTypeId: sessionFormData.lessonTypeId,
          title: sessionFormData.title,
          description: sessionFormData.description,
          date: sessionFormData.date,
          startTime: sessionFormData.startTime,
          endTime: sessionFormData.endTime,
          maxParticipants: parseInt(sessionFormData.maxParticipants),
          isActive: sessionFormData.isActive
        })
      });

      if (response.ok) {
        toast.success(editingSession ? 'Sessionen uppdaterad' : 'Sessionen skapad');
        setSessionDialogOpen(false);
        setEditingSession(null);
        resetSessionForm();
        loadData();
      } else {
        toast.error('Kunde inte spara sessionen');
      }
    } catch (error) {
      console.error('Error saving session:', error);
      toast.error('Ett fel uppstod');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('Är du säker på att du vill ta bort denna session?')) return;

    try {
      const response = await fetch(`/api/teori/sessions/${sessionId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Sessionen borttagen');
        loadData();
      } else {
        toast.error('Kunde inte ta bort sessionen');
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      toast.error('Ett fel uppstod');
    }
  };

  // Lesson type CRUD operations
  const handleTypeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const method = editingType ? 'PUT' : 'POST';
      const url = editingType
        ? `/api/teori/lesson-types/${editingType.id}`
        : '/api/teori/lesson-types';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: typeFormData.name,
          description: typeFormData.description,
          price: typeFormData.price,
          priceStudent: typeFormData.priceStudent,
          pricePerSupervisor: typeFormData.pricePerSupervisor,
          durationMinutes: parseInt(typeFormData.durationMinutes),
          maxParticipants: parseInt(typeFormData.maxParticipants),
          allowsSupervisors: typeFormData.allowsSupervisors,
          isActive: typeFormData.isActive
        })
      });

      if (response.ok) {
        toast.success(editingType ? 'Lektionstypen uppdaterad' : 'Lektionstypen skapad');
        setTypeDialogOpen(false);
        setEditingType(null);
        resetTypeForm();
        loadData();
      } else {
        toast.error('Kunde inte spara lektionstypen');
      }
    } catch (error) {
      console.error('Error saving lesson type:', error);
      toast.error('Ett fel uppstod');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteType = async (typeId: string) => {
    if (!confirm('Är du säker på att du vill ta bort denna lektionstyp?')) return;

    try {
      const response = await fetch(`/api/teori/lesson-types/${typeId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Lektionstypen borttagen');
        loadData();
      } else {
        toast.error('Kunde inte ta bort lektionstypen');
      }
    } catch (error) {
      console.error('Error deleting lesson type:', error);
      toast.error('Ett fel uppstod');
    }
  };

  // Form helpers
  const resetSessionForm = () => {
    setSessionFormData({
      lessonTypeId: '',
      title: '',
      description: '',
      date: '',
      startTime: '',
      endTime: '',
      maxParticipants: '8',
      isActive: true
    });
  };

  const resetTypeForm = () => {
    setTypeFormData({
      name: '',
      description: '',
      price: '',
      priceStudent: '',
      pricePerSupervisor: '',
      durationMinutes: '60',
      maxParticipants: '12',
      allowsSupervisors: false,
      isActive: true
    });
  };

  const openSessionDialog = (session?: TeoriSession) => {
    if (session) {
      setEditingSession(session);
      setSessionFormData({
        lessonTypeId: session.lessonTypeId,
        title: session.title,
        description: session.description || '',
        date: session.date,
        startTime: session.startTime,
        endTime: session.endTime,
        maxParticipants: session.maxParticipants.toString(),
        isActive: session.isActive
      });
    } else {
      resetSessionForm();
    }
    setSessionDialogOpen(true);
  };

  const openTypeDialog = (type?: TeoriLessonType) => {
    if (type) {
      setEditingType(type);
      setTypeFormData({
        name: type.name,
        description: type.description || '',
        price: type.price,
        priceStudent: type.priceStudent,
        pricePerSupervisor: type.pricePerSupervisor || '',
        durationMinutes: type.durationMinutes.toString(),
        maxParticipants: type.maxParticipants.toString(),
        allowsSupervisors: type.allowsSupervisors,
        isActive: type.isActive
      });
    } else {
      resetTypeForm();
    }
    setTypeDialogOpen(true);
  };

  // Participant management
  const openParticipantDialog = (session: TeoriSession) => {
    setSelectedSession(session);
    setParticipantDialogOpen(true);
    // Load available users for this session
    loadAvailableUsers();
  };

  const loadAvailableUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setAvailableUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <OrbSpinner size="lg" className="mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">Laddar teorisessioner</h2>
          <p className="text-gray-600 font-medium">Förbereder dina teorisessioner...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="w-full px-4 md:px-6 py-6 md:py-12">
        {/* Header */}
        <div className="text-center mb-8 md:mb-12">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
              <BookOpen className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-gray-900 tracking-tight">
              Teorisessioner
            </h1>
          </div>
          <p className="text-lg md:text-xl text-gray-700 font-medium leading-relaxed">
            Hantera teorilektioner och deltagare
          </p>
        </div>

        {/* New buttons */}
        <div className="flex justify-end mb-8 gap-4">
          <Button
            onClick={() => openSessionDialog()}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Plus className="w-5 h-5 mr-2" />
            Ny session
          </Button>
          <Button
            onClick={() => openTypeDialog()}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Settings className="w-5 h-5 mr-2" />
            Ny lektionstyp
          </Button>
        </div>

        {/* Main content */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'sessions' | 'types')} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="sessions" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Sessioner
            </TabsTrigger>
            <TabsTrigger value="types" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Lektionstyper
            </TabsTrigger>
          </TabsList>

          {/* Sessions Tab */}
          <TabsContent value="sessions" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sessions.map((session) => (
                <Card key={session.id} className="shadow-xl border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl hover:shadow-2xl transition-all duration-300">
                  <CardHeader className="pb-4 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">
                          {session.title}
                        </CardTitle>
                        <CardDescription className="text-base text-slate-600 dark:text-slate-300">
                          {session.lessonType.name}
                        </CardDescription>
                      </div>
                      <Badge variant={session.isActive ? "default" : "secondary"} className="ml-2">
                        {session.isActive ? 'Aktiv' : 'Inaktiv'}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                        <Calendar className="w-4 h-4" />
                        {formatDate(session.date)}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                        <Clock className="w-4 h-4" />
                        {formatTime(session.startTime)} - {formatTime(session.endTime)}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                        <Users className="w-4 h-4" />
                        {session.currentParticipants}/{session.maxParticipants} deltagare
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                        <Crown className="w-4 h-4" />
                        {formatCurrency(session.lessonType.price)} SEK
                      </div>

                      <div className="flex gap-2 pt-4">
                        <Button
                          size="sm"
                          onClick={() => openParticipantDialog(session)}
                          className="flex-1 bg-blue-600 hover:bg-blue-700"
                        >
                          <UserPlus className="w-4 h-4 mr-1" />
                          Deltagare
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openSessionDialog(session)}
                          className="bg-white/50 hover:bg-white/70"
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteSession(session.id)}
                          className="bg-red-500 hover:bg-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {sessions.length === 0 && (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-600 mb-2">Inga teorisessioner</h3>
                <p className="text-slate-500">Skapa din första teorisession för att komma igång</p>
              </div>
            )}
          </TabsContent>

          {/* Lesson Types Tab */}
          <TabsContent value="types" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {lessonTypes.map((type) => (
                <Card key={type.id} className="shadow-xl border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl hover:shadow-2xl transition-all duration-300">
                  <CardHeader className="pb-4 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">
                          {type.name}
                        </CardTitle>
                        <CardDescription className="text-base text-slate-600 dark:text-slate-300">
                          {type.description}
                        </CardDescription>
                      </div>
                      <Badge variant={type.isActive ? "default" : "secondary"} className="ml-2">
                        {type.isActive ? 'Aktiv' : 'Inaktiv'}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                        <Clock className="w-4 h-4" />
                        {type.durationMinutes} minuter
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                        <Users className="w-4 h-4" />
                        Max {type.maxParticipants} deltagare
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                        <Crown className="w-4 h-4" />
                        {formatCurrency(type.price)} SEK
                      </div>
                      {type.allowsSupervisors && (
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                          <UserPlus className="w-4 h-4" />
                          Handledare: {formatCurrency(type.pricePerSupervisor)} SEK
                        </div>
                      )}

                      <div className="flex gap-2 pt-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openTypeDialog(type)}
                          className="flex-1 bg-white/50 hover:bg-white/70"
                        >
                          <Edit3 className="w-4 h-4 mr-1" />
                          Redigera
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteType(type.id)}
                          className="bg-red-500 hover:bg-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {lessonTypes.length === 0 && (
              <div className="text-center py-12">
                <Settings className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-600 mb-2">Inga lektionstyper</h3>
                <p className="text-slate-500">Skapa din första lektionstyp för att komma igång</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Session Dialog */}
        <Dialog open={sessionDialogOpen} onOpenChange={setSessionDialogOpen}>
          <DialogContent className="sm:max-w-[600px] z-50">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                {editingSession ? 'Redigera session' : 'Skapa ny session'}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSessionSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lessonTypeId" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Lektionstyp *
                  </Label>
                  <Select
                    value={sessionFormData.lessonTypeId}
                    onValueChange={(value) => setSessionFormData(prev => ({ ...prev, lessonTypeId: value }))}
                  >
                    <SelectTrigger className="h-12 rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800">
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

                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Titel *
                  </Label>
                  <Input
                    id="title"
                    value={sessionFormData.title}
                    onChange={(e) => setSessionFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Sessionens titel"
                    className="h-12 rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Beskrivning
                </Label>
                <Textarea
                  id="description"
                  value={sessionFormData.description}
                  onChange={(e) => setSessionFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Kort beskrivning av sessionen"
                  className="min-h-[80px] rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Datum *
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={sessionFormData.date}
                    onChange={(e) => setSessionFormData(prev => ({ ...prev, date: e.target.value }))}
                    className="h-12 rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="startTime" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Starttid *
                  </Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={sessionFormData.startTime}
                    onChange={(e) => setSessionFormData(prev => ({ ...prev, startTime: e.target.value }))}
                    className="h-12 rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endTime" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Sluttid *
                  </Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={sessionFormData.endTime}
                    onChange={(e) => setSessionFormData(prev => ({ ...prev, endTime: e.target.value }))}
                    className="h-12 rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxParticipants" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Max deltagare *
                  </Label>
                  <Input
                    id="maxParticipants"
                    type="number"
                    value={sessionFormData.maxParticipants}
                    onChange={(e) => setSessionFormData(prev => ({ ...prev, maxParticipants: e.target.value }))}
                    placeholder="8"
                    className="h-12 rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                  <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Aktiv session
                  </Label>
                  <Switch
                    checked={sessionFormData.isActive}
                    onCheckedChange={(checked) => setSessionFormData(prev => ({ ...prev, isActive: checked }))}
                    className="data-[state=checked]:bg-blue-600"
                  />
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSessionDialogOpen(false)}
                  className="bg-white/50 hover:bg-white/70"
                >
                  Avbryt
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {saving ? (
                    <>
                      <OrbSpinner size="sm" className="mr-2" />
                      Sparar...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {editingSession ? 'Uppdatera' : 'Skapa'} session
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Lesson Type Dialog */}
        <Dialog open={typeDialogOpen} onOpenChange={setTypeDialogOpen}>
          <DialogContent className="sm:max-w-[600px] z-50">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                {editingType ? 'Redigera lektionstyp' : 'Skapa ny lektionstyp'}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleTypeSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Namn *
                </Label>
                <Input
                  id="name"
                  value={typeFormData.name}
                  onChange={(e) => setTypeFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="T.ex. Risktvåan - Teorilektion"
                  className="h-12 rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Beskrivning
                </Label>
                <Textarea
                  id="description"
                  value={typeFormData.description}
                  onChange={(e) => setTypeFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Kort beskrivning av lektionstypen"
                  className="min-h-[80px] rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Pris (SEK) *
                  </Label>
                  <Input
                    id="price"
                    value={typeFormData.price}
                    onChange={(e) => setTypeFormData(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="150.00"
                    className="h-12 rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priceStudent" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Studentpris (SEK) *
                  </Label>
                  <Input
                    id="priceStudent"
                    value={typeFormData.priceStudent}
                    onChange={(e) => setTypeFormData(prev => ({ ...prev, priceStudent: e.target.value }))}
                    placeholder="120.00"
                    className="h-12 rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Tillåt handledare
                </Label>
                <Switch
                  checked={typeFormData.allowsSupervisors}
                  onCheckedChange={(checked) => setTypeFormData(prev => ({ ...prev, allowsSupervisors: checked }))}
                  className="data-[state=checked]:bg-blue-600"
                />
              </div>

              {typeFormData.allowsSupervisors && (
                <div className="space-y-2">
                  <Label htmlFor="pricePerSupervisor" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Pris per handledare (SEK)
                  </Label>
                  <Input
                    id="pricePerSupervisor"
                    value={typeFormData.pricePerSupervisor}
                    onChange={(e) => setTypeFormData(prev => ({ ...prev, pricePerSupervisor: e.target.value }))}
                    placeholder="50.00"
                    className="h-12 rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="durationMinutes" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Längd (minuter) *
                  </Label>
                  <Input
                    id="durationMinutes"
                    type="number"
                    value={typeFormData.durationMinutes}
                    onChange={(e) => setTypeFormData(prev => ({ ...prev, durationMinutes: e.target.value }))}
                    placeholder="60"
                    className="h-12 rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxParticipants" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Max deltagare *
                  </Label>
                  <Input
                    id="maxParticipants"
                    type="number"
                    value={typeFormData.maxParticipants}
                    onChange={(e) => setTypeFormData(prev => ({ ...prev, maxParticipants: e.target.value }))}
                    placeholder="12"
                    className="h-12 rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Aktiv lektionstyp
                </Label>
                <Switch
                  checked={typeFormData.isActive}
                  onCheckedChange={(checked) => setTypeFormData(prev => ({ ...prev, isActive: checked }))}
                  className="data-[state=checked]:bg-blue-600"
                />
              </div>

              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setTypeDialogOpen(false)}
                  className="bg-white/50 hover:bg-white/70"
                >
                  Avbryt
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {saving ? (
                    <>
                      <OrbSpinner size="sm" className="mr-2" />
                      Sparar...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {editingType ? 'Uppdatera' : 'Skapa'} lektionstyp
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Participant Management Dialog */}
        <Dialog open={participantDialogOpen} onOpenChange={setParticipantDialogOpen}>
          <DialogContent className="sm:max-w-[700px] z-50">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Hantera deltagare - {selectedSession?.title}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Aktuella deltagare</h4>
                  <p className="text-blue-700 dark:text-blue-300 text-sm">
                    {selectedSession?.currentParticipants || 0} av {selectedSession?.maxParticipants} platser upptagna
                  </p>
                </div>

                <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg">
                  <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">Lägg till deltagare</h4>
                  <p className="text-green-700 dark:text-green-300 text-sm">
                    Välj användare från listan nedan
                  </p>
                </div>
              </div>

              <div className="text-center py-8">
                <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">Deltagarhantering kommer snart...</p>
              </div>
            </div>

            <DialogFooter>
              <Button
                onClick={() => setParticipantDialogOpen(false)}
                className="bg-slate-600 hover:bg-slate-700"
              >
                Stäng
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
