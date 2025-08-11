"use client";

import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, Edit, Trash2, CreditCard, BookOpen, Users, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
    <div className="space-y-4 text-white">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-extrabold drop-shadow flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-sky-300" />
          Krediter
        </h3>
        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-sky-600 hover:bg-sky-500"
        >
          <Plus className="w-4 h-4" />
          Lägg till krediter
        </Button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="mb-2 p-4 rounded-xl bg-white/5 border border-white/10">
          <h4 className="text-lg font-bold mb-4">Lägg till nya krediter</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">
                Typ av krediter
              </label>
              <Select
                value={formData.creditType}
                onValueChange={(value: 'lesson' | 'handledar') =>
                  setFormData({ ...formData, creditType: value, selectedItem: '' })
                }
              >
                <SelectTrigger className="w-full bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Välj typ" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900/90 text-white border-white/10">
                  <SelectItem value="lesson">Körlektioner</SelectItem>
                  <SelectItem value="handledar">Handledarlektioner</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.creditType === 'lesson' && (
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Lektionstyp
                </label>
                <Select
                  value={formData.selectedItem}
                  onValueChange={(value) => setFormData({ ...formData, selectedItem: value })}
                >
                  <SelectTrigger className="w-full bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Välj lektionstyp" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900/90 text-white border-white/10">
                    {lessonTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name} ({type.durationMinutes} min - {type.price} kr)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {formData.creditType === 'handledar' && (
              <div className="bg-white/5 p-3 rounded-md border border-white/10">
                <p className="text-sm text-slate-200">
                  <strong>Generiska handledarkrediter:</strong> Dessa krediter kan användas för alla typer av handledarutbildning.
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">
                Antal krediter
              </label>
              <Input
                type="number"
                min={1}
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseInt(e.target.value) || 1 })}
                className="bg-white/10 border-white/20 text-white placeholder:text-slate-300"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <Button
              onClick={() => {
                setShowAddForm(false);
                resetForm();
              }}
              variant="outline"
              className="bg-white/5 hover:bg-white/10 border-white/20 text-white"
            >
              <X className="w-4 h-4" />
              Avbryt
            </Button>
            <Button onClick={handleAddCredit} className="bg-emerald-600 hover:bg-emerald-500">
              <Save className="w-4 h-4" />
              Lägg till
            </Button>
          </div>
        </div>
      )}

      {/* Credits List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="text-slate-300">Laddar krediter...</div>
        </div>
      ) : credits.length === 0 ? (
        <div className="text-center py-8 text-slate-300">
          <CreditCard className="w-12 h-12 mx-auto mb-4 text-slate-400" />
          <p>Inga krediter hittades för denna användare</p>
        </div>
      ) : (
        <div className="space-y-3">
          {credits.map((credit) => (
            <div
              key={credit.id}
              className="rounded-xl bg-white/5 border border-white/10 p-4 hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {credit.creditType === 'lesson' ? (
                    <BookOpen className="w-5 h-5 text-sky-300" />
                  ) : (
                    <Users className="w-5 h-5 text-fuchsia-300" />
                  )}
                  <div>
                    <h4 className="font-semibold text-white">
                      {getCreditDisplayName(credit)}
                    </h4>
                    <p className="text-sm text-slate-300 capitalize">
                      {credit.creditType === 'lesson' ? 'Körlektioner' : 'Handledarlektioner'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  {editingCredit?.id === credit.id ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={0}
                        value={credit.creditsRemaining}
                        onChange={(e) => {
                          const newValue = parseInt(e.target.value) || 0;
                          setCredits(credits.map(c => 
                            c.id === credit.id 
                              ? { ...c, creditsRemaining: newValue }
                              : c
                          ));
                        }}
                        className="w-24 text-center bg-white/10 border-white/20 text-white"
                      />
                      <Button
                        onClick={() => handleUpdateCredit(credit.id, credit.creditsRemaining)}
                        className="bg-emerald-600 hover:bg-emerald-500"
                      >
                        Spara
                      </Button>
                      <Button
                        onClick={() => setEditingCredit(null)}
                        variant="outline"
                        className="bg-white/5 hover:bg-white/10 border-white/20 text-white"
                      >
                        Avbryt
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="text-right">
                        <div className="text-lg font-bold text-sky-300">
                          {credit.creditsRemaining}
                        </div>
                        <div className="text-sm text-slate-300">
                          av {credit.creditsTotal} totalt
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Button
                          onClick={() => setEditingCredit(credit)}
                          variant="ghost"
                          className="text-sky-300 hover:bg-white/10"
                          title="Redigera"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => handleRemoveCredit(credit.id, true)}
                          variant="ghost"
                          className="text-rose-300 hover:bg-white/10"
                          title="Ta bort alla krediter"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
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
