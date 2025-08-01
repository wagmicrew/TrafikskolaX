"use client";

import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, Edit, Trash2, Minus, CreditCard, BookOpen, Users } from 'lucide-react';

interface UserCreditsManagerProps {
  userId: string;
}

interface Credit {
  id: string;
  lessonTypeId: string | null;
  handledarSessionId: string | null;
  creditType: 'lesson' | 'handledar';
  creditsRemaining: number;
  creditsTotal: number;
  lessonTypeName?: string;
  handledarSessionTitle?: string;
  createdAt: string;
  updatedAt: string;
}

interface LessonType {
  id: string;
  name: string;
  description?: string;
  price: number;
  durationMinutes: number;
  isActive: boolean;
}

interface HandledarSession {
  id: string;
  title: string;
  description?: string;
  date: string;
  startTime: string;
  endTime: string;
  pricePerParticipant: number;
  maxParticipants: number;
  currentParticipants: number;
  isActive: boolean;
}

const UserCreditsManager: React.FC<UserCreditsManagerProps> = ({ userId }) => {
  const [credits, setCredits] = useState<Credit[]>([]);
  const [lessonTypes, setLessonTypes] = useState<LessonType[]>([]);
  const [handledarSessions, setHandledarSessions] = useState<HandledarSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCredit, setEditingCredit] = useState<Credit | null>(null);
  
  // Form states
  const [selectedCreditType, setSelectedCreditType] = useState<'lesson' | 'handledar'>('lesson');
  const [selectedLessonType, setSelectedLessonType] = useState('');
  const [selectedHandledarSession, setSelectedHandledarSession] = useState('');
  const [creditAmount, setCreditAmount] = useState(1);

  useEffect(() => {
    fetchCredits();
    fetchLessonTypes();
    fetchHandledarSessions();
  }, [userId]);

  const fetchCredits = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}/credits`);
      const data = await response.json();
      if (response.ok) {
        setCredits(data.credits || []);
      } else {
        toast.error(data.error || 'Failed to fetch credits');
      }
    } catch (error) {
      toast.error('Failed to fetch credits');
      console.error('Error fetching credits:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLessonTypes = async () => {
    try {
      const response = await fetch('/api/lesson-types');
      const data = await response.json();
      if (response.ok) {
        setLessonTypes(data.lessonTypes || []);
      }
    } catch (error) {
      console.error('Error fetching lesson types:', error);
    }
  };

  const fetchHandledarSessions = async () => {
    try {
      const response = await fetch('/api/admin/handledar-sessions');
      const data = await response.json();
      if (response.ok) {
        setHandledarSessions(data.sessions || []);
      }
    } catch (error) {
      console.error('Error fetching handledar sessions:', error);
    }
  };

  const handleAddCredit = async () => {
    if (selectedCreditType === 'lesson' && !selectedLessonType) {
      toast.error('Please select a lesson type');
      return;
    }
    // For handledar credits, session selection is optional (generic credits)
    if (creditAmount <= 0) {
      toast.error('Please enter a valid credit amount');
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}/credits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          creditType: selectedCreditType,
          lessonTypeId: selectedCreditType === 'lesson' ? selectedLessonType : null,
          handledarSessionId: selectedCreditType === 'handledar' && selectedHandledarSession ? selectedHandledarSession : null,
          amount: creditAmount,
        }),
      });
      
      const data = await response.json();
      if (response.ok) {
        toast.success(data.message || 'Credits added successfully');
        fetchCredits();
        resetForm();
        setShowAddModal(false);
      } else {
        toast.error(data.error || 'Failed to add credits');
      }
    } catch (error) {
      toast.error('Failed to add credits');
      console.error('Error adding credits:', error);
    }
  };

  const handleUpdateCredit = async (creditId: string, creditsRemaining: number) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/credits`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          creditsId: creditId,
          creditsRemaining,
        }),
      });
      
      const data = await response.json();
      if (response.ok) {
        toast.success(data.message || 'Credits updated successfully');
        fetchCredits();
        setEditingCredit(null);
      } else {
        toast.error(data.error || 'Failed to update credits');
      }
    } catch (error) {
      toast.error('Failed to update credits');
      console.error('Error updating credits:', error);
    }
  };

  const handleRemoveCredit = async (creditId: string, removeAll: boolean = false, amount: number = 1) => {
    const confirmMessage = removeAll 
      ? 'Are you sure you want to remove all these credits?' 
      : `Are you sure you want to remove ${amount} credit(s)?`;
    
    if (!confirm(confirmMessage)) return;

    try {
      const response = await fetch(
        `/api/admin/users/${userId}/credits?creditsId=${creditId}&amount=${amount}&all=${removeAll}`,
        { method: 'DELETE' }
      );
      
      const data = await response.json();
      if (response.ok) {
        toast.success(data.message || 'Credits removed successfully');
        fetchCredits();
      } else {
        toast.error(data.error || 'Failed to remove credits');
      }
    } catch (error) {
      toast.error('Failed to remove credits');
      console.error('Error removing credits:', error);
    }
  };

  const resetForm = () => {
    setSelectedCreditType('lesson');
    setSelectedLessonType('');
    setSelectedHandledarSession('');
    setCreditAmount(1);
  };

  const getCreditDisplayName = (credit: Credit) => {
    if (credit.creditType === 'lesson') {
      return credit.lessonTypeName || 'Unknown Lesson Type';
    } else {
      return credit.handledarSessionTitle || 'Unknown Handledar Session';
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-blue-500" />
          Hantera Krediter
        </h3>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Lägg till krediter
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="text-gray-500">Laddar krediter...</div>
        </div>
      ) : credits.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <CreditCard className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>Inga krediter hittades för denna användare</p>
        </div>
      ) : (
        <div className="space-y-4">
          {credits.map((credit) => (
            <div
              key={credit.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {credit.creditType === 'lesson' ? (
                    <BookOpen className="w-5 h-5 text-green-500" />
                  ) : (
                    <Users className="w-5 h-5 text-purple-500" />
                  )}
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {getCreditDisplayName(credit)}
                    </h4>
                    <p className="text-sm text-gray-500 capitalize">
                      {credit.creditType === 'lesson' ? 'Körlektioner' : 'Handledarlektioner'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  {editingCredit?.id === credit.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        value={credit.creditsRemaining}
                        onChange={(e) => {
                          const newValue = parseInt(e.target.value) || 0;
                          setCredits(credits.map(c => 
                            c.id === credit.id 
                              ? { ...c, creditsRemaining: newValue }
                              : c
                          ));
                        }}
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                      />
                      <button
                        onClick={() => handleUpdateCredit(credit.id, credit.creditsRemaining)}
                        className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                      >
                        Spara
                      </button>
                      <button
                        onClick={() => setEditingCredit(null)}
                        className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600"
                      >
                        Avbryt
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-blue-600">
                          {credit.creditsRemaining}
                        </div>
                        <div className="text-sm text-gray-500">
                          av {credit.creditsTotal} totalt
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditingCredit(credit)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                          title="Redigera"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRemoveCredit(credit.id, false, 1)}
                          className="p-2 text-orange-600 hover:bg-orange-50 rounded"
                          title="Ta bort 1 kredit"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRemoveCredit(credit.id, true)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                          title="Ta bort alla krediter"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Credit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h4 className="text-lg font-semibold mb-4">Lägg till krediter</h4>
            
            <div className="space-y-4">
              {/* Credit Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Typ av krediter
                </label>
                <select
                  value={selectedCreditType}
                  onChange={(e) => setSelectedCreditType(e.target.value as 'lesson' | 'handledar')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="lesson">Körlektioner</option>
                  <option value="handledar">Handledarlektioner</option>
                </select>
              </div>

              {/* Lesson Type Selection - only show for lesson credits */}
              {selectedCreditType === 'lesson' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lektionstyp
                  </label>
                  <select
                    value={selectedLessonType}
                    onChange={(e) => setSelectedLessonType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Välj lektionstyp</option>
                    {lessonTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name} ({type.durationMinutes} min - {type.price} kr)
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              {/* Info text for handledar credits */}
              {selectedCreditType === 'handledar' && (
                <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
                  <p className="text-sm text-blue-700">
                    <strong>Generiska handledarkrediter:</strong> Dessa krediter kan användas för alla typer av handledarutbildning.
                  </p>
                </div>
              )}

              {/* Credit Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Antal krediter
                </label>
                <input
                  type="number"
                  min="1"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
              >
                Avbryt
              </button>
              <button
                onClick={handleAddCredit}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Lägg till
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserCreditsManager;
