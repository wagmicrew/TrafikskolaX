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
  DollarSign,
  Calendar,
  X,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Banner } from 'flowbite-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
      // Reload the page to get fresh structured data
      window.location.reload();
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

    try {
      const response = await fetch(`/api/admin/teori-lesson-types/${deleteTarget.item.id}`, {
        method: 'DELETE'
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
    }
  };

  // Open Add Participant dialog helper
  const openAddParticipantDialog = (sessionId: string) => {
    setParticipantTargetSessionId(sessionId);
    setParticipantFormData({
      studentId: '',
      supervisorName: '',
      supervisorEmail: '',
      supervisorPhone: '',
      personalId: '',
      sendPaymentEmail: false,
    });
    setIsAddParticipantOpen(true);
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
          price: parseFloat(sessionFormData.price),
          pricePerSupervisor: sessionFormData.pricePerSupervisor ? parseFloat(sessionFormData.pricePerSupervisor) : null,
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
          price: parseFloat(sessionFormData.price),
          pricePerSupervisor: sessionFormData.pricePerSupervisor ? parseFloat(sessionFormData.pricePerSupervisor) : null,
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

  const handleDeleteSession = async () => {
    if (!deleteTarget || deleteTarget.type !== 'session') return;

    try {
      const response = await fetch(`/api/admin/teori-sessions/${deleteTarget.item.id}`, {
        method: 'DELETE'
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
    }
  };

  const handleAddParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!participantTargetSessionId) return;

    try {
      const response = await fetch(`/api/admin/teori-sessions/${participantTargetSessionId}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: participantFormData.studentId,
          supervisorName: participantFormData.supervisorName,
          supervisorEmail: participantFormData.supervisorEmail,
          supervisorPhone: participantFormData.supervisorPhone,
          personalId: participantFormData.personalId,
          sendPaymentEmail: participantFormData.sendPaymentEmail,
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
        toast.error(error.error || 'Ett fel uppstod', {
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
    }
  };

  const handleRemoveParticipant = async (bookingId: string) => {
    try {
      const response = await fetch(`/api/admin/teori-bookings/${bookingId}`, {
        method: 'DELETE'
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
        toast.error(error.error || 'Kunde inte ta bort deltagare', {
          style: { background: '#ef4444', color: '#fff', border: '1px solid #dc2626' },
          icon: '❌'
        });
      }
    } catch (error) {
      console.error('Error removing participant:', error);
      toast.error('Kunde inte ta bort deltagare', {
        style: { background: '#ef4444', color: '#fff', border: '1px solid #dc2626' },
        icon: '❌'
      });
    }
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="flex space-x-1 mb-6">
              {[1, 2].map((i) => (
                <div key={i} className="h-10 bg-gray-200 rounded w-24"></div>
              ))}
            </div>
            <div className="space-y-6">
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <div className="animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Sticky Save Banner */}
        {hasUnsavedChanges && (
          <div className="fixed top-0 left-0 z-50 w-full">
            <Banner>
              <div className="flex w-full items-center justify-between gap-4 px-4 py-3">
                <div className="flex items-center gap-2 text-amber-800">
                  <span className="inline-flex p-1 bg-amber-200 rounded-full w-6 h-6 items-center justify-center">
                    <AlertTriangle className="w-3 h-3" />
                  </span>
                  <span className="text-sm">Du har osparade ändringar. Vill du spara nu?</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => {
                      // Try to submit whichever dialog form is open
                      if (isCreateTypeOpen && createTypeFormRef.current) return createTypeFormRef.current.requestSubmit();
                      if (isEditTypeOpen && editTypeFormRef.current) return editTypeFormRef.current.requestSubmit();
                      if (isCreateSessionOpen && createSessionFormRef.current) return createSessionFormRef.current.requestSubmit();
                      if (isEditSessionOpen && editSessionFormRef.current) return editSessionFormRef.current.requestSubmit();
                      if (isAddParticipantOpen && addParticipantFormRef.current) return addParticipantFormRef.current.requestSubmit();
                    }}
                  >
                    Spara nu
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setHasUnsavedChanges(false)}
                  >
                    Fortsätt utan att spara
                  </Button>
                </div>
              </div>
            </Banner>
          </div>
        )}

        {/* Main Content */}
        <div className={`space-y-6 ${hasUnsavedChanges ? 'mt-20' : ''}`}>
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Teorihantering</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Hantera teorilektionstyper och sessioner</p>
            </div>
          </div>

          {/* Hierarchical View */}
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Teorihantering</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Hantera grupper, sessioner och deltagare</p>
              </div>
              <Button
                onClick={() => setIsCreateTypeOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Skapa Teorilektionstyp
              </Button>
            </div>

            <div className="space-y-4">
              {!structuredData || structuredData.length === 0 ? (
                <div className="text-center py-12">
                  <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
                  </div>
                  <p className="text-gray-500 mt-4">Laddar teorihantering...</p>
                </div>
              ) : (
                structuredData.map((lessonType) => (
                  <Card key={lessonType.id} className="border border-gray-200 dark:border-gray-700">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${lessonType.allowsSupervisors ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-green-100 dark:bg-green-900/30'}`}>
                            <BookOpen className={`w-5 h-5 ${lessonType.allowsSupervisors ? 'text-blue-600' : 'text-green-600'}`} />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{lessonType.name}</CardTitle>
                            {lessonType.description && (
                              <CardDescription className="mt-1">{lessonType.description}</CardDescription>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditType(lessonType)}
                          >
                            <Edit3 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setDeleteTarget({ type: 'type', item: lessonType });
                              setIsDeleteDialogOpen(true);
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Lesson Type Details - Only show basic info */}
                      <div className="flex items-center gap-4 mt-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <span className="text-green-600 font-semibold">kr</span>
                          <span>Pricing set per session</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>Duration set per session</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>Capacity set per session</span>
                        </div>
                        <div className="flex gap-1">
                          <Badge variant="outline">Session-based pricing</Badge>
                          {lessonType.allowsSupervisors && (
                            <Badge variant="outline">Med handledare</Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-0">
                      {/* Sessions for this lesson type */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-900 dark:text-white">Sessioner</h4>
                          <Button
                            size="sm"
                            onClick={() => {
                              setSessionFormData(prev => ({ ...prev, lessonTypeId: lessonType.id }));
                              setIsCreateSessionOpen(true);
                            }}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Skapa Session
                          </Button>
                        </div>

                        {!lessonType.sessions || lessonType.sessions.length === 0 ? (
                          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p>Inga sessioner för denna typ än</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {lessonType.sessions.map((session) => (
                              <div key={session.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-3 bg-gray-50 dark:bg-gray-800/50">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <Calendar className="w-4 h-4 text-blue-600" />
                                      <h5 className="font-medium text-gray-900 dark:text-white">{session.title}</h5>
                                    </div>
                                    {session.description && (
                                      <p className="text-sm text-gray-600 dark:text-gray-400 ml-6">{session.description}</p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1 ml-4">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleEditSession(session)}
                                    >
                                      <Edit3 className="w-3 h-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => {
                                        setDeleteTarget({ type: 'session', item: session });
                                        setIsDeleteDialogOpen(true);
                                      }}
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>

                                {/* Session Details */}
                                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 ml-6 mb-3">
                                  <span>{new Date(session.date).toLocaleDateString('sv-SE')}</span>
                                  <span>{session.startTime} - {session.endTime}</span>
                                  <span>{(session.bookings || []).length}/{session.maxParticipants} deltagare</span>
                                  <Badge variant={session.isActive ? "default" : "secondary"} className="text-xs">
                                    {session.isActive ? 'Aktiv' : 'Inaktiv'}
                                  </Badge>
                                </div>

                                {/* Bookings for this session */}
                                <div className="ml-6">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Deltagare</span>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setParticipantTargetSessionId(session.id);
                                        setIsAddParticipantOpen(true);
                                      }}
                                    >
                                      <Plus className="w-3 h-3 mr-1" />
                                      Lägg till deltagare
                                    </Button>
                                  </div>

                                  {!session.bookings || session.bookings.length === 0 ? (
                                    <p className="text-sm text-gray-500 dark:text-gray-400 italic">Inga deltagare än</p>
                                  ) : (
                                    <div className="space-y-2">
                                      {session.bookings.map((booking) => (
                                        <div key={booking.id} className="flex items-center justify-between p-2 bg-white dark:bg-gray-700 rounded border">
                                          <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                              <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                              <span className="font-medium text-sm">
                                                {booking.studentFirstName && booking.studentLastName
                                                  ? `${booking.studentFirstName} ${booking.studentLastName}`
                                                  : 'Okänd deltagare'}
                                              </span>
                                            </div>
                                            {booking.studentEmail && (
                                              <p className="text-xs text-gray-600 dark:text-gray-400 ml-4">{booking.studentEmail}</p>
                                            )}
                                          </div>
                                          <div className="flex items-center gap-2 text-xs">
                                            <Badge variant={
                                              booking.paymentStatus === 'paid' ? 'default' :
                                              booking.paymentStatus === 'pending' ? 'secondary' : 'destructive'
                                            }>
                                              {booking.paymentStatus === 'paid' ? 'Betald' :
                                               booking.paymentStatus === 'pending' ? 'Väntar' : 'Obetald'}
                                            </Badge>
                                            <span className="text-gray-600 dark:text-gray-400">{booking.price} SEK</span>
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              className="text-red-600 hover:text-red-700"
                                              onClick={() => handleRemoveParticipant(booking.id)}
                                            >
                                              <Trash2 className="w-3 h-3" />
                                            </Button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create Type Dialog */}
      <Dialog open={isCreateTypeOpen} onOpenChange={setIsCreateTypeOpen}>
        <DialogContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-600" />
              Skapa Teorilektionstyp
            </DialogTitle>
          </DialogHeader>
          <form ref={createTypeFormRef} onSubmit={handleCreateType} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="create-name" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                  Namn *
                </Label>
                <Input
                  id="create-name"
                  value={typeFormData.name}
                  onChange={(e) => updateTypeForm('name', e.target.value)}
                  placeholder="t.ex. Riskettan Teori"
                  required
                />
              </div>
              <div>
                <Label htmlFor="create-sortOrder" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                  Sorteringsordning
                </Label>
                <Input
                  id="create-sortOrder"
                  type="number"
                  value={typeFormData.sortOrder}
                  onChange={(e) => updateTypeForm('sortOrder', e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="create-description" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                Beskrivning
              </Label>
              <Textarea
                id="create-description"
                value={typeFormData.description}
                onChange={(e) => updateTypeForm('description', e.target.value)}
                placeholder="Beskrivning av teorilektionstypen"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="create-allowsSupervisors"
                checked={typeFormData.allowsSupervisors}
                onCheckedChange={(checked) => updateTypeForm('allowsSupervisors', checked)}
              />
              <Label htmlFor="create-allowsSupervisors" className="text-sm font-medium text-gray-900 dark:text-white">
                Tillåt handledare (för bokningsflöde)
              </Label>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                <Users className="w-4 h-4" />
                <span className="text-sm font-medium">Session-baserade inställningar</span>
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                Pris, varaktighet, kapacitet och aktiv status konfigureras per session
              </p>
            </div>

            <DialogFooter className="gap-3">
              <Button
                type="button"
                variant="outline"
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
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Skapar...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Skapa
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Type Dialog */}
      <Dialog open={isEditTypeOpen} onOpenChange={setIsEditTypeOpen}>
        <DialogContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-blue-600" />
              Redigera Teorilektionstyp
            </DialogTitle>
          </DialogHeader>
          <form ref={editTypeFormRef} onSubmit={handleUpdateType} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
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
                <Label htmlFor="edit-sortOrder" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
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
            </div>

            <div>
              <Label htmlFor="edit-description" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
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

            <div className="flex items-center space-x-3 p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600">
              <Switch
                id="edit-allowsSupervisors"
                checked={typeFormData.allowsSupervisors}
                onCheckedChange={(checked) => updateTypeForm('allowsSupervisors', checked)}
              />
              <div>
                <Label htmlFor="edit-allowsSupervisors" className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer">
                  Tillåt handledare/supervisorer
                </Label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Aktivera för att tillåta supervisors att delta i lektionen
                </p>
              </div>
            </div>

            <DialogFooter className="gap-3">
              <Button
                type="button"
                variant="outline"
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
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Session Dialog */}
      <Dialog open={isCreateSessionOpen} onOpenChange={setIsCreateSessionOpen}>
        <DialogContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-green-600" />
              Skapa Teorisession
            </DialogTitle>
          </DialogHeader>
          <form ref={createSessionFormRef} onSubmit={handleCreateSession} className="space-y-6">
            <div>
              <Label htmlFor="create-lessonTypeId" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
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
              <Label htmlFor="create-title" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
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
              <Label htmlFor="create-description" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
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
                <Label htmlFor="create-date" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
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
                <Label htmlFor="create-startTime" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
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
                <Label htmlFor="create-endTime" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
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
                <Label htmlFor="create-price" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
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
                <Label htmlFor="create-maxParticipants" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
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

            <div className="flex items-center space-x-3 p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600">
              <Switch
                id="create-isActive"
                checked={sessionFormData.isActive}
                onCheckedChange={(checked) => updateSessionForm('isActive', checked)}
              />
              <div>
                <Label htmlFor="create-isActive" className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer">
                  Aktiv
                </Label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Aktivera för att göra sessionen tillgänglig för bokning
                </p>
              </div>
            </div>

            <DialogFooter className="gap-3">
              <Button
                type="button"
                variant="outline"
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
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Session Dialog */}
      <Dialog open={isEditSessionOpen} onOpenChange={setIsEditSessionOpen}>
        <DialogContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-green-600" />
              Redigera Teorisession
            </DialogTitle>
          </DialogHeader>
          <form ref={editSessionFormRef} onSubmit={handleUpdateSession} className="space-y-6">
            <div>
              <Label htmlFor="edit-lessonTypeId" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
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
              <Label htmlFor="edit-title" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
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
              <Label htmlFor="edit-description" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
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
                <Label htmlFor="edit-date" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
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
                <Label htmlFor="edit-startTime" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
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
                <Label htmlFor="edit-endTime" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
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
                <Label htmlFor="edit-price" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
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
                <Label htmlFor="edit-maxParticipants" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
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

            <div className="flex items-center space-x-3 p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600">
              <Switch
                id="edit-isActive"
                checked={sessionFormData.isActive}
                onCheckedChange={(checked) => updateSessionForm('isActive', checked)}
              />
              <div>
                <Label htmlFor="edit-isActive" className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer">
                  Aktiv
                </Label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Aktivera för att göra sessionen tillgänglig för bokning
                </p>
                <div>
                  <Label htmlFor="edit-isActive" className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer">
                    Aktiv
                  </Label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Aktivera för att göra sessionen tillgänglig för bokning
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-3">
              <Button
                type="button"
                variant="outline"
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
                className="bg-green-600 hover:bg-green-700 text-white"
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
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Participant Dialog */}
      <Dialog open={isAddParticipantOpen} onOpenChange={setIsAddParticipantOpen}>
        <DialogContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Lägg till deltagare
            </DialogTitle>
          </DialogHeader>
          <form ref={addParticipantFormRef} onSubmit={handleAddParticipant} className="space-y-6">
            <div>
              <Label htmlFor="add-student" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
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
                <Label htmlFor="supervisorName" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
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
                <Label htmlFor="personalId" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
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
                <Label htmlFor="supervisorEmail" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                  Handledarens e-post (valfritt)
                </Label>
                <Input
                  id="supervisorEmail"
                  type="email"
                  value={participantFormData.supervisorEmail}
                  onChange={(e) => updateParticipantForm('supervisorEmail', e.target.value)}
                  placeholder="exempel@domän.se"
                />
              </div>
              <div>
                <Label htmlFor="supervisorPhone" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                  Handledarens telefon (valfritt)
                </Label>
                <Input
                  id="supervisorPhone"
                  value={participantFormData.supervisorPhone}
                  onChange={(e) => updateParticipantForm('supervisorPhone', e.target.value)}
                  placeholder="0701234567"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="sendPaymentEmail"
                checked={participantFormData.sendPaymentEmail}
                onCheckedChange={(checked) => updateParticipantForm('sendPaymentEmail', checked)}
              />
              <Label htmlFor="sendPaymentEmail" className="text-sm font-medium text-gray-900 dark:text-white">
                Skicka betalningslänk via e-post (om e-post är angiven)
              </Label>
            </div>

            <DialogFooter className="gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddParticipantOpen(false);
                  resetParticipantForm();
                }}
              >
                Avbryt
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Lägger till...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Lägg till
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-600" />
              Radera {deleteTarget?.type === 'type' ? 'Teorilektionstyp' : 'Session'}
            </DialogTitle>
          </DialogHeader>
          <div className="p-6">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Är du säker på att du vill radera <strong className="text-gray-900 dark:text-white">
                "{deleteTarget?.item?.name || deleteTarget?.item?.title}"
              </strong>?
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Denna åtgärd kan inte ångras och kommer att ta bort alla relaterade sessioner och bokningar.
            </p>
          </div>
          <DialogFooter className="gap-3">
            <Button
              onClick={() => setIsDeleteDialogOpen(false)}
              variant="outline"
            >
              Avbryt
            </Button>
            <Button
              onClick={deleteTarget?.type === 'type' ? handleDeleteType : handleDeleteSession}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Radera
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
