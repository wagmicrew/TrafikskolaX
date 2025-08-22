"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import toast from 'react-hot-toast';
import {
  Plus,
  Edit3,
  Trash2,
  Save,
  BookOpen,
  Users,
  Clock,
  DollarSign
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
  createdAt: string;
  updatedAt: string;
}

interface LessonTypeFormData {
  name: string;
  description: string;
  allowsSupervisors: boolean;
  price: string;
  pricePerSupervisor: string;
  durationMinutes: string;
  maxParticipants: string;
  isActive: boolean;
  sortOrder: string;
}

export default function TeoriLessonTypesPage() {
  const [lessonTypes, setLessonTypes] = useState<TeoriLessonType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<TeoriLessonType | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TeoriLessonType | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [formData, setFormData] = useState<LessonTypeFormData>({
    name: '',
    description: '',
    allowsSupervisors: false,
    price: '',
    pricePerSupervisor: '',
    durationMinutes: '60',
    maxParticipants: '1',
    isActive: true,
    sortOrder: '0'
  });

  // Load lesson types
  const loadLessonTypes = async () => {
    try {
      const response = await fetch('/api/admin/teori-lesson-types');
      if (response.ok) {
        const data = await response.json();
        setLessonTypes(data.lessonTypes);
      } else {
        toast.error('Kunde inte ladda teorilektionstyper', {
          style: {
            background: '#ef4444',
            color: '#fff',
            border: '1px solid #dc2626'
          },
          icon: '❌'
        });
      }
    } catch (error) {
      console.error('Error loading lesson types:', error);
      toast.error('Kunde inte ladda teorilektionstyper', {
        style: {
          background: '#ef4444',
          color: '#fff',
          border: '1px solid #dc2626'
        },
        icon: '❌'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLessonTypes();
  }, []);

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      allowsSupervisors: false,
      price: '',
      pricePerSupervisor: '',
      durationMinutes: '60',
      maxParticipants: '1',
      isActive: true,
      sortOrder: '0'
    });
    setEditingType(null);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = editingType
        ? `/api/admin/teori-lesson-types/${editingType.id}`
        : '/api/admin/teori-lesson-types';

      const method = editingType ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          allowsSupervisors: formData.allowsSupervisors,
          price: parseFloat(formData.price),
          pricePerSupervisor: formData.allowsSupervisors && formData.pricePerSupervisor
            ? parseFloat(formData.pricePerSupervisor)
            : null,
          durationMinutes: parseInt(formData.durationMinutes),
          maxParticipants: parseInt(formData.maxParticipants),
          isActive: formData.isActive,
          sortOrder: parseInt(formData.sortOrder)
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message, {
          style: {
            background: '#10b981',
            color: '#fff',
            border: '1px solid #059669'
          },
          icon: '✅'
        });
        setIsCreateDialogOpen(false);
        setIsEditDialogOpen(false);
        resetForm();
        loadLessonTypes();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Ett fel uppstod', {
          style: {
            background: '#ef4444',
            color: '#fff',
            border: '1px solid #dc2626'
          },
          icon: '❌'
        });
      }
    } catch (error) {
      console.error('Error saving lesson type:', error);
      toast.error('Kunde inte spara teorilektionstyp', {
        style: {
          background: '#ef4444',
          color: '#fff',
          border: '1px solid #dc2626'
        },
        icon: '❌'
      });
    } finally {
      setSaving(false);
    }
  };

  // Handle delete confirmation
  const handleDeleteClick = (lessonType: TeoriLessonType) => {
    setDeleteTarget(lessonType);
    setIsDeleteDialogOpen(true);
  };

  // Handle delete
  const confirmDelete = async () => {
    if (!deleteTarget) return;

    const lessonType = deleteTarget;
    try {
      const response = await fetch(`/api/admin/teori-lesson-types/${lessonType.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message, {
          style: {
            background: '#10b981',
            color: '#fff',
            border: '1px solid #059669'
          },
          icon: '✅'
        });
        loadLessonTypes();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Kunde inte radera teorilektionstyp', {
          style: {
            background: '#ef4444',
            color: '#fff',
            border: '1px solid #dc2626'
          },
          icon: '❌'
        });
      }
    } catch (error) {
      console.error('Error deleting lesson type:', error);
      toast.error('Kunde inte radera teorilektionstyp', {
        style: {
          background: '#ef4444',
          color: '#fff',
          border: '1px solid #dc2626'
        },
        icon: '❌'
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setDeleteTarget(null);
    }
  };

  // Handle edit
  const handleEdit = (lessonType: TeoriLessonType) => {
    setEditingType(lessonType);
    setFormData({
      name: lessonType.name,
      description: lessonType.description || '',
      allowsSupervisors: lessonType.allowsSupervisors,
      price: lessonType.price,
      pricePerSupervisor: lessonType.pricePerSupervisor || '',
      durationMinutes: lessonType.durationMinutes.toString(),
      maxParticipants: lessonType.maxParticipants.toString(),
      isActive: lessonType.isActive,
      sortOrder: lessonType.sortOrder.toString()
    });
    setIsEditDialogOpen(true);
  };

  // Handle dialog close
  const handleDialogClose = () => {
    setIsCreateDialogOpen(false);
    setIsEditDialogOpen(false);
    resetForm();
  };

  return (
    <div className="text-slate-100">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2 text-white drop-shadow-sm">
          <BookOpen className="w-8 h-8 text-emerald-300" /> Teori Lektionstyper
        </h1>

        <div className="flex gap-3">
          <button
            onClick={() => setIsCreateDialogOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-colors"
          >
            <Plus className="w-4 h-4" /> Skapa Teorilektionstyp
          </button>
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="bg-slate-900/95 backdrop-blur-md border border-white/20 text-white max-w-2xl">
          <DialogHeader className="border-b border-white/10 pb-4">
            <DialogTitle className="text-xl font-semibold text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-400" />
              Skapa Ny Teorilektionstyp
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { setEditingType(null); handleSubmit(e); }} className="space-y-6 p-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="create-name" className="text-sm font-medium text-slate-300 mb-2 block">Namn *</Label>
                <Input
                  id="create-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="t.ex. Riskettan Teori"
                  className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:border-emerald-400"
                  required
                />
              </div>
              <div>
                <Label htmlFor="create-sortOrder" className="text-sm font-medium text-slate-300 mb-2 block">Sorteringsordning</Label>
                <Input
                  id="create-sortOrder"
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: e.target.value })}
                  placeholder="0"
                  className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:border-emerald-400"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="create-description" className="text-sm font-medium text-slate-300 mb-2 block">Beskrivning</Label>
              <Textarea
                id="create-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Beskrivning av denna teorilektionstyp..."
                rows={3}
                className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:border-emerald-400 resize-none"
              />
            </div>

            <div className="flex items-center space-x-3 p-4 rounded-lg bg-white/5 border border-white/10">
              <Switch
                id="create-allowsSupervisors"
                checked={formData.allowsSupervisors}
                onCheckedChange={(checked) => setFormData({ ...formData, allowsSupervisors: checked })}
                className="data-[state=checked]:bg-emerald-500"
              />
              <div>
                <Label htmlFor="create-allowsSupervisors" className="text-sm font-medium text-white cursor-pointer">Tillåt handledare/supervisorer</Label>
                <p className="text-xs text-slate-400 mt-1">Aktivera för att tillåta supervisors att delta i lektionen</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="create-price" className="text-sm font-medium text-slate-300 mb-2 block">Pris (SEK) *</Label>
                <Input
                  id="create-price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="500.00"
                  className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:border-emerald-400"
                  required
                />
              </div>
              {formData.allowsSupervisors && (
                <div>
                  <Label htmlFor="create-pricePerSupervisor" className="text-sm font-medium text-slate-300 mb-2 block">Pris per Handledare (SEK)</Label>
                  <Input
                    id="create-pricePerSupervisor"
                    type="number"
                    step="0.01"
                    value={formData.pricePerSupervisor}
                    onChange={(e) => setFormData({ ...formData, pricePerSupervisor: e.target.value })}
                    placeholder="500.00"
                    className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:border-emerald-400"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="create-durationMinutes" className="text-sm font-medium text-slate-300 mb-2 block">Varaktighet (minuter)</Label>
                <Input
                  id="create-durationMinutes"
                  type="number"
                  value={formData.durationMinutes}
                  onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })}
                  placeholder="60"
                  className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:border-emerald-400"
                />
              </div>
              <div>
                <Label htmlFor="create-maxParticipants" className="text-sm font-medium text-slate-300 mb-2 block">Max Deltagare</Label>
                <Input
                  id="create-maxParticipants"
                  type="number"
                  value={formData.maxParticipants}
                  onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value })}
                  placeholder="1"
                  className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:border-emerald-400"
                />
              </div>
            </div>

            <div className="flex items-center space-x-3 p-4 rounded-lg bg-white/5 border border-white/10">
              <Switch
                id="create-isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                className="data-[state=checked]:bg-emerald-500"
              />
              <div>
                <Label htmlFor="create-isActive" className="text-sm font-medium text-white cursor-pointer">Aktiv</Label>
                <p className="text-xs text-slate-400 mt-1">Aktivera för att göra typen tillgänglig för bokning</p>
              </div>
            </div>

            <DialogFooter className="border-t border-white/10 pt-4 gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
                className="border-white/20 text-white hover:bg-white/10"
              >
                Avbryt
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg hover:shadow-xl"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-slate-900/95 backdrop-blur-md border border-white/20 text-white max-w-2xl">
          <DialogHeader className="border-b border-white/10 pb-4">
            <DialogTitle className="text-xl font-semibold text-white flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-blue-400" />
              Redigera Teorilektionstyp
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6 p-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name" className="text-sm font-medium text-slate-300 mb-2 block">Namn *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="t.ex. Riskettan Teori"
                  className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:border-blue-400"
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-sortOrder" className="text-sm font-medium text-slate-300 mb-2 block">Sorteringsordning</Label>
                <Input
                  id="edit-sortOrder"
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: e.target.value })}
                  placeholder="0"
                  className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:border-blue-400"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-description" className="text-sm font-medium text-slate-300 mb-2 block">Beskrivning</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Beskrivning av denna teorilektionstyp..."
                rows={3}
                className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:border-blue-400 resize-none"
              />
            </div>

            <div className="flex items-center space-x-3 p-4 rounded-lg bg-white/5 border border-white/10">
              <Switch
                id="edit-allowsSupervisors"
                checked={formData.allowsSupervisors}
                onCheckedChange={(checked) => setFormData({ ...formData, allowsSupervisors: checked })}
                className="data-[state=checked]:bg-blue-500"
              />
              <div>
                <Label htmlFor="edit-allowsSupervisors" className="text-sm font-medium text-white cursor-pointer">Tillåt handledare/supervisorer</Label>
                <p className="text-xs text-slate-400 mt-1">Aktivera för att tillåta supervisors att delta i lektionen</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-price" className="text-sm font-medium text-slate-300 mb-2 block">Pris (SEK) *</Label>
                <Input
                  id="edit-price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="500.00"
                  className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:border-blue-400"
                  required
                />
              </div>
              {formData.allowsSupervisors && (
                <div>
                  <Label htmlFor="edit-pricePerSupervisor" className="text-sm font-medium text-slate-300 mb-2 block">Pris per Handledare (SEK)</Label>
                  <Input
                    id="edit-pricePerSupervisor"
                    type="number"
                    step="0.01"
                    value={formData.pricePerSupervisor}
                    onChange={(e) => setFormData({ ...formData, pricePerSupervisor: e.target.value })}
                    placeholder="500.00"
                    className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:border-blue-400"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-durationMinutes" className="text-sm font-medium text-slate-300 mb-2 block">Varaktighet (minuter)</Label>
                <Input
                  id="edit-durationMinutes"
                  type="number"
                  value={formData.durationMinutes}
                  onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })}
                  placeholder="60"
                  className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:border-blue-400"
                />
              </div>
              <div>
                <Label htmlFor="edit-maxParticipants" className="text-sm font-medium text-slate-300 mb-2 block">Max Deltagare</Label>
                <Input
                  id="edit-maxParticipants"
                  type="number"
                  value={formData.maxParticipants}
                  onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value })}
                  placeholder="1"
                  className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:border-blue-400"
                />
              </div>
            </div>

            <div className="flex items-center space-x-3 p-4 rounded-lg bg-white/5 border border-white/10">
              <Switch
                id="edit-isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                className="data-[state=checked]:bg-blue-500"
              />
              <div>
                <Label htmlFor="edit-isActive" className="text-sm font-medium text-white cursor-pointer">Aktiv</Label>
                <p className="text-xs text-slate-400 mt-1">Aktivera för att göra typen tillgänglig för bokning</p>
              </div>
            </div>

            <DialogFooter className="border-t border-white/10 pt-4 gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                className="border-white/20 text-white hover:bg-white/10"
              >
                Avbryt
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-slate-900/95 backdrop-blur-md border border-white/20 text-white max-w-md">
          <DialogHeader className="border-b border-white/10 pb-4">
            <DialogTitle className="text-xl font-semibold text-white flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-400" />
              Radera Teorilektionstyp
            </DialogTitle>
          </DialogHeader>
          <div className="p-6">
            <p className="text-slate-300 mb-4">
              Är du säker på att du vill radera <strong className="text-white">"{deleteTarget?.name}"</strong>?
            </p>
            <p className="text-sm text-slate-400">
              Denna åtgärd kan inte ångras och kommer att ta bort alla relaterade sessioner och bokningar.
            </p>
          </div>
          <DialogFooter className="border-t border-white/10 pt-4 gap-3">
            <Button
              onClick={() => setIsDeleteDialogOpen(false)}
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
            >
              Avbryt
            </Button>
            <Button
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-xl"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Radera
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400 mx-auto mb-4"></div>
            <p className="text-slate-300">Laddar teorilektionstyper...</p>
          </div>
        </div>
      )}

      {/* Lesson Types Grid */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {lessonTypes.map((lessonType) => (
            <div key={lessonType.id} className="rounded-2xl p-6 bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/15 transition-all duration-200">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${lessonType.allowsSupervisors ? 'bg-blue-500/20' : 'bg-emerald-500/20'}`}>
                    <BookOpen className={`w-5 h-5 ${lessonType.allowsSupervisors ? 'text-blue-300' : 'text-emerald-300'}`} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">
                      {lessonType.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      {lessonType.isActive ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Aktiv
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-500/20 text-slate-300 border border-slate-500/30">
                          Inaktiv
                        </span>
                      )}
                      {lessonType.allowsSupervisors && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">
                          Med Handledare
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(lessonType)}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-colors"
                    title="Redigera lektionstyp"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(lessonType)}
                    className="p-2 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-white transition-colors"
                    title="Radera lektionstyp"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {lessonType.description && (
                <p className="text-slate-300 mb-4 text-sm leading-relaxed">
                  {lessonType.description}
                </p>
              )}

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-400" />
                    <span className="text-white font-semibold">{lessonType.price} SEK</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-400" />
                    <span className="text-slate-300 text-sm">{lessonType.durationMinutes} min</span>
                  </div>
                </div>

                {lessonType.allowsSupervisors && lessonType.pricePerSupervisor && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <Users className="w-4 h-4 text-blue-400" />
                    <span className="text-blue-300 text-sm">
                      +{lessonType.pricePerSupervisor} SEK per handledare
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-400" />
                  <span className="text-slate-300 text-sm">
                    Max {lessonType.maxParticipants} deltagare
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && lessonTypes.length === 0 && (
        <div className="text-center py-12">
          <div className="text-slate-400 mb-4">
            <BookOpen className="w-16 h-16 mx-auto mb-4" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">Inga teorilektionstyper än</h3>
          <p className="text-slate-300 mb-6">Skapa din första teorilektionstyp för att komma igång</p>
          <button
            onClick={() => setIsCreateDialogOpen(true)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
          >
            <Plus className="w-5 h-5" />
            Skapa Första Teorilektionstyp
          </button>
        </div>
      )}
    </div>
  );
}