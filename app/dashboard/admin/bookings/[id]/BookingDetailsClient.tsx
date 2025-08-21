'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { 
  Calendar, 
  Clock, 
  User, 
  Mail, 
  Phone, 
  Car,
  CheckCircle,
  XCircle,
  AlertCircle,
  CreditCard,
  FileText,
  MapPin,
  ArrowLeft,
  Edit,
  Trash2,
  ClipboardList,
  MessageSquare,
  Plus,
  Save,
  Star,
  BookOpen,
  Settings
} from 'lucide-react';
import { format } from 'date-fns';
import MoveBookingModal from './MoveBookingModal';
import DeleteBookingConfirmation from './DeleteBookingConfirmation';
import StatusUpdatePanel from '@/components/Admin/StatusUpdatePanel';

interface BookingDetailsClientProps {
  booking: any;
}

const formatDate = (date: Date | null): string => {
    if (!date) return 'N/A';
    return format(new Date(date), 'yyyy-MM-dd');
  };

const formatDateTime = (date: Date | null): string => {
    if (!date) return 'N/A';
    return format(new Date(date), 'yyyy-MM-dd HH:mm');
  };

const BookingDetailsClient: React.FC<BookingDetailsClientProps> = ({ booking }) => {
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [bookingData, setBookingData] = useState(booking);
  const [bookingSteps, setBookingSteps] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [existingFeedback, setExistingFeedback] = useState<any[]>([]);
  const [selectedSteps, setSelectedSteps] = useState<any[]>([]);
  const [plannedSet, setPlannedSet] = useState<Set<string>>(new Set());
  const [statusByCategory, setStatusByCategory] = useState<Record<string, 'green'|'orange'|'red'|'unknown'>>({});
  const [isPlanDirty, setIsPlanDirty] = useState(false);
  const [isLoadingSteps, setIsLoadingSteps] = useState(false);
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingFeedback, setEditingFeedback] = useState<any>(null);
  const [freetextFeedback, setFreetextFeedback] = useState({
    feedbackText: '',
    valuation: 5
  });

  // Modals for feedback
  const [isGeneralModalOpen, setIsGeneralModalOpen] = useState(false);
  const [generalValuation, setGeneralValuation] = useState<number>(5);
  const [generalText, setGeneralText] = useState<string>('');

  const [isStepModalOpen, setIsStepModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<any>(null);
  const [stepValuation, setStepValuation] = useState<number>(5);
  const [stepText, setStepText] = useState<string>('');

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<string>('');
  const [categoryValuation, setCategoryValuation] = useState<number>(5);
  const [categoryText, setCategoryText] = useState<string>('');

  // Load booking steps and existing feedback
  useEffect(() => {
    if (activeTab === 'planning' || activeTab === 'feedback') {
      loadBookingSteps();
      loadExistingFeedback();
      loadPlan();
      loadEducationSummary();
    }
  }, [activeTab, booking.id]);

  const loadBookingSteps = async () => {
    setIsLoadingSteps(true);
    try {
      const response = await fetch('/api/admin/booking-steps');
      if (response.ok) {
        const data = await response.json();
        const steps = Array.isArray(data?.steps) ? data.steps : Array.isArray(data) ? data : [];
        setBookingSteps(steps);
      }
    } catch (error) {
      console.error('Error loading booking steps:', error);
    }
    setIsLoadingSteps(false);
  };

  const loadExistingFeedback = async () => {
    setIsLoadingFeedback(true);
    try {
      const response = await fetch(`/api/admin/bookings/${booking.id}/feedback`);
      if (response.ok) {
        const data = await response.json();
        setExistingFeedback(data);
        // Precheck planned steps from existing feedback as suggestions (do not set plannedSet here)
      }
    } catch (error) {
      console.error('Error loading feedback:', error);
    }
    setIsLoadingFeedback(false);
  };

  const loadPlan = async () => {
    try {
      const res = await fetch(`/api/admin/bookings/${booking.id}/plan`);
      if (res.ok) {
        const data = await res.json();
        setPlannedSet(new Set<string>(data.planned || []));
        setIsPlanDirty(false);
      }
    } catch (e) {
      console.error('Error loading plan:', e);
    }
  };

  const loadEducationSummary = async () => {
    if (!booking.userId) return;
    try {
      const res = await fetch(`/api/admin/users/${booking.userId}/education-summary`);
      if (res.ok) {
        const data = await res.json();
        setStatusByCategory(data.statusByCategory || {});
      }
    } catch (e) {
      console.error('Error loading education summary:', e);
    }
  };

  const stepIdentifierOf = (s: any) => `${s.category}-${s.subcategory}`;

  const handlePlanToggle = (step: any) => {
    const key = stepIdentifierOf(step);
    setPlannedSet(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      setIsPlanDirty(true);
      return next;
    });
  };

  const updateStepFeedback = (stepId: string, field: string, value: any) => {
    setSelectedSteps(prev => 
      prev.map(step => 
        step.stepId === stepId 
          ? { ...step, [field]: value }
          : step
      )
    );
  };

  const saveFeedback = async () => {
    if (!booking.userId) {
      toast.error('Kan inte spara feedback för gästbokningar');
      return;
    }

    setIsSaving(true);
    const loadingToast = toast.loading('Sparar feedback...');
    
    try {
      const feedbackData = selectedSteps.map(step => ({
        bookingId: booking.id,
        userId: booking.userId,
        stepIdentifier: `${step.stepInfo.category}-${step.stepInfo.subcategory}`,
        feedbackText: step.feedbackText,
        valuation: step.valuation,
        isFromTeacher: true
      }));

      const response = await fetch(`/api/admin/bookings/${booking.id}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ feedback: feedbackData }),
      });

      if (response.ok) {
        toast.success('Feedback sparad framgångsrikt!', {
          id: loadingToast,
        });
        setSelectedSteps([]);
        loadExistingFeedback();
      } else {
        toast.error('Fel vid sparande av feedback', {
          id: loadingToast,
        });
      }
    } catch (error) {
      console.error('Error saving feedback:', error);
      toast.error('Fel vid sparande av feedback', {
        id: loadingToast,
      });
    }
    setIsSaving(false);
  };

  const savePlan = async () => {
    try {
      const planned = Array.from(plannedSet);
      const res = await fetch(`/api/admin/bookings/${booking.id}/plan`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planned }),
      });
      if (res.ok) {
        toast.success('Planering sparad');
        setIsPlanDirty(false);
      } else {
        toast.error('Kunde inte spara planering');
      }
    } catch (e) {
      console.error('Save plan error:', e);
      toast.error('Fel vid sparande');
    }
  };

  const startEditingFeedback = (feedbackItem: any) => {
    setEditingFeedback({
      ...feedbackItem,
      originalValuation: feedbackItem.valuation,
      originalFeedbackText: feedbackItem.feedbackText
    });
  };

  const updateEditingFeedback = (field: string, value: any) => {
    setEditingFeedback((prev: any) => ({
      ...(prev || {}),
      [field]: value
    }));
  };

  const saveEditedFeedback = async () => {
    if (!editingFeedback) return;

    setIsSaving(true);
    const loadingToast = toast.loading('Uppdaterar feedback...');
    
    try {
      const response = await fetch(`/api/admin/bookings/${booking.id}/feedback/${editingFeedback.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          feedbackText: editingFeedback.feedbackText,
          valuation: editingFeedback.valuation
        }),
      });

      if (response.ok) {
        toast.success('Feedback uppdaterad framgångsrikt!', {
          id: loadingToast,
        });
        setEditingFeedback(null);
        loadExistingFeedback();
      } else {
        toast.error('Fel vid uppdatering av feedback', {
          id: loadingToast,
        });
      }
    } catch (error) {
      console.error('Error updating feedback:', error);
      toast.error('Fel vid uppdatering av feedback', {
        id: loadingToast,
      });
    }
    setIsSaving(false);
  };

  const cancelEditingFeedback = () => {
    setEditingFeedback(null);
  };

  const deleteFeedback = async (feedbackId: string) => {
    if (!confirm('Är du säker på att du vill ta bort denna feedback?')) {
      return;
    }

    const loadingToast = toast.loading('Tar bort feedback...');
    
    try {
      const response = await fetch(`/api/admin/bookings/${booking.id}/feedback/${feedbackId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Feedback borttagen framgångsrikt!', {
          id: loadingToast,
        });
        loadExistingFeedback();
      } else {
        toast.error('Fel vid borttagning av feedback', {
          id: loadingToast,
        });
      }
    } catch (error) {
      console.error('Error deleting feedback:', error);
      toast.error('Fel vid borttagning av feedback', {
        id: loadingToast,
      });
    }
  };

  const saveFreetextFeedback = async () => {
    if (!booking.userId) {
      toast.error('Kan inte spara feedback för gästbokningar');
      return;
    }

    if (!freetextFeedback.feedbackText.trim()) {
      toast.error('Kommentar måste fyllas i');
      return;
    }

    setIsSaving(true);
    const loadingToast = toast.loading('Sparar allmän feedback...');
    
    try {
      const feedbackData = [{
        bookingId: booking.id,
        userId: booking.userId,
        stepIdentifier: 'Allmän kommentar',
        feedbackText: freetextFeedback.feedbackText,
        valuation: freetextFeedback.valuation,
        isFromTeacher: true
      }];

      const response = await fetch(`/api/admin/bookings/${booking.id}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ feedback: feedbackData }),
      });

      if (response.ok) {
        toast.success('Allmän feedback sparad framgångsrikt!', {
          id: loadingToast,
        });
        setFreetextFeedback({ feedbackText: '', valuation: 5 });
        loadExistingFeedback();
      } else {
        toast.error('Fel vid sparande av feedback', {
          id: loadingToast,
        });
      }
    } catch (error) {
      console.error('Error saving freetext feedback:', error);
      toast.error('Fel vid sparande av feedback', {
        id: loadingToast,
      });
    }
    setIsSaving(false);
  };

  // Time-gate: allow feedback only after lesson start + 45 minutes
  const canGiveFeedback = (): boolean => {
    try {
      const dateStr = booking.scheduledDate as string; // yyyy-mm-dd
      const startStr = (booking.startTime as string)?.slice(0,5) || '00:00'; // HH:MM
      const [h, m] = startStr.split(':').map((n: string) => parseInt(n, 10));
      const threshold = new Date(dateStr + 'T00:00:00');
      threshold.setHours(h || 0, m || 0, 0, 0);
      threshold.setMinutes(threshold.getMinutes() + 45);
      return new Date() >= threshold;
    } catch {
      return true; // fail-open if parsing fails
    }
  };

  const openGuarded = (openFn: () => void) => {
    if (!canGiveFeedback()) {
      toast.error('Bokningen måste vara genomförd. Vänta 45 minuter efter lektionens slut.');
      return;
    }
    openFn();
  };

  // Star summary (1-3) from existing feedback on planned steps
  const computeStars = (): number => {
    const plannedIds = Array.from(plannedSet);
    if (plannedIds.length === 0) return 0;
    const vals: number[] = [];
    existingFeedback.forEach((fb: any) => {
      if (fb.bookingId === booking.id && typeof fb.valuation === 'number' && plannedIds.includes(fb.stepIdentifier)) {
        vals.push(fb.valuation);
      }
    });
    if (vals.length === 0) return 0;
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    if (avg >= 8) return 3;
    if (avg >= 5) return 2;
    return 1;
  };

  const renderStars = (count: number) => (
    <div className="flex items-center gap-2">
      {[1,2,3].map(i => (
        <Star key={i} className={`w-7 h-7 ${i <= count ? 'text-yellow-400 fill-yellow-400' : 'text-slate-400'}`} />
      ))}
    </div>
  );

  const plannedStepsGrouped = (): Record<string, any[]> => {
    const map: Record<string, any[]> = {};
    const byId = new Map<string, any>();
    bookingSteps.forEach((s: any) => byId.set(`${s.category}-${s.subcategory}`, s));
    plannedSet.forEach(key => {
      const step = byId.get(key);
      if (step) {
        (map[step.category] ||= []).push(step);
      }
    });
    return map;
  };

  const saveStepFeedbackModal = async () => {
    if (!currentStep) return;
    if (!canGiveFeedback()) {
      toast.error('Bokningen måste vara genomförd. Vänta 45 minuter efter lektionens slut.');
      return;
    }
    setIsSaving(true);
    const loadingToast = toast.loading('Sparar feedback...');
    try {
      const payload = [{
        bookingId: booking.id,
        userId: booking.userId,
        stepIdentifier: `${currentStep.category}-${currentStep.subcategory}`,
        feedbackText: stepText,
        valuation: stepValuation,
        isFromTeacher: true,
      }];
      const res = await fetch(`/api/admin/bookings/${booking.id}/feedback`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ feedback: payload })
      });
      if (res.ok) {
        toast.success('Feedback sparad', { id: loadingToast });
        setIsStepModalOpen(false);
        setCurrentStep(null);
        setStepText('');
        setStepValuation(5);
        loadExistingFeedback();
      } else {
        toast.error('Kunde inte spara', { id: loadingToast });
      }
    } catch (e) {
      console.error(e);
      toast.error('Fel vid sparande', { id: loadingToast });
    }
    setIsSaving(false);
  };

  const saveCategoryFeedbackModal = async () => {
    if (!currentCategory) return;
    if (!canGiveFeedback()) {
      toast.error('Bokningen måste vara genomförd. Vänta 45 minuter efter lektionens slut.');
      return;
    }
    setIsSaving(true);
    const loadingToast = toast.loading('Sparar kategorifeedback...');
    try {
      const payload = [{
        bookingId: booking.id,
        userId: booking.userId,
        stepIdentifier: `category::${currentCategory}`,
        feedbackText: categoryText,
        valuation: categoryValuation,
        isFromTeacher: true,
      }];
      const res = await fetch(`/api/admin/bookings/${booking.id}/feedback`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ feedback: payload })
      });
      if (res.ok) {
        toast.success('Kategorifeedback sparad', { id: loadingToast });
        setIsCategoryModalOpen(false);
        setCurrentCategory('');
        setCategoryText('');
        setCategoryValuation(5);
        loadExistingFeedback();
      } else {
        toast.error('Kunde inte spara', { id: loadingToast });
      }
    } catch (e) {
      console.error(e);
      toast.error('Fel vid sparande', { id: loadingToast });
    }
    setIsSaving(false);
  };

  const saveGeneralFeedbackModal = async () => {
    if (!canGiveFeedback()) {
      toast.error('Bokningen måste vara genomförd. Vänta 45 minuter efter lektionens slut.');
      return;
    }
    setIsSaving(true);
    const loadingToast = toast.loading('Sparar allmän feedback...');
    try {
      const payload = [{
        bookingId: booking.id,
        userId: booking.userId,
        stepIdentifier: 'Allmän kommentar',
        feedbackText: generalText,
        valuation: generalValuation,
        isFromTeacher: true,
      }];
      const res = await fetch(`/api/admin/bookings/${booking.id}/feedback`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ feedback: payload })
      });
      if (res.ok) {
        toast.success('Allmän feedback sparad', { id: loadingToast });
        setIsGeneralModalOpen(false);
        setGeneralText('');
        setGeneralValuation(5);
        loadExistingFeedback();
      } else {
        toast.error('Kunde inte spara', { id: loadingToast });
      }
    } catch (e) {
      console.error(e);
      toast.error('Fel vid sparande', { id: loadingToast });
    }
    setIsSaving(false);
  };

  const getStatusBadge = (status: string) => {
    if (!status) return null;
    switch (status) {
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-4 h-4" />
            Bekräftad
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
            <XCircle className="w-4 h-4" />
            Avbokad
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
            <AlertCircle className="w-4 h-4" />
            Väntande
          </span>
        );
    }
  };

  const getPaymentBadge = (paymentStatus: string) => {
    if (!paymentStatus) return null;
    return paymentStatus === 'paid' ? (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
        <CreditCard className="w-4 h-4" />
        Betald
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
        <CreditCard className="w-4 h-4" />
        Ej betald
      </span>
    );
  };

  return (
    <div className="max-w-5xl mx-auto text-white">
      <div className="mb-6">
        <Link
          href="/dashboard/admin/bookings"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Tillbaka till bokningar
        </Link>
      </div>

      <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl overflow-hidden">
        <div className="px-6 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-extrabold drop-shadow">Bokningsdetaljer</h1>
            <div className="flex gap-2">
              <button onClick={() => setShowMoveModal(true)} className="p-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg transition-colors">
                <Edit className="w-5 h-5" />
              </button>
              <button onClick={() => setShowDeleteModal(true)} className="p-2 bg-rose-600/90 hover:bg-rose-600 text-white rounded-lg transition-colors">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-white/10">
          <div className="flex space-x-4 px-6">
            <button 
              onClick={() => setActiveTab('details')} 
              className={`py-3 px-4 text-sm font-medium transition-colors ${
                activeTab === 'details' 
                ? 'text-white border-b-2 border-sky-400' 
                : 'text-slate-300 hover:text-white'
              }`}>
              <BookOpen className="w-5 h-5 inline-block mr-2"/>
              Detaljer
            </button>
            <button 
              onClick={() => setActiveTab('planning')} 
              className={`py-3 px-4 text-sm font-medium transition-colors ${
                activeTab === 'planning' 
                ? 'text-white border-b-2 border-sky-400' 
                : 'text-slate-300 hover:text-white'
              }`}>
              <ClipboardList className="w-5 h-5 inline-block mr-2"/>
              Planering
            </button>
            <button 
              onClick={() => setActiveTab('feedback')} 
              className={`py-3 px-4 text-sm font-medium transition-colors ${
                activeTab === 'feedback' 
                ? 'text-white border-b-2 border-sky-400' 
                : 'text-slate-300 hover:text-white'
              }`}>
              <MessageSquare className="w-5 h-5 inline-block mr-2"/>
              Feedback
            </button>
            <button 
              onClick={() => setActiveTab('status')} 
              className={`py-3 px-4 text-sm font-medium transition-colors ${
                activeTab === 'status' 
                ? 'text-white border-b-2 border-sky-400' 
                : 'text-slate-300 hover:text-white'
              }`}>
              <Settings className="w-5 h-5 inline-block mr-2"/>
              Status
            </button>
          </div>
        </div>

        {activeTab === 'details' && (
          <div className="p-6 space-y-6">
            {/* Status Section */}
            <div className="flex flex-wrap gap-4 mb-6">
              {getStatusBadge(booking.status)}
              {getPaymentBadge(booking.paymentStatus)}
              {booking.isCompleted && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  <CheckCircle className="w-4 h-4" />
                  Genomförd
                </span>
              )}
            </div>

            {/* Quick Status Update Panel - Always Visible */}
            <div className="mb-6">
              <StatusUpdatePanel 
                booking={bookingData} 
                onStatusUpdate={() => {
                  // Refresh booking data after status update
                  window.location.reload();
                }} 
              />
            </div>
            
            {/* Main Information */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-sky-300" />
                  Lektionsinformation
                </h2>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-300">Datum:</span>
                    <span className="font-semibold text-white">{formatDate(booking.scheduledDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Tid:</span>
                    <span className="font-semibold text-white">
                      {booking.startTime?.slice(0, 5)} - {booking.endTime?.slice(0, 5)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Lektionstyp:</span>
                    <span className="font-semibold text-white">{booking.lessonTypeName || booking.lessonType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Pris:</span>
                    <span className="font-semibold text-white">{booking.totalPrice || booking.lessonTypePrice} kr</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-sky-300" />
                  Kundinformation
                </h2>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-300">Namn:</span>
                    <span className="font-semibold text-white">
                      {booking.userFirstName && booking.userLastName 
                        ? `${booking.userFirstName} ${booking.userLastName}`
                        : booking.guestName || 'N/A'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">E-post:</span>
                    <span className="font-semibold text-white">{booking.userEmail || booking.guestEmail || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Telefon:</span>
                    <span className="font-semibold text-white">{booking.userPhone || booking.guestPhone || 'N/A'}</span>
                  </div>
                  {booking.userId && (
                    <div className="flex justify-between">
                      <span className="text-slate-300">Användar-ID:</span>
                      <Link 
                        href={`/dashboard/admin/users/${booking.userId}`}
                        className="font-semibold text-sky-300 hover:text-white"
                      >
                        {booking.userId}
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Car Information */}
            {booking.carId && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Car className="w-5 h-5 text-sky-300" />
                  Bilinformation
                </h2>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex justify-between">
                    <span className="text-slate-300">Bil:</span>
                    <span className="font-semibold text-white">{booking.carName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Registreringsnummer:</span>
                    <span className="font-semibold text-white">{booking.carRegistration}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Invoice Information */}
            {booking.invoiceNumber && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-sky-300" />
                  Fakturainformation
                </h2>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex justify-between">
                    <span className="text-slate-300">Fakturanummer:</span>
                    <span className="font-semibold text-white">{booking.invoiceNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Fakturadatum:</span>
                    <span className="font-semibold text-white">{formatDate(booking.invoiceDate)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            {booking.notes && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-white">Anteckningar</h2>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-slate-200 whitespace-pre-wrap">{booking.notes}</p>
                </div>
              </div>
            )}

            {/* Timestamps */}
            <div className="pt-4 border-t border-white/10 text-sm text-slate-300">
              <div className="grid md:grid-cols-2 gap-4">
                <div>Skapad: <span className="text-white">{formatDateTime(booking.createdAt)}</span></div>
                <div>Uppdaterad: <span className="text-white">{formatDateTime(booking.updatedAt)}</span></div>
                {booking.completedAt && (
                  <div>Genomförd: <span className="text-white">{formatDateTime(booking.completedAt)}</span></div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'planning' && (
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4">Planera lektion</h2>
            {isLoadingSteps ? (
              <div className="text-slate-300">Laddar...</div>
            ) : (
              <div className="space-y-6">
                <div className="mb-2">
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Sök efter steg..."
                    className="w-full md:w-80 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-slate-300"
                  />
                </div>
                {Object.entries(
                  bookingSteps
                    .filter((s:any)=>{
                      const q = searchQuery.trim().toLowerCase();
                      if (!q) return true;
                      return (
                        s.category?.toLowerCase().includes(q) ||
                        s.subcategory?.toLowerCase().includes(q) ||
                        s.description?.toLowerCase().includes(q)
                      );
                    })
                    .reduce((acc: Record<string, any[]>, s: any) => {
                      (acc[s.category] ||= []).push(s);
                      return acc;
                    }, {})
                ).map(([category, steps]: [string, any[]]) => (
                  <div key={category} className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${
                          statusByCategory[category] === 'green' ? 'bg-green-500/30 text-green-300'
                          : statusByCategory[category] === 'orange' ? 'bg-yellow-500/30 text-yellow-300'
                          : statusByCategory[category] === 'red' ? 'bg-rose-500/30 text-rose-300'
                          : 'bg-slate-500/30 text-slate-300'
                        }`}>
                          {!statusByCategory[category] || statusByCategory[category] === 'unknown' ? '?' : '!' }
                        </span>
                        <h3 className="text-lg font-extrabold text-white drop-shadow">{category}</h3>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => {
                          const toAdd = new Set(plannedSet);
                          steps.forEach(s => toAdd.add(stepIdentifierOf(s)));
                          setPlannedSet(toAdd);
                          setIsPlanDirty(true);
                        }} className="px-2 py-1 text-xs rounded bg-white/10 border border-white/20">Välj alla</button>
                        <button onClick={() => {
                          const toDel = new Set(plannedSet);
                          steps.forEach(s => toDel.delete(stepIdentifierOf(s)));
                          setPlannedSet(toDel);
                          setIsPlanDirty(true);
                        }} className="px-2 py-1 text-xs rounded bg-white/10 border border-white/20">Rensa</button>
                      </div>
                    </div>
                    <div className="p-4 grid md:grid-cols-2 gap-3">
                      {steps.map(step => {
                        const key = stepIdentifierOf(step);
                        const checked = plannedSet.has(key);
                        return (
                          <label key={key} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => handlePlanToggle(step)}
                              className="h-6 w-6 text-sky-400 bg-white/10 border-white/20 rounded focus:ring-sky-400"
                            />
                            <span className="text-white">
                              <span className="font-semibold">{step.subcategory}</span>
                              {step.description ? <span className="text-slate-300"> — {step.description}</span> : null}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {isPlanDirty && (
              <div className="fixed left-0 right-0 bottom-0 flex justify-center z-50 pointer-events-none">
                <div className="m-4 pointer-events-auto rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 shadow-2xl px-4 py-2 flex items-center gap-3">
                  <span className="text-white text-sm">Ändringar ej sparade</span>
                  <button onClick={savePlan} className="px-3 py-1 rounded-lg bg-sky-500 text-white hover:bg-sky-600 text-sm flex items-center gap-1">
                    <Save className="w-4 h-4" /> Spara planering
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'feedback' && (
          <div className="p-6 space-y-6">
            {/* Top summary: stars and add general feedback button */}
            <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-extrabold text-white drop-shadow mb-1">Sammanfattning</h3>
                <div>{renderStars(computeStars())}</div>
              </div>
              <button
                onClick={() => openGuarded(() => setIsGeneralModalOpen(true))}
                className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white flex items-center gap-2"
              >
                <Plus className="w-5 h-5" /> Lägg till allmän feedback
              </button>
            </div>

            {/* Planned categories with feedback actions */}
            <div className="space-y-6">
              {Object.entries(plannedStepsGrouped()).map(([category, steps]) => (
                <div key={category} className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                    <h3 className="text-lg font-extrabold text-white drop-shadow">{category}</h3>
                    <button
                      onClick={() => openGuarded(() => { setCurrentCategory(category); setIsCategoryModalOpen(true); })}
                      className="px-3 py-1 rounded bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm"
                    >
                      Lämna kategorifeedback
                    </button>
                  </div>
                  <div className="p-4 grid md:grid-cols-2 gap-3">
                    {steps.map((s: any) => (
                      <div key={`${s.category}-${s.subcategory}`} className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-3">
                        <div className="text-white"><span className="font-semibold">{s.subcategory}</span>{s.description ? <span className="text-slate-300"> — {s.description}</span> : null}</div>
                        <button
                          onClick={() => openGuarded(() => { setCurrentStep(s); setIsStepModalOpen(true); })}
                          className="px-3 py-1 rounded bg-sky-600/90 hover:bg-sky-600 text-white text-sm"
                        >
                          Ge feedback
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {Object.keys(plannedStepsGrouped()).length === 0 && (
                <div className="text-slate-300">Inga planerade steg för denna bokning.</div>
              )}
            </div>

            {/* Existing feedback list (compact) */}
            <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
              <h3 className="text-lg font-semibold text-white mb-3">Befintlig feedback</h3>
              {isLoadingFeedback ? (
                <div className="text-slate-300">Laddar...</div>
              ) : (
                <div className="space-y-2">
                  {existingFeedback.map((fb: any) => (
                    <div key={fb.id} className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-white truncate">{fb.stepIdentifier}</h4>
                          {typeof fb.valuation === 'number' && (
                            <span className="px-2 py-0.5 rounded-full bg-white/10 text-sky-200 text-xs border border-white/20">{fb.valuation}/10</span>
                          )}
                        </div>
                        <p className="text-slate-200 whitespace-pre-wrap break-words">{fb.feedbackText}</p>
                      </div>
                      <div className="flex gap-2 ml-2 shrink-0">
                        <button onClick={() => startEditingFeedback(fb)} className="px-2 py-1 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs rounded">Redigera</button>
                        <button onClick={() => deleteFeedback(fb.id)} className="px-2 py-1 bg-rose-600/90 hover:bg-rose-600 text-white text-xs rounded">Ta bort</button>
                      </div>
                    </div>
                  ))}
                  {existingFeedback.length === 0 && (
                    <div className="text-slate-300">Ingen feedback finns ännu.</div>
                  )}
                </div>
              )}
            </div>

            {/* Edit inline modal fallback (existing) */}
            {editingFeedback && (
              <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div className="absolute inset-0 bg-black/60" onClick={cancelEditingFeedback} />
                <div className="relative w-full max-w-lg mx-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl p-4">
                  <h4 className="text-white font-extrabold mb-3">Redigera feedback</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm text-slate-300 mb-1">Värdering (1-10)</label>
                      <input type="range" min="1" max="10" value={editingFeedback.valuation}
                        onChange={e => updateEditingFeedback('valuation', parseInt(e.target.value))} className="w-full" />
                      <div className="text-center font-bold text-white">{editingFeedback.valuation}</div>
                    </div>
                    <div>
                      <label className="block text-sm text-slate-300 mb-1">Kommentar</label>
                      <textarea value={editingFeedback.feedbackText} onChange={e => updateEditingFeedback('feedbackText', e.target.value)}
                        className="w-full p-2 rounded-md bg-white/10 border border-white/20 text-white" rows={3} />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button onClick={cancelEditingFeedback} className="px-3 py-1 rounded bg-white/10 border border-white/20 text-white">Avbryt</button>
                      <button onClick={saveEditedFeedback} disabled={isSaving} className="px-3 py-1 rounded bg-sky-600/90 hover:bg-sky-600 text-white">
                        {isSaving ? 'Sparar...' : 'Spara'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* General feedback modal */}
            {isGeneralModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div className="absolute inset-0 bg-black/60" onClick={() => setIsGeneralModalOpen(false)} />
                <div className="relative w-full max-w-xl mx-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl p-5">
                  <h4 className="text-white font-extrabold mb-3">Allmän feedback</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-slate-300 mb-1">Värdering (1-10)</label>
                      <input type="range" min="1" max="10" value={generalValuation} onChange={e => setGeneralValuation(parseInt(e.target.value))} className="w-full" />
                      <div className="text-center font-bold text-white">{generalValuation}</div>
                    </div>
                    <div>
                      <label className="block text-sm text-slate-300 mb-1">Kommentar</label>
                      <textarea value={generalText} onChange={e => setGeneralText(e.target.value)} className="w-full p-2 rounded-md bg-white/10 border border-white/20 text-white" rows={4} placeholder="Skriv din allmänna feedback här..." />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setIsGeneralModalOpen(false)} className="px-3 py-1 rounded bg-white/10 border border-white/20 text-white">Avbryt</button>
                      <button onClick={saveGeneralFeedbackModal} disabled={isSaving || !generalText.trim()} className="px-3 py-1 rounded bg-sky-600/90 hover:bg-sky-600 text-white">
                        {isSaving ? 'Sparar...' : 'Spara'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step feedback modal */}
            {isStepModalOpen && currentStep && (
              <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div className="absolute inset-0 bg-black/60" onClick={() => setIsStepModalOpen(false)} />
                <div className="relative w-full max-w-xl mx-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl p-5">
                  <h4 className="text-white font-extrabold mb-1">{currentStep.category}</h4>
                  <div className="text-slate-300 mb-3">{currentStep.subcategory}</div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setStepValuation(3)} className={`px-3 py-1 rounded ${stepValuation===3?'bg-rose-600/90 text-white':'bg-white/10 text-slate-200 border border-white/20'}`}>Behöver träning</button>
                      <button onClick={() => setStepValuation(6)} className={`px-3 py-1 rounded ${stepValuation===6?'bg-yellow-600/90 text-white':'bg-white/10 text-slate-200 border border-white/20'}`}>Sådär</button>
                      <button onClick={() => setStepValuation(9)} className={`px-3 py-1 rounded ${stepValuation===9?'bg-green-600/90 text-white':'bg-white/10 text-slate-200 border border-white/20'}`}>Bra</button>
                    </div>
                    <div>
                      <label className="block text-sm text-slate-300 mb-1">Kommentar</label>
                      <textarea value={stepText} onChange={e => setStepText(e.target.value)} className="w-full p-2 rounded-md bg-white/10 border border-white/20 text-white" rows={4} />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setIsStepModalOpen(false)} className="px-3 py-1 rounded bg-white/10 border border-white/20 text-white">Avbryt</button>
                      <button onClick={saveStepFeedbackModal} disabled={isSaving || !stepText.trim()} className="px-3 py-1 rounded bg-sky-600/90 hover:bg-sky-600 text-white">{isSaving?'Sparar...':'Spara'}</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Category feedback modal */}
            {isCategoryModalOpen && currentCategory && (
              <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div className="absolute inset-0 bg-black/60" onClick={() => setIsCategoryModalOpen(false)} />
                <div className="relative w-full max-w-xl mx-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl p-5">
                  <h4 className="text-white font-extrabold mb-3">{currentCategory}</h4>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setCategoryValuation(3)} className={`px-3 py-1 rounded ${categoryValuation===3?'bg-rose-600/90 text-white':'bg-white/10 text-slate-200 border border-white/20'}`}>Behöver träning</button>
                      <button onClick={() => setCategoryValuation(6)} className={`px-3 py-1 rounded ${categoryValuation===6?'bg-yellow-600/90 text-white':'bg-white/10 text-slate-200 border border-white/20'}`}>Sådär</button>
                      <button onClick={() => setCategoryValuation(9)} className={`px-3 py-1 rounded ${categoryValuation===9?'bg-green-600/90 text-white':'bg-white/10 text-slate-200 border border-white/20'}`}>Bra</button>
                    </div>
                    <div>
                      <label className="block text-sm text-slate-300 mb-1">Kommentar</label>
                      <textarea value={categoryText} onChange={e => setCategoryText(e.target.value)} className="w-full p-2 rounded-md bg-white/10 border border-white/20 text-white" rows={4} />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setIsCategoryModalOpen(false)} className="px-3 py-1 rounded bg-white/10 border border-white/20 text-white">Avbryt</button>
                      <button onClick={saveCategoryFeedbackModal} disabled={isSaving || !categoryText.trim()} className="px-3 py-1 rounded bg-sky-600/90 hover:bg-sky-600 text-white">{isSaving?'Sparar...':'Spara'}</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'status' && (
          <div className="p-6">
            <StatusUpdatePanel 
              booking={bookingData} 
              onStatusUpdate={() => {
                // Refresh booking data after status update
                window.location.reload();
              }} 
            />
          </div>
        )}
      </div>

      <MoveBookingModal
        isOpen={showMoveModal} 
        onClose={() => setShowMoveModal(false)} 
        bookingId={booking.id} 
      />
      <DeleteBookingConfirmation 
        isOpen={showDeleteModal} 
        onClose={() => setShowDeleteModal(false)} 
        bookingId={booking.id} 
      />
    </div>
  );
};

export default BookingDetailsClient;
