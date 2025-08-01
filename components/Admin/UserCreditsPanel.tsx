"use client";

import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, Edit, Trash2, CreditCard, BookOpen, Users, Save, X } from 'lucide-react';

interface UserCreditsPanelProps {
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
  price: number;
  durationMinutes: number;
}

interface HandledarSession {
  id: string;
  title: string;
  date: string;
  pricePerParticipant: number;
}

const UserCreditsPanel: React.FC<UserCreditsPanelProps> = ({ userId }) => {
  const [credits, setCredits] = useState<Credit[]>([]);
  const [lessonTypes, setLessonTypes] = useState<LessonType[]>([]);
  const [handledarSessions, setHandledarSessions] = useState<HandledarSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCredit, setEditingCredit] = useState<Credit | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    creditType: 'lesson' as 'lesson' | 'handledar',
    selectedItem: '',
    amount: 1
  });

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
    if (formData.creditType === 'lesson' && !formData.selectedItem) {
      toast.error('Please select a lesson type');
      return;
    }
    if (formData.amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}/credits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          creditType: formData.creditType,
          lessonTypeId: formData.creditType === 'lesson' ? formData.selectedItem : null,
          handledarSessionId: formData.creditType === 'handledar' && formData.selectedItem ? formData.selectedItem : null,
          amount: formData.amount,
        }),
      });
      
      const data = await response.json();
      if (response.ok) {
        toast.success(data.message || 'Credits added successfully');
        fetchCredits();
        resetForm();
        setShowAddForm(false);
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

  const handleRemoveCredit = async (creditId: string, removeAll: boolean = false) => {
    const confirmMessage = removeAll 
      ? 'Are you sure you want to remove all these credits?' 
      : 'Are you sure you want to remove this credit entry?';
    
    if (!confirm(confirmMessage)) return;

    try {
      const response = await fetch(
        `/api/admin/users/${userId}/credits?creditsId=${creditId}&all=${removeAll}`,
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
    setFormData({
      creditType: 'lesson',
      selectedItem: '',
      amount: 1
    });
  };

  const getCreditDisplayName = (credit: Credit) => {
    if (credit.creditType === 'lesson') {
      return credit.lessonTypeName || 'Unknown Lesson Type';
    } else {
      return credit.handledarSessionTitle || 'Unknown Handledar Session';
    }
  };

  const getAvailableItems = () => {
    return formData.creditType === 'lesson' ? lessonTypes : handledarSessions;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm mb-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-blue-500" />
          Krediter
        </h3>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Lägg till krediter
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
          <h4 className="text-lg font-medium mb-4">Lägg till nya krediter</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Typ av krediter
              </label>
              <select
                value={formData.creditType}
                onChange={(e) => setFormData({...formData, creditType: e.target.value as 'lesson' | 'handledar', selectedItem: ''})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="lesson">Körlektioner</option>
                <option value="handledar">Handledarlektioner</option>
              </select>
            </div>

            {/* Only show lesson type selection for lesson credits */}
            {formData.creditType === 'lesson' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lektionstyp
                </label>
                <select
                  value={formData.selectedItem}
                  onChange={(e) => setFormData({...formData, selectedItem: e.target.value})}
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
            
            {/* Info for handledar credits */}
            {formData.creditType === 'handledar' && (
              <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
                <p className="text-sm text-blue-700">
                  <strong>Generiska handledarkrediter:</strong> Dessa krediter kan användas för alla typer av handledarutbildning.
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Antal krediter
              </label>
              <input
                type="number"
                min="1"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: parseInt(e.target.value) || 1})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-3 mt-4">
            <button
              onClick={() => {
                setShowAddForm(false);
                resetForm();
              }}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Avbryt
            </button>
            <button
              onClick={handleAddCredit}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Lägg till
            </button>
          </div>
        </div>
      )}

      {/* Credits List */}
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
        <div className="space-y-3">
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
    </div>
  );
};

export default UserCreditsPanel;
