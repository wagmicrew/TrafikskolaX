'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
  BookOpen
} from 'lucide-react';
import { format } from 'date-fns';
import MoveBookingModal from './MoveBookingModal';
import DeleteBookingConfirmation from './DeleteBookingConfirmation';

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
  const [bookingSteps, setBookingSteps] = useState([]);
  const [existingFeedback, setExistingFeedback] = useState([]);
  const [selectedSteps, setSelectedSteps] = useState([]);
  const [isLoadingSteps, setIsLoadingSteps] = useState(false);
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingFeedback, setEditingFeedback] = useState(null);
  const [freetextFeedback, setFreetextFeedback] = useState({
    feedbackText: '',
    valuation: 5
  });

  // Load booking steps and existing feedback
  useEffect(() => {
    if (activeTab === 'planning' || activeTab === 'feedback') {
      loadBookingSteps();
      loadExistingFeedback();
    }
  }, [activeTab, booking.id]);

  const loadBookingSteps = async () => {
    setIsLoadingSteps(true);
    try {
      const response = await fetch('/api/admin/booking-steps');
      if (response.ok) {
        const data = await response.json();
        setBookingSteps(data);
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
      }
    } catch (error) {
      console.error('Error loading feedback:', error);
    }
    setIsLoadingFeedback(false);
  };

  const handleStepSelection = (stepId, stepInfo) => {
    setSelectedSteps(prev => {
      const existing = prev.find(s => s.stepId === stepId);
      if (existing) {
        return prev.filter(s => s.stepId !== stepId);
      } else {
        return [...prev, {
          stepId,
          stepInfo,
          valuation: 5,
          feedbackText: ''
        }];
      }
    });
  };

  const updateStepFeedback = (stepId, field, value) => {
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
      alert('Kan inte spara feedback för gästbokningar');
      return;
    }

    setIsSaving(true);
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
        alert('Feedback sparad!');
        setSelectedSteps([]);
        loadExistingFeedback();
      } else {
        alert('Fel vid sparande av feedback');
      }
    } catch (error) {
      console.error('Error saving feedback:', error);
      alert('Fel vid sparande av feedback');
    }
    setIsSaving(false);
  };

  const startEditingFeedback = (feedbackItem) => {
    setEditingFeedback({
      ...feedbackItem,
      originalValuation: feedbackItem.valuation,
      originalFeedbackText: feedbackItem.feedbackText
    });
  };

  const updateEditingFeedback = (field, value) => {
    setEditingFeedback(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const saveEditedFeedback = async () => {
    if (!editingFeedback) return;

    setIsSaving(true);
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
        alert('Feedback uppdaterad!');
        setEditingFeedback(null);
        loadExistingFeedback();
      } else {
        alert('Fel vid uppdatering av feedback');
      }
    } catch (error) {
      console.error('Error updating feedback:', error);
      alert('Fel vid uppdatering av feedback');
    }
    setIsSaving(false);
  };

  const cancelEditingFeedback = () => {
    setEditingFeedback(null);
  };

  const deleteFeedback = async (feedbackId) => {
    if (!confirm('Är du säker på att du vill ta bort denna feedback?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/bookings/${booking.id}/feedback/${feedbackId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Feedback borttagen!');
        loadExistingFeedback();
      } else {
        alert('Fel vid borttagning av feedback');
      }
    } catch (error) {
      console.error('Error deleting feedback:', error);
      alert('Fel vid borttagning av feedback');
    }
  };

  const saveFreetextFeedback = async () => {
    if (!booking.userId) {
      alert('Kan inte spara feedback för gästbokningar');
      return;
    }

    if (!freetextFeedback.feedbackText.trim()) {
      alert('Kommentar måste fyllas i');
      return;
    }

    setIsSaving(true);
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
        alert('Allmän feedback sparad!');
        setFreetextFeedback({ feedbackText: '', valuation: 5 });
        loadExistingFeedback();
      } else {
        alert('Fel vid sparande av feedback');
      }
    } catch (error) {
      console.error('Error saving freetext feedback:', error);
      alert('Fel vid sparande av feedback');
    }
    setIsSaving(false);
  };

  const getStatusBadge = (status) => {
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

  const getPaymentBadge = (paymentStatus) => {
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
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link
          href="/dashboard/admin/bookings"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Tillbaka till bokningar
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-white">Bokningsdetaljer</h1>
            <div className="flex gap-2">
              <button onClick={() => setShowMoveModal(true)} className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors">
                <Edit className="w-5 h-5 text-white" />
              </button>
              <button onClick={() => setShowDeleteModal(true)} className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors">
                <Trash2 className="w-5 h-5 text-white" />
              </button>
            </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex space-x-4 px-6">
            <button 
              onClick={() => setActiveTab('details')} 
              className={`py-3 px-4 text-sm font-medium transition-colors ${
                activeTab === 'details' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-600 hover:text-blue-500'
              }`}>
              <BookOpen className="w-5 h-5 inline-block mr-2"/>
              Detaljer
            </button>
            <button 
              onClick={() => setActiveTab('planning')} 
              className={`py-3 px-4 text-sm font-medium transition-colors ${
                activeTab === 'planning' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-600 hover:text-blue-500'
              }`}>
              <ClipboardList className="w-5 h-5 inline-block mr-2"/>
              Planering
            </button>
            <button 
              onClick={() => setActiveTab('feedback')} 
              className={`py-3 px-4 text-sm font-medium transition-colors ${
                activeTab === 'feedback' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-600 hover:text-blue-500'
              }`}>
              <MessageSquare className="w-5 h-5 inline-block mr-2"/>
              Feedback
            </button>
          </div>
        </div>

        {activeTab === 'details' && (
          <div className="p-6 space-y-6">
            {/* Status Section */}
            <div className="flex flex-wrap gap-4">
              {getStatusBadge(booking.status)}
              {getPaymentBadge(booking.paymentStatus)}
              {booking.isCompleted && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  <CheckCircle className="w-4 h-4" />
                  Genomförd
                </span>
              )}
            </div>
            
            {/* Main Information */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  Lektionsinformation
                </h2>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Datum:</span>
                    <span className="font-medium">{formatDate(booking.scheduledDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tid:</span>
                    <span className="font-medium">
                      {booking.startTime?.slice(0, 5)} - {booking.endTime?.slice(0, 5)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Lektionstyp:</span>
                    <span className="font-medium">{booking.lessonTypeName || booking.lessonType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pris:</span>
                    <span className="font-medium">{booking.totalPrice || booking.lessonTypePrice} kr</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  Kundinformation
                </h2>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Namn:</span>
                    <span className="font-medium">
                      {booking.userFirstName && booking.userLastName 
                        ? `${booking.userFirstName} ${booking.userLastName}`
                        : booking.guestName || 'N/A'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">E-post:</span>
                    <span className="font-medium">{booking.userEmail || booking.guestEmail || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Telefon:</span>
                    <span className="font-medium">{booking.userPhone || booking.guestPhone || 'N/A'}</span>
                  </div>
                  {booking.userId && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Användar-ID:</span>
                      <Link 
                        href={`/dashboard/admin/users/${booking.userId}`}
                        className="font-medium text-blue-600 hover:text-blue-800"
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
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Car className="w-5 h-5 text-blue-600" />
                  Bilinformation
                </h2>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Bil:</span>
                    <span className="font-medium">{booking.carName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Registreringsnummer:</span>
                    <span className="font-medium">{booking.carRegistration}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Invoice Information */}
            {booking.invoiceNumber && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Fakturainformation
                </h2>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fakturanummer:</span>
                    <span className="font-medium">{booking.invoiceNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fakturadatum:</span>
                    <span className="font-medium">{formatDate(booking.invoiceDate)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            {booking.notes && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-800">Anteckningar</h2>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-700 whitespace-pre-wrap">{booking.notes}</p>
                </div>
              </div>
            )}

            {/* Timestamps */}
            <div className="pt-4 border-t border-gray-200 text-sm text-gray-500">
              <div className="grid md:grid-cols-2 gap-4">
                <div>Skapad: {formatDateTime(booking.createdAt)}</div>
                <div>Uppdaterad: {formatDateTime(booking.updatedAt)}</div>
                {booking.completedAt && (
                  <div>Genomförd: {formatDateTime(booking.completedAt)}</div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'planning' && (
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4">Planera lektion</h2>
            {isLoadingSteps ? (
              <div>Laddar...</div>
            ) : (
              <div className="space-y-4">
                {bookingSteps.map(step => (
                  <div key={step.id} className="flex items-center">
                    <input 
                      type="checkbox" 
                      id={`step-${step.id}`}
                      checked={selectedSteps.some(s => s.stepId === step.id)}
                      onChange={() => handleStepSelection(step.id, step)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor={`step-${step.id}`} className="ml-3 text-gray-700">
                      {step.category}: {step.subcategory}
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'feedback' && (
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4">Ge feedback</h2>
            <div className="space-y-6">
              {/* Existing Feedback */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Befintlig Feedback</h3>
                {isLoadingFeedback ? <div>Laddar...</div> : (
                  <div className="space-y-3">
                    {existingFeedback.map(fb => (
                      <div key={fb.id} className="p-4 bg-gray-100 rounded-lg border">
                        {editingFeedback?.id === fb.id ? (
                          /* Edit Mode */
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <h4 className="font-bold text-gray-800">{fb.stepIdentifier}</h4>
                              <div className="flex gap-2">
                                <button
                                  onClick={saveEditedFeedback}
                                  disabled={isSaving}
                                  className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:bg-green-300"
                                >
                                  <Save className="w-4 h-4 inline mr-1" />
                                  {isSaving ? 'Sparar...' : 'Spara'}
                                </button>
                                <button
                                  onClick={cancelEditingFeedback}
                                  className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                                >
                                  Avbryt
                                </button>
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Värdering (1-10)</label>
                              <input
                                type="range"
                                min="1"
                                max="10"
                                value={editingFeedback.valuation}
                                onChange={e => updateEditingFeedback('valuation', parseInt(e.target.value))}
                                className="w-full"
                              />
                              <div className="text-center font-bold">{editingFeedback.valuation}</div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Kommentar</label>
                              <textarea
                                value={editingFeedback.feedbackText}
                                onChange={e => updateEditingFeedback('feedbackText', e.target.value)}
                                className="w-full p-2 border rounded-md"
                                rows="3"
                              ></textarea>
                            </div>
                          </div>
                        ) : (
                          /* View Mode */
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-bold text-gray-800">{fb.stepIdentifier}</h4>
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">{fb.valuation}/10</span>
                              </div>
                              <p className="text-gray-700">{fb.feedbackText}</p>
                            </div>
                            <div className="flex gap-2 ml-4">
                              <button
                                onClick={() => startEditingFeedback(fb)}
                                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                              >
                                <Edit className="w-4 h-4 inline mr-1" />
                                Redigera
                              </button>
                              <button
                                onClick={() => deleteFeedback(fb.id)}
                                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                              >
                                <Trash2 className="w-4 h-4 inline mr-1" />
                                Ta bort
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    {existingFeedback.length === 0 && (
                      <p className="text-gray-500 text-center py-4">Ingen feedback finns ännu.</p>
                    )}
                  </div>
                )}
              </div>

              {/* Freetext Feedback Form */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-lg font-semibold">Lägg till allmän feedback</h3>
                <div className="p-4 border rounded-lg bg-blue-50">
                  <h4 className="font-bold mb-3">Allmän kommentar</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Värdering (1-10)</label>
                      <input 
                        type="range" 
                        min="1" 
                        max="10" 
                        value={freetextFeedback.valuation}
                        onChange={e => setFreetextFeedback(prev => ({ ...prev, valuation: parseInt(e.target.value) }))}
                        className="w-full"
                      />
                      <div className="text-center font-bold">{freetextFeedback.valuation}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Kommentar</label>
                      <textarea
                        value={freetextFeedback.feedbackText}
                        onChange={e => setFreetextFeedback(prev => ({ ...prev, feedbackText: e.target.value }))}
                        className="w-full p-2 border rounded-md"
                        rows="3"
                        placeholder="Skriv din allmänna feedback här..."
                      ></textarea>
                    </div>
                    <button 
                      onClick={saveFreetextFeedback} 
                      disabled={isSaving || !freetextFeedback.feedbackText.trim()}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-300"
                    >
                      <Plus className="w-4 h-4 inline mr-1" />
                      {isSaving ? 'Sparar...' : 'Spara allmän feedback'}
                    </button>
                  </div>
                </div>
              </div>

              {/* New Feedback Form */}
              {selectedSteps.length > 0 && (
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="text-lg font-semibold">Ny steg-specifik feedback</h3>
                  {selectedSteps.map(step => (
                    <div key={step.stepId} className="p-4 border rounded-lg">
                      <h4 className="font-bold">{step.stepInfo.category}: {step.stepInfo.subcategory}</h4>
                      <div className="mt-2">
                        <label className="block text-sm font-medium text-gray-700">Värdering (1-10)</label>
                        <input 
                          type="range" 
                          min="1" 
                          max="10" 
                          value={step.valuation}
                          onChange={e => updateStepFeedback(step.stepId, 'valuation', parseInt(e.target.value))}
                          className="w-full"
                        />
                        <div className="text-center font-bold">{step.valuation}</div>
                      </div>
                      <div className="mt-2">
                        <label className="block text-sm font-medium text-gray-700">Kommentar</label>
                        <textarea
                          value={step.feedbackText}
                          onChange={e => updateStepFeedback(step.stepId, 'feedbackText', e.target.value)}
                          className="w-full mt-1 p-2 border rounded-md"
                          rows="2"
                        ></textarea>
                      </div>
                    </div>
                  ))}
                  <button 
                    onClick={saveFeedback} 
                    disabled={isSaving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
                  >
                    {isSaving ? 'Sparar...' : 'Spara steg-feedback'}
                  </button>
                </div>
              )}
            </div>
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
