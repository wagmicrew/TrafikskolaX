"use client";

import React, { useState, useEffect } from 'react';
import { 
  Plus,
  Edit3,
  Trash2,
  Save,
  BookOpen,
  Users,
  Clock,
  Calendar,
  DollarSign,
  X,
  AlertTriangle,
  Bookmark,
  ChevronDown,
  Edit,
  FileEdit,
  Info,
  InfoIcon,
  List,
  ListChecks,
  ListOrdered,
  Loader2,
  LogOut,
  SquarePlus,
  Trash2Icon,
  User,
  UserPlus
} from 'lucide-react';
import { FiInfo, FiAlertCircle } from 'react-icons/fi';
import { Modal, Button, Card, Badge, Spinner, Banner, Tooltip, Alert, TextInput } from 'flowbite-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import toast from 'react-hot-toast';

interface Booking {
  id: string;
  sessionId: string;
  studentId: string | null;
  status: string;
  paymentStatus: string;
  paymentMethod: string | null;
  price: string;
  createdAt: string;
  updatedAt: string;
  // Student details
  studentFirstName: string | null;
  studentLastName: string | null;
  studentEmail: string | null;
  studentPersonalNumber: string | null;
}

interface Session {
  id: string;
  lessonTypeId: string;
  title: string;
  description: string | null;
  date: string;
  startTime: string;
  endTime: string;
  price: string;
  pricePerSupervisor: string | null;
  durationMinutes: number;
  maxParticipants: number;
  isActive: boolean;
  currentParticipants: number;
  createdAt: string;
  updatedAt: string;
  lessonTypeName: string;
  lessonTypeAllowsSupervisors: boolean;
  lessonTypePrice: string;
  lessonTypePricePerSupervisor: string | null;
  bookings: Booking[];
}

interface LessonType {
  id: string;
  name: string;
  description: string | null;
  allowsSupervisors: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  sessions: Session[];
}

interface Student {
  id: string;
  name: string;
  email: string;
  personalNumber: string | null;
}

interface ParticipantFormData {
  studentId: string;
  supervisorName: string;
  supervisorEmail: string;
  supervisorPhone: string;
  personalId: string;
  sendPaymentEmail: boolean;
}

interface LessonTypeFormData {
  name: string;
  description: string;
  allowsSupervisors: boolean;
  sortOrder: string;
}

interface SessionFormData {
  lessonTypeId: string;
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  price: string;
  pricePerSupervisor: string;
  durationMinutes: string;
  maxParticipants: string;
  isActive: boolean;
}

export default function TeoriHanteringClient({
  structuredData: initialStructuredData,
  students
}: {
  structuredData: LessonType[];
  students: Student[];
}) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showExitWarning, setShowExitWarning] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);

  // Form refs to enable Banner "Spara nu" behavior
  const createTypeFormRef = React.useRef<HTMLFormElement | null>(null);
  const editTypeFormRef = React.useRef<HTMLFormElement | null>(null);
  const createSessionFormRef = React.useRef<HTMLFormElement | null>(null);
  const editSessionFormRef = React.useRef<HTMLFormElement | null>(null);
  const addParticipantFormRef = React.useRef<HTMLFormElement | null>(null);

  // Add defensive programming for initial data
  const safeStructuredData = Array.isArray(initialStructuredData) ? initialStructuredData : [];
  const safeStudents = Array.isArray(students) ? students : [];

  const [structuredData, setStructuredData] = useState<LessonType[]>(safeStructuredData.map(lessonType => ({
    ...lessonType,
    sessions: Array.isArray(lessonType.sessions) ? lessonType.sessions.map(session => ({
      ...session,
      bookings: Array.isArray(session.bookings) ? session.bookings : []
    })) : []
  })));

  // Dialog states
  const [isCreateTypeOpen, setIsCreateTypeOpen] = useState(false);
  const [isEditTypeOpen, setIsEditTypeOpen] = useState(false);
  const [isCreateSessionOpen, setIsCreateSessionOpen] = useState(false);
  const [isEditSessionOpen, setIsEditSessionOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAddParticipantOpen, setIsAddParticipantOpen] = useState(false);

  // Form states
  const [typeFormData, setTypeFormData] = useState<LessonTypeFormData>({
    name: '',
    description: '',
    allowsSupervisors: false,
    sortOrder: '0'
  });

  const [sessionFormData, setSessionFormData] = useState<SessionFormData>({
    lessonTypeId: '',
    title: '',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
    price: '',
    pricePerSupervisor: '',
    durationMinutes: '60',
    maxParticipants: '1',
    isActive: true
  });

  const [participantFormData, setParticipantFormData] = useState<ParticipantFormData>({
    studentId: '',
    supervisorName: '',
    supervisorEmail: '',
    supervisorPhone: '',
    personalId: '',
    sendPaymentEmail: false,
  });

  // Current item states
  const [editingType, setEditingType] = useState<LessonType | null>(null);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'type' | 'session'; item: any } | null>(null);
  const [participantTargetSessionId, setParticipantTargetSessionId] = useState<string | null>(null);

  const updateParticipantForm = (field: keyof ParticipantFormData, value: any) => {
    setParticipantFormData(prev => ({ ...prev, [field]: value }));
  };

  // Update structuredData when props change
  useEffect(() => {
    if (initialStructuredData) {
      setStructuredData(initialStructuredData);
    }
  }, [initialStructuredData]);

  // Load data
  const loadData = async () => {
    try {
      setLoading(true);
      // Fetch fresh data from the server
      const response = await fetch('/dashboard/admin/teorihantering', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (response.ok) {
        // Reload the page to get fresh structured data
        window.location.reload();
      } else {
        throw new Error('Failed to refresh data');
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Kunde inte ladda data', {
        style: { background: '#ef4444', color: '#fff', border: '1px solid #dc2626' },
        icon: '❌'
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle form changes
  const updateTypeForm = (field: keyof LessonTypeFormData, value: any) => {
    setTypeFormData(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  const updateSessionForm = (field: keyof SessionFormData, value: any) => {
    setSessionFormData(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  // Reset forms
  const resetTypeForm = () => {
    setTypeFormData({
      name: '',
      description: '',
      allowsSupervisors: false,
      sortOrder: '0'
    });
    setEditingType(null);
  };

  const resetSessionForm = () => {
    setSessionFormData({
      lessonTypeId: '',
      title: '',
      description: '',
      date: '',
      startTime: '',
      endTime: '',
      price: '',
      pricePerSupervisor: '',
      durationMinutes: '60',
      maxParticipants: '1',
      isActive: true
    });
    setEditingSession(null);
  };

  const resetParticipantForm = () => {
    setParticipantFormData({
      studentId: '',
      supervisorName: '',
      supervisorEmail: '',
      supervisorPhone: '',
      personalId: '',
      sendPaymentEmail: false,
    });
  };

  // Handle type operations
  const handleCreateType = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch('/api/admin/teori-lesson-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: typeFormData.name,
          description: typeFormData.description,
          allowsSupervisors: typeFormData.allowsSupervisors,
          sortOrder: parseInt(typeFormData.sortOrder)
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message, {
          style: { background: '#10b981', color: '#fff', border: '1px solid #059669' },
          icon: '✅'
        });
        setIsCreateTypeOpen(false);
        resetTypeForm();
        loadData();
        setHasUnsavedChanges(false);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Ett fel uppstod', {
          style: { background: '#ef4444', color: '#fff', border: '1px solid #dc2626' },
          icon: '❌'
        });
      }
    } catch (error) {
      console.error('Error creating lesson type:', error);
      toast.error('Kunde inte skapa teorilektionstyp', {
        style: { background: '#ef4444', color: '#fff', border: '1px solid #dc2626' },
        icon: '❌'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEditType = (type: LessonType) => {
    setTypeFormData({
      name: type.name,
      description: type.description || '',
      allowsSupervisors: type.allowsSupervisors,
      sortOrder: type.sortOrder.toString()
    });
    setIsEditTypeOpen(true);
  };

  const handleUpdateType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingType) return;

    setSaving(true);

    try {
      const response = await fetch(`/api/admin/teori-lesson-types/${editingType.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: typeFormData.name,
          description: typeFormData.description,
          allowsSupervisors: typeFormData.allowsSupervisors,
          sortOrder: parseInt(typeFormData.sortOrder)
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message, {
          style: { background: '#10b981', color: '#fff', border: '1px solid #059669' },
          icon: '✅'
        });
        setIsEditTypeOpen(false);
        resetTypeForm();
        loadData();
        setHasUnsavedChanges(false);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Ett fel uppstod', {
          style: { background: '#ef4444', color: '#fff', border: '1px solid #dc2626' },
          icon: '❌'
        });
      }
    } catch (error) {
      console.error('Error updating lesson type:', error);
      toast.error('Kunde inte uppdatera teorilektionstyp', {
        style: { background: '#ef4444', color: '#fff', border: '1px solid #dc2626' },
        icon: '❌'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteType = async () => {
    if (!deleteTarget || deleteTarget.type !== 'type') return;
    const typeId = deleteTarget.item.id;
    
    try {
      setSaving(true);
      const response = await fetch(`/api/admin/teori-lesson-types/${typeId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        const data = await response.json();
        toast.success(data.message, {
          style: { background: '#10b981', color: '#fff', border: '1px solid #059669' },
          icon: '✅'
        });
        loadData();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Kunde inte radera teorilektionstyp', {
          style: { background: '#ef4444', color: '#fff', border: '1px solid #dc2626' },
          icon: '❌'
        });
      }
    } catch (error) {
      console.error('Error deleting lesson type:', error);
      toast.error('Kunde inte radera teorilektionstyp', {
        style: { background: '#ef4444', color: '#fff', border: '1px solid #dc2626' },
        icon: '❌'
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setDeleteTarget(null);
      setSaving(false);
    }
  };

  const handleDeleteSession = async () => {
    if (!deleteTarget || deleteTarget.type !== 'session') return;
    const sessionId = deleteTarget.item.id;
    
    try {
      setSaving(true);
      const response = await fetch(`/api/admin/teori-sessions/${sessionId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        const data = await response.json();
        toast.success(data.message, {
          style: { background: '#10b981', color: '#fff', border: '1px solid #059669' },
          icon: '✅'
        });
        loadData();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Kunde inte radera session', {
          style: { background: '#ef4444', color: '#fff', border: '1px solid #dc2626' },
          icon: '❌'
        });
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      toast.error('Kunde inte radera session', {
        style: { background: '#ef4444', color: '#fff', border: '1px solid #dc2626' },
        icon: '❌'
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setDeleteTarget(null);
      setSaving(false);
    }
  };

  const handleDeleteParticipant = async () => {
    if (!deleteTarget || (deleteTarget.type as string) !== 'participant') return;
    const participantId = deleteTarget.item.id;
    const sessionId = deleteTarget.item.sessionId;
    
    try {
      setSaving(true);
      const response = await fetch(`/api/admin/teori-sessions/${sessionId}/participants/${participantId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        const data = await response.json();
        toast.success(data.message || 'Deltagare borttagen', {
          style: { background: '#10b981', color: '#fff', border: '1px solid #059669' },
          icon: '✅'
        });
        loadData();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Kunde inte ta bort deltagare', {
          style: { background: '#ef4444', color: '#fff', border: '1px solid #dc2626' },
          icon: '❌'
        });
      }
    } catch (error) {
      console.error('Error deleting participant:', error);
      toast.error('Kunde inte ta bort deltagare', {
        style: { background: '#ef4444', color: '#fff', border: '1px solid #dc2626' },
        icon: '❌'
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setDeleteTarget(null);
      setSaving(false);
    }
  };

  // Handle session operations
  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch('/api/admin/teori-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonTypeId: sessionFormData.lessonTypeId,
          title: sessionFormData.title,
          description: sessionFormData.description,
          date: sessionFormData.date,
          startTime: sessionFormData.startTime,
          endTime: sessionFormData.endTime,
          price: sessionFormData.price,
          pricePerSupervisor: sessionFormData.pricePerSupervisor,
          durationMinutes: parseInt(sessionFormData.durationMinutes),
          maxParticipants: parseInt(sessionFormData.maxParticipants),
          isActive: sessionFormData.isActive
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message, {
          style: { background: '#10b981', color: '#fff', border: '1px solid #059669' },
          icon: '✅'
        });
        setIsCreateSessionOpen(false);
        resetSessionForm();
        loadData();
        setHasUnsavedChanges(false);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Ett fel uppstod', {
          style: { background: '#ef4444', color: '#fff', border: '1px solid #dc2626' },
          icon: '❌'
        });
      }
    } catch (error) {
      console.error('Error creating session:', error);
      toast.error('Kunde inte skapa session', {
        style: { background: '#ef4444', color: '#fff', border: '1px solid #dc2626' },
        icon: '❌'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEditSession = (session: Session) => {
    setEditingSession(session);
    setSessionFormData({
      lessonTypeId: session.lessonTypeId,
      title: session.title,
      description: session.description || '',
      date: session.date,
      startTime: session.startTime,
      endTime: session.endTime,
      price: session.price,
      pricePerSupervisor: session.pricePerSupervisor || '',
      durationMinutes: session.durationMinutes.toString(),
      maxParticipants: session.maxParticipants.toString(),
      isActive: session.isActive
    });
    setIsEditSessionOpen(true);
  };

  const handleUpdateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSession) return;

    setSaving(true);

    try {
      const response = await fetch(`/api/admin/teori-sessions/${editingSession.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonTypeId: sessionFormData.lessonTypeId,
          title: sessionFormData.title,
          description: sessionFormData.description,
          date: sessionFormData.date,
          startTime: sessionFormData.startTime,
          endTime: sessionFormData.endTime,
          price: sessionFormData.price,
          pricePerSupervisor: sessionFormData.pricePerSupervisor,
          durationMinutes: parseInt(sessionFormData.durationMinutes),
          maxParticipants: parseInt(sessionFormData.maxParticipants),
          isActive: sessionFormData.isActive
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message, {
          style: { background: '#10b981', color: '#fff', border: '1px solid #059669' },
          icon: '✅'
        });
        setIsEditSessionOpen(false);
        resetSessionForm();
        loadData();
        setHasUnsavedChanges(false);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Ett fel uppstod', {
          style: { background: '#ef4444', color: '#fff', border: '1px solid #dc2626' },
          icon: '❌'
        });
      }
    } catch (error) {
      console.error('Error updating session:', error);
      toast.error('Kunde inte uppdatera session', {
        style: { background: '#ef4444', color: '#fff', border: '1px solid #dc2626' },
        icon: '❌'
      });
    } finally {
      setSaving(false);
    }
  };

  // Handle add participant
  const handleAddParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!participantTargetSessionId) return;
    
    setSaving(true);
    
    try {
      const response = await fetch(`/api/admin/teori-sessions/${participantTargetSessionId}/participants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: participantFormData.studentId || null,
          supervisorName: participantFormData.supervisorName,
          supervisorEmail: participantFormData.supervisorEmail || null,
          supervisorPhone: participantFormData.supervisorPhone || null,
          personalId: participantFormData.personalId || null,
          sendPaymentEmail: participantFormData.sendPaymentEmail
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message, {
          style: { background: '#10b981', color: '#fff', border: '1px solid #059669' },
          icon: '✅'
        });
        setIsAddParticipantOpen(false);
        resetParticipantForm();
        loadData();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Kunde inte lägga till deltagare', {
          style: { background: '#ef4444', color: '#fff', border: '1px solid #dc2626' },
          icon: '❌'
        });
      }
    } catch (error) {
      console.error('Error adding participant:', error);
      toast.error('Kunde inte lägga till deltagare', {
        style: { background: '#ef4444', color: '#fff', border: '1px solid #dc2626' },
        icon: '❌'
      });
    } finally {
      setSaving(false);
    }
  };

  // Filter the lesson types
  const activeTypes = structuredData.filter(type => 
    type.sessions.some(session => session.isActive)
  );

  const inactiveTypes = structuredData.filter(type => 
    !type.sessions.some(session => session.isActive)
  );

  return (
    <div className="container mx-auto pb-12">
      {/* System Announcement Banner */}
      <Banner className="mb-6">
        <div className="flex w-full justify-between items-center">
          <div className="flex items-center">
            <InfoIcon className="h-5 w-5 mr-2 text-blue-600" />
            <p className="font-medium text-sm text-gray-900">
              Teorilektionshanteringen har uppdaterats med ny design och förbättrad funktionalitet.
            </p>
          </div>
          <a href="#" className="text-sm font-medium text-blue-600 hover:underline ml-4">
            Läs mer
          </a>
        </div>
      </Banner>
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BookOpen className="w-7 h-7 text-blue-600" />
          Teorihantering
        </h1>
        <Button
          onClick={() => setIsCreateTypeOpen(true)}
          color="success"
          theme={{ base: "rounded-lg focus:ring-4" }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Ny Teorilektionstyp
        </Button>
      </div>

      <div className="mb-8">
        <div className="bg-gray-100 border border-gray-200 shadow-sm rounded-lg overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h5 className="text-lg font-bold text-gray-900">
              Aktiva Lektionstyper ({activeTypes.length})
            </h5>
            <p className="text-sm text-gray-600">
              Visar alla aktiva teorilektionstyper
            </p>
          </div>
          
          {/* Active Lesson Types */}
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeTypes.length === 0 ? (
              <div className="col-span-full p-6 text-center">
                <Info className="mx-auto mb-2 h-10 w-10 text-gray-400" />
                <p className="text-gray-500">Inga aktiva teorilektionstyper hittades.</p>
              </div>
            ) : (
              activeTypes.map((type) => (
                <Card key={type.id} className="bg-white shadow-md hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between">
                    <h5 className="text-lg font-bold text-gray-900">
                      {type.name}
                    </h5>
                    <Badge color="success" className="ml-2">
                      {type.sessions.length} sessioner
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-700 mt-2">
                    {type.description || 'Ingen beskrivning tillgänglig'}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {type.allowsSupervisors && (
                      <Badge color="info">Tillåter handledare</Badge>
                    )}
                  </div>
                  <div className="mt-4 flex gap-2 justify-end">
                    <Button
                      size="xs"
                      color="light"
                      theme={{ base: "rounded-lg focus:ring-4" }}
                      onClick={() => {
                        setEditingType(type);
                        handleEditType(type);
                      }}
                    >
                      <Edit3 className="w-3 h-3 mr-1" />
                      Redigera
                    </Button>
                    <Button
                      size="xs"
                      color="blue"
                      theme={{ base: "rounded-lg focus:ring-4" }}
                      onClick={() => {
                        setSessionFormData(prev => ({ ...prev, lessonTypeId: type.id }));
                        setIsCreateSessionOpen(true);
                      }}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Session
                    </Button>
                    <Button
                      size="xs"
                      color="red"
                      theme={{ base: "rounded-lg focus:ring-4" }}
                      onClick={() => {
                        setDeleteTarget({ type: 'type', item: type });
                        setIsDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Ta bort
                    </Button>
                  </div>
                  
                  {/* Sessions */}
                  {type.sessions.length > 0 && (
                    <div className="mt-4 border-t border-gray-200 pt-4">
                      <h6 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        Kommande sessioner
                      </h6>
                      <div className="space-y-3">
                        {type.sessions
                          .filter(session => session.isActive)
                          .slice(0, 3)
                          .map((session) => (
                            <div key={session.id} className="bg-gray-50 rounded-md p-3">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h6 className="font-medium text-gray-900">{session.title}</h6>
                                  <div className="text-xs text-gray-500 mt-1 flex items-center">
                                    <Calendar className="w-3 h-3 mr-1" />
                                    {session.date} • {session.startTime}-{session.endTime}
                                  </div>
                                </div>
                                <Badge color={session.currentParticipants >= session.maxParticipants ? "danger" : "success"}>
                                  {session.currentParticipants}/{session.maxParticipants}
                                </Badge>
                              </div>
                              <div className="mt-2 flex gap-2 justify-end">
                                <Tooltip content="Redigera session">
                                  <Button
                                    size="xs"
                                    color="light"
                                    theme={{ base: "rounded-lg focus:ring-4" }}
                                    onClick={() => handleEditSession(session)}
                                  >
                                    <Edit3 className="w-3 h-3" />
                                  </Button>
                                </Tooltip>
                                <Tooltip content="Lägg till deltagare">
                                  <Button
                                    size="xs"
                                    color="light"
                                    theme={{ base: "rounded-lg focus:ring-4" }}
                                    onClick={() => {
                                      setParticipantTargetSessionId(session.id);
                                      setIsAddParticipantOpen(true);
                                    }}
                                  >
                                    <UserPlus className="w-3 h-3" />
                                  </Button>
                                </Tooltip>
                                <Tooltip content="Ta bort session">
                                  <Button
                                    size="xs"
                                    color="red"
                                    theme={{ base: "rounded-lg focus:ring-4" }}
                                    onClick={() => {
                                      setDeleteTarget({ type: 'session', item: session });
                                      setIsDeleteDialogOpen(true);
                                    }}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </Tooltip>
                              </div>
                            </div>
                          ))
                        }
                        {type.sessions.filter(session => session.isActive).length > 3 && (
                          <div className="text-center">
                            <Button size="xs" color="light" theme={{ base: "rounded-lg focus:ring-4" }}>
                              Visa alla ({type.sessions.filter(session => session.isActive).length})
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </Card>
              ))
            )}
          </div>
          
        </div>
      </div>

      {/* Inactive Lesson Types Section */}
      <div className="mb-8">
        <div className="bg-gray-100 border border-gray-200 shadow-sm rounded-lg overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h5 className="text-lg font-bold text-gray-900">
              Inaktiva Lektionstyper ({inactiveTypes.length})
            </h5>
            <p className="text-sm text-gray-600">
              Lektionstyper som är inaktiva och inte visas för elever
            </p>
          </div>
          
          {/* Inactive Lesson Types */}
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {inactiveTypes.length === 0 ? (
              <div className="col-span-full p-6 text-center">
                <Info className="mx-auto mb-2 h-10 w-10 text-gray-400" />
                <p className="text-gray-500">Inga inaktiva teorilektionstyper hittades.</p>
              </div>
            ) : (
              inactiveTypes.map((type) => (
                <Card key={type.id} className="bg-white shadow-md hover:shadow-lg transition-shadow opacity-75">
                  <div className="flex items-start justify-between">
                    <h5 className="text-lg font-bold text-gray-700">
                      {type.name}
                    </h5>
                    <Badge color="gray" className="ml-2">
                      {type.sessions.length} sessioner
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-700 mt-2">
                    {type.description || 'Ingen beskrivning tillgänglig'}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {type.allowsSupervisors && (
                      <Badge color="info">Tillåter handledare</Badge>
                    )}
                    <Badge color="gray">Inaktiv</Badge>
                  </div>
                  <div className="mt-4 flex gap-2 justify-end">
                    <Button
                      size="xs"
                      color="light"
                      theme={{ base: "rounded-lg focus:ring-4" }}
                      onClick={() => {
                        setEditingType(type);
                        handleEditType(type);
                      }}
                    >
                      <Edit3 className="w-3 h-3 mr-1" />
                      Redigera
                    </Button>
                    <Button
                      size="xs"
                      color="blue"
                      theme={{ base: "rounded-lg focus:ring-4" }}
                      onClick={() => {
                        setSessionFormData(prev => ({ ...prev, lessonTypeId: type.id }));
                        setIsCreateSessionOpen(true);
                      }}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Session
                    </Button>
                    <Button
                      size="xs"
                      color="red"
                      theme={{ base: "rounded-lg focus:ring-4" }}
                      onClick={() => {
                        setDeleteTarget({ type: 'type', item: type });
                        setIsDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Ta bort
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
      
      {/* Edit Type Dialog */}
      <Modal show={isEditTypeOpen} onClose={() => !saving && setIsEditTypeOpen(false)} size="lg" theme={{root: {base: "fixed top-0 right-0 left-0 z-50 h-modal h-screen overflow-y-auto overflow-x-hidden md:inset-0 md:h-full bg-gray-900/50 flex justify-center items-center"}}}>
            <div className="relative p-0 w-full max-h-full h-full md:h-auto">
              <div className="relative bg-white text-gray-800 rounded-lg shadow-md max-h-full overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <Edit className="w-5 h-5 text-blue-600" />
                    Redigera Teorilektionstyp
                  </h3>
                </div>
                <div className="p-6 space-y-6 overflow-y-auto">
                  <form ref={editTypeFormRef} onSubmit={handleUpdateType} className="space-y-6">
                    <div>
                      <Label htmlFor="edit-name" className="block mb-2 text-sm font-medium text-gray-700">
                        Namn *
                      </Label>
                      <Input
                        id="edit-name"
                        value={typeFormData.name}
                        onChange={(e) => updateTypeForm('name', e.target.value)}
                        placeholder="t.ex. Riskettan Teori"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-sortOrder" className="block mb-2 text-sm font-medium text-gray-700">
                        Sorteringsordning
                      </Label>
                      <Input
                        id="edit-sortOrder"
                        type="number"
                        value={typeFormData.sortOrder}
                        onChange={(e) => updateTypeForm('sortOrder', e.target.value)}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-description" className="block mb-2 text-sm font-medium text-gray-700">
                        Beskrivning
                      </Label>
                      <Textarea
                        id="edit-description"
                        value={typeFormData.description}
                        onChange={(e) => updateTypeForm('description', e.target.value)}
                        placeholder="Beskrivning av denna teorilektionstyp..."
                        rows={3}
                      />
                    </div>
                    <div className="flex items-center space-x-3 p-4 rounded-lg bg-gray-50 border border-gray-200">
                      <Switch
                        id="edit-allowsSupervisors"
                        checked={typeFormData.allowsSupervisors}
                        onCheckedChange={(checked) => updateTypeForm('allowsSupervisors', checked)}
                      />
                      <div>
                        <Label htmlFor="edit-allowsSupervisors" className="relative inline-flex items-center cursor-pointer text-sm font-medium text-gray-700">
                          Tillåt handledare/supervisorer
                        </Label>
                        <p className="text-xs text-gray-500 mt-1">
                          Aktivera för att tillåta supervisors att delta i lektionen
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                      <Button
                        type="button"
                        color="gray"
                        onClick={() => {
                          setIsEditTypeOpen(false);
                          resetTypeForm();
                        }}
                      >
                        Avbryt
                      </Button>
                      <Button
                        type="submit"
                        disabled={saving}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {saving ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Sparar...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Uppdatera
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </Modal>

      {/* Create Session Dialog */}
      <Modal show={isCreateSessionOpen} onClose={() => !saving && setIsCreateSessionOpen(false)} size="lg" theme={{root: {base: "fixed top-0 right-0 left-0 z-50 h-modal h-screen overflow-y-auto overflow-x-hidden md:inset-0 md:h-full bg-gray-900/50 flex justify-center items-center"}}}>
        <div className="relative p-0 w-full max-h-full h-full md:h-auto">
          <div className="relative bg-white text-gray-800 rounded-lg shadow-md max-h-full overflow-hidden">
            <div className="p-4 border-b border-gray-700">
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-green-600" />
                Skapa Teorisession
              </h3>
            </div>
            <div className="p-6 space-y-6 overflow-y-auto">
              <form ref={createSessionFormRef} onSubmit={handleCreateSession} className="space-y-6">
                <div>
                  <Label htmlFor="create-lessonTypeId" className="block mb-2 text-sm font-medium text-gray-700">
                    Teorilektionstyp *
                  </Label>
                  <Select
                    value={sessionFormData.lessonTypeId}
                    onValueChange={(value) => updateSessionForm('lessonTypeId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Välj teorilektionstyp" />
                    </SelectTrigger>
                    <SelectContent>
                      {structuredData.map((type: LessonType) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="create-title" className="block mb-2 text-sm font-medium text-gray-700">
                    Titel *
                  </Label>
                  <Input
                    id="create-title"
                    value={sessionFormData.title}
                    onChange={(e) => updateSessionForm('title', e.target.value)}
                    placeholder="t.ex. Riskettan Teori - Dag 1"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="create-description" className="block mb-2 text-sm font-medium text-gray-700">
                    Beskrivning
                  </Label>
                  <Textarea
                    id="create-description"
                    value={sessionFormData.description}
                    onChange={(e) => updateSessionForm('description', e.target.value)}
                    placeholder="Beskrivning av denna session..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="create-date" className="block mb-2 text-sm font-medium text-gray-700">
                      Datum *
                    </Label>
                    <Input
                      id="create-date"
                      type="date"
                      value={sessionFormData.date}
                      onChange={(e) => updateSessionForm('date', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="create-startTime" className="block mb-2 text-sm font-medium text-gray-700">
                      Starttid *
                    </Label>
                    <Input
                      id="create-startTime"
                      type="time"
                      value={sessionFormData.startTime}
                      onChange={(e) => updateSessionForm('startTime', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="create-endTime" className="block mb-2 text-sm font-medium text-gray-700">
                      Sluttid *
                    </Label>
                    <Input
                      id="create-endTime"
                      type="time"
                      value={sessionFormData.endTime}
                      onChange={(e) => updateSessionForm('endTime', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="create-price" className="block mb-2 text-sm font-medium text-gray-700">
                      Pris (SEK)
                    </Label>
                    <Input
                      id="create-price"
                      type="number"
                      step="0.01"
                      value={sessionFormData.price}
                      onChange={(e) => updateSessionForm('price', e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="create-maxParticipants" className="block mb-2 text-sm font-medium text-gray-700">
                      Max Deltagare
                    </Label>
                    <Input
                      id="create-maxParticipants"
                      type="number"
                      value={sessionFormData.maxParticipants}
                      onChange={(e) => updateSessionForm('maxParticipants', e.target.value)}
                      placeholder="20"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-4 rounded-lg bg-gray-50 border border-gray-200">
                  <Switch
                    id="create-isActive"
                    checked={sessionFormData.isActive}
                    onCheckedChange={(checked) => updateSessionForm('isActive', checked)}
                  />
                  <div>
                    <Label htmlFor="create-isActive" className="text-sm font-medium text-gray-700 cursor-pointer">
                      Aktiv
                    </Label>
                    <p className="text-xs text-gray-500 mt-1">
                      Aktivera för att göra sessionen tillgänglig för bokning
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <Button
                    type="button"
                    color="gray"
                    onClick={() => {
                      setIsCreateSessionOpen(false);
                      resetSessionForm();
                    }}
                  >
                    Avbryt
                  </Button>
                  <Button
                    type="submit"
                    disabled={saving}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Skapar...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Skapa Session
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </Modal>

      {/* Edit Session Dialog */}
      <Modal show={isEditSessionOpen} onClose={() => !saving && setIsEditSessionOpen(false)} size="lg" theme={{root: {base: "fixed top-0 right-0 left-0 z-50 h-modal h-screen overflow-y-auto overflow-x-hidden md:inset-0 md:h-full bg-gray-900/50 flex justify-center items-center"}}}>
        <div className="relative p-0 w-full max-h-full h-full md:h-auto">
          <div className="relative bg-white text-gray-800 rounded-lg shadow-md max-h-full overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-green-600" />
                Redigera Teorisession
              </h3>
            </div>
            <div className="p-6 space-y-6 overflow-y-auto">
              <form ref={editSessionFormRef} onSubmit={handleUpdateSession} className="space-y-6">
                <div>
                  <Label htmlFor="edit-lessonTypeId" className="block mb-2 text-sm font-medium text-gray-700">
                    Teorilektionstyp *
                  </Label>
                  <Select
                    value={sessionFormData.lessonTypeId}
                    onValueChange={(value) => updateSessionForm('lessonTypeId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Välj teorilektionstyp" />
                    </SelectTrigger>
                    <SelectContent>
                      {structuredData.map((type: LessonType) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="edit-title" className="block mb-2 text-sm font-medium text-gray-700">
                    Titel *
                  </Label>
                  <Input
                    id="edit-title"
                    value={sessionFormData.title}
                    onChange={(e) => updateSessionForm('title', e.target.value)}
                    placeholder="t.ex. Riskettan Teori - Dag 1"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="edit-description" className="block mb-2 text-sm font-medium text-gray-700">
                    Beskrivning
                  </Label>
                  <Textarea
                    id="edit-description"
                    value={sessionFormData.description}
                    onChange={(e) => updateSessionForm('description', e.target.value)}
                    placeholder="Beskrivning av denna session..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="edit-date" className="block mb-2 text-sm font-medium text-gray-700">
                      Datum *
                    </Label>
                    <Input
                      id="edit-date"
                      type="date"
                      value={sessionFormData.date}
                      onChange={(e) => updateSessionForm('date', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-startTime" className="block mb-2 text-sm font-medium text-gray-700">
                      Starttid *
                    </Label>
                    <Input
                      id="edit-startTime"
                      type="time"
                      value={sessionFormData.startTime}
                      onChange={(e) => updateSessionForm('startTime', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-endTime" className="block mb-2 text-sm font-medium text-gray-700">
                      Sluttid *
                    </Label>
                    <Input
                      id="edit-endTime"
                      type="time"
                      value={sessionFormData.endTime}
                      onChange={(e) => updateSessionForm('endTime', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-price" className="block mb-2 text-sm font-medium text-gray-700">
                      Pris (SEK)
                    </Label>
                    <Input
                      id="edit-price"
                      type="number"
                      step="0.01"
                      value={sessionFormData.price}
                      onChange={(e) => updateSessionForm('price', e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-maxParticipants" className="block mb-2 text-sm font-medium text-gray-700">
                      Max Deltagare
                    </Label>
                    <Input
                      id="edit-maxParticipants"
                      type="number"
                      value={sessionFormData.maxParticipants}
                      onChange={(e) => updateSessionForm('maxParticipants', e.target.value)}
                      placeholder="20"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-4 rounded-lg bg-gray-50 border border-gray-200">
                  <Switch
                    id="edit-isActive"
                    checked={sessionFormData.isActive}
                    onCheckedChange={(checked) => updateSessionForm('isActive', checked)}
                  />
                  <div>
                    <Label htmlFor="edit-isActive" className="text-sm font-medium text-gray-900 cursor-pointer">
                      Aktiv
                    </Label>
                    <p className="text-xs text-gray-500 mt-1">
                      Aktivera för att göra sessionen tillgänglig för bokning
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <Button
                    type="button"
                    color="gray"
                    onClick={() => {
                      setIsEditSessionOpen(false);
                      resetSessionForm();
                    }}
                  >
                    Avbryt
                  </Button>
                  <Button
                    type="submit"
                    disabled={saving}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sparar...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Uppdatera
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </Modal>

      {/* Create Lesson Type Dialog */}
      <Modal show={isCreateTypeOpen} onClose={() => !saving && setIsCreateTypeOpen(false)} size="lg" theme={{root: {base: "fixed top-0 right-0 left-0 z-50 h-modal h-screen overflow-y-auto overflow-x-hidden md:inset-0 md:h-full bg-gray-900/50 flex justify-center items-center"}}}>
        <div className="relative p-0 w-full max-h-full h-full md:h-auto">
          <div className="relative bg-white text-gray-800 rounded-lg shadow-md max-h-full overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Plus className="w-5 h-5 text-green-600" />
                Skapa Teorilektionstyp
              </h3>
            </div>
            <div className="p-6 space-y-6 overflow-y-auto">
              <form ref={createTypeFormRef} onSubmit={handleCreateType} className="space-y-6">
                <div>
                  <Label htmlFor="create-type-name" className="block mb-2 text-sm font-medium text-gray-700">
                    Namn *
                  </Label>
                  <Input
                    id="create-type-name"
                    value={typeFormData.name}
                    onChange={(e) => updateTypeForm('name', e.target.value)}
                    placeholder="t.ex. Handledarutbildning"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="create-type-description" className="block mb-2 text-sm font-medium text-gray-700">
                    Beskrivning
                  </Label>
                  <Textarea
                    id="create-type-description"
                    value={typeFormData.description}
                    onChange={(e) => updateTypeForm('description', e.target.value)}
                    placeholder="Beskrivning av denna teorilektionstyp..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="create-type-sortOrder" className="block mb-2 text-sm font-medium text-gray-700">
                    Sorteringsordning
                  </Label>
                  <Input
                    id="create-type-sortOrder"
                    type="number"
                    value={typeFormData.sortOrder}
                    onChange={(e) => updateTypeForm('sortOrder', e.target.value)}
                    placeholder="0"
                  />
                </div>

                <div className="flex items-center space-x-3 p-4 rounded-lg bg-gray-50 border border-gray-200">
                  <Switch
                    id="create-type-allowsSupervisors"
                    checked={typeFormData.allowsSupervisors}
                    onCheckedChange={(checked) => updateTypeForm('allowsSupervisors', checked)}
                  />
                  <div>
                    <Label htmlFor="create-type-allowsSupervisors" className="text-sm font-medium text-gray-700 cursor-pointer">
                      Tillåt handledare/supervisorer
                    </Label>
                    <p className="text-xs text-gray-500 mt-1">
                      Aktivera för att tillåta supervisors att delta i lektionen
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <Button
                    type="button"
                    color="gray"
                    onClick={() => {
                      setIsCreateTypeOpen(false);
                      resetTypeForm();
                    }}
                  >
                    Avbryt
                  </Button>
                  <Button
                    type="submit"
                    disabled={saving}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Skapar...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Skapa Teorilektionstyp
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </Modal>

      {/* Add Participant Dialog */}
      <Modal show={isAddParticipantOpen} onClose={() => !saving && setIsAddParticipantOpen(false)} size="xl" theme={{root: {base: "fixed top-0 right-0 left-0 z-50 h-modal h-screen overflow-y-auto overflow-x-hidden md:inset-0 md:h-full bg-gray-900/50 flex justify-center items-center"}}}>
        <div className="relative p-0 w-full max-h-full h-full md:h-auto">
          <div className="relative bg-white text-gray-800 rounded-lg shadow-md max-h-full overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Lägg till deltagare
              </h3>
            </div>
            <div className="p-6 space-y-6 overflow-y-auto">
              <form ref={addParticipantFormRef} onSubmit={handleAddParticipant} className="space-y-6">
                <div>
                  <Label htmlFor="add-student" className="block mb-2 text-sm font-medium text-gray-700">
                    Elev (valfritt)
                  </Label>
                  <Select
                    value={participantFormData.studentId}
                    onValueChange={(value) => updateParticipantForm('studentId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Välj elev (valfritt)" />
                    </SelectTrigger>
                    <SelectContent>
                      {safeStudents.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name} {s.email ? `- ${s.email}` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="supervisorName" className="block mb-2 text-sm font-medium text-gray-700">
                      Handledarens namn *
                    </Label>
                    <Input
                      id="supervisorName"
                      value={participantFormData.supervisorName}
                      onChange={(e) => updateParticipantForm('supervisorName', e.target.value)}
                      placeholder="Ange handledarens namn"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="personalId" className="block mb-2 text-sm font-medium text-gray-700">
                      Personnummer (valfritt)
                    </Label>
                    <Input
                      id="personalId"
                      value={participantFormData.personalId}
                      onChange={(e) => updateParticipantForm('personalId', e.target.value)}
                      placeholder="ÅÅÅÅMMDD-XXXX"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="supervisorEmail" className="block mb-2 text-sm font-medium text-gray-700">
                      E-post (valfritt)
                    </Label>
                    <Input
                      id="supervisorEmail"
                      type="email"
                      value={participantFormData.supervisorEmail}
                      onChange={(e) => updateParticipantForm('supervisorEmail', e.target.value)}
                      placeholder="exempel@email.se"
                    />
                  </div>
                  <div>
                    <Label htmlFor="supervisorPhone" className="block mb-2 text-sm font-medium text-gray-700">
                      Telefon (valfritt)
                    </Label>
                    <Input
                      id="supervisorPhone"
                      value={participantFormData.supervisorPhone}
                      onChange={(e) => updateParticipantForm('supervisorPhone', e.target.value)}
                      placeholder="07XXXXXXXX"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <Button 
                    type="button" 
                    color="gray" 
                    onClick={() => {
                      setIsAddParticipantOpen(false);
                      resetParticipantForm();
                    }}
                  >
                    Avbryt
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={saving}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sparar...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Lägg till
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        show={isDeleteDialogOpen}
        size="md"
        onClose={() => setDeleteTarget(null)}
        theme={{root: {base: "fixed top-0 right-0 left-0 z-50 h-modal h-screen overflow-y-auto overflow-x-hidden md:inset-0 md:h-full bg-gray-900/50 flex justify-center items-center"}}}
      >
        <div className="relative p-0 w-full max-h-full h-full md:h-auto">
          <div className="relative bg-white text-gray-800 rounded-lg shadow-md max-h-full overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Bekräfta borttagning
              </h3>
              <button
                type="button"
                className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center"
                onClick={() => setDeleteTarget(null)}
              >
                <X className="w-5 h-5" />
                <span className="sr-only">Stäng modal</span>
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-gray-700">
                {deleteTarget?.type === 'type' && 'Är du säker på att du vill ta bort denna teorilektionstyp? Alla tillhörande sessioner kommer också att tas bort.'}
                {deleteTarget?.type === 'session' && 'Är du säker på att du vill ta bort denna teorisession? Detta kommer inte att påverka lektionstypen.'}
                {deleteTarget && (deleteTarget.type as string) === 'participant' && 'Är du säker på att du vill ta bort denna deltagare från sessionen?'}
              </p>
            </div>
            
            <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200">
              <Button
                color="gray"
                onClick={() => setDeleteTarget(null)}
              >
                Avbryt
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={() => {
                  if (deleteTarget?.type === 'type') handleDeleteType();
                  else if (deleteTarget?.type === 'session') handleDeleteSession();
                  else if (deleteTarget?.type === 'participant') handleDeleteParticipant();
                }}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Tar bort...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Ta bort
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
