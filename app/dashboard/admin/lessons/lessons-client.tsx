'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import NewLessonTypePopover from '@/components/NewLessonTypePopover';
import PackageBuilderPopover from '@/components/PackageBuilderPopover';
import {
  BookOpen,
  Package,
  Pencil,
  CheckSquare,
  XSquare,
  Edit3,
  Trash2,
  Archive,
  X,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

// Import PackageContent type for compatibility
interface PackageContent {
  id: string;
  lessonTypeId?: string;
  handledarSessionId?: string;
  credits: number;
  contentType: 'lesson' | 'handledar' | 'text';
  freeText?: string;
  hasChanges?: boolean;
  sortOrder?: number;
}

interface Lesson {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  price: string;
  priceStudent: string | null;
  salePrice: string | null;
  isActive: boolean;
  bookingCount: number;
}

interface Package {
  id: string;
  name: string;
  description?: string;
  price: string;
  priceStudent?: string;
  salePrice?: string;
  isActive: boolean;
  purchaseCount: number;
  contents: PackageContent[]; // Make required to match PackageBuilderPopover
}

interface LessonStats {
  totalLessons: number;
  activeLessons: number;
  totalPackages: number;
  activePackages: number;
}

interface LessonsClientProps {
  lessons: Lesson[];
  packages: Package[];
  handledarSessions: { id: string; title: string; isActive: boolean; }[];
  stats: LessonStats;
}

export default function LessonsClient({ lessons, packages, handledarSessions, stats }: LessonsClientProps) {
  const [showActive, setShowActive] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isNewLessonPopoverOpen, setIsNewLessonPopoverOpen] = useState(false);
  const [isNewPackagePopoverOpen, setIsNewPackagePopoverOpen] = useState(false);
  const [isEditPackagePopoverOpen, setIsEditPackagePopoverOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [deleteLessonTarget, setDeleteLessonTarget] = useState<Lesson | null>(null);
  const [deletePackageTarget, setDeletePackageTarget] = useState<Package | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    durationMinutes: 60,
    price: '',
    priceStudent: '',
    salePrice: '',
    isActive: true,
  });

  const filteredLessons = lessons ? lessons.filter(l => l.isActive === showActive) : [];
  const filteredPackages = packages ? packages.filter(p => p.isActive === showActive) : [];

  const openEditDialog = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setFormData({
      name: lesson.name,
      description: lesson.description || '',
      durationMinutes: lesson.durationMinutes,
      price: lesson.price,
      priceStudent: lesson.priceStudent || '',
      salePrice: lesson.salePrice || '',
      isActive: lesson.isActive,
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLesson) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/lesson-types/${selectedLesson.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          durationMinutes: formData.durationMinutes,
          price: formData.price,
          priceStudent: formData.priceStudent || null,
          salePrice: formData.salePrice || null,
          isActive: formData.isActive,
        }),
      });

      if (response.ok) {
        toast.success('Lesson type updated successfully');
        setIsEditDialogOpen(false);
        // Refresh page to show updates
        window.location.reload();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update lesson type');
      }
    } catch (error) {
      toast.error('Failed to update lesson type');
      console.error('Error updating lesson type:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteLesson = (lesson: Lesson) => {
    setDeleteLessonTarget(lesson);
  };

  const confirmDeleteLesson = async () => {
    if (!deleteLessonTarget) return;
    const lesson = deleteLessonTarget;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/lesson-types/${lesson.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(result.message || 'Lektionstypen har behandlats');
        // Refresh page to show updates
        window.location.reload();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Kunde inte behandla lektionstypen');
      }
    } catch (error) {
      toast.error('Ett fel uppstod vid borttagning/arkivering');
      console.error('Fel vid behandling av lektionstyp:', error);
    } finally {
      setIsLoading(false);
      setDeleteLessonTarget(null);
    }
  };

  const handleEditPackage = (pkg: Package) => {
    setSelectedPackage(pkg);
    setIsEditPackagePopoverOpen(true);
  };

  const handleDeletePackage = (pkg: Package) => {
    setDeletePackageTarget(pkg);
  };

  const confirmDeletePackage = async () => {
    if (!deletePackageTarget) return;
    const pkg = deletePackageTarget;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/packages?id=${pkg.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(result.message || 'Paketet har behandlats');
        // Refresh page to show updates
        window.location.reload();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Kunde inte behandla paketet');
      }
    } catch (error) {
      toast.error('Ett fel uppstod vid borttagning/arkivering');
      console.error('Fel vid behandling av paket:', error);
    } finally {
      setIsLoading(false);
      setDeletePackageTarget(null);
    }
  };

  return (
    <div className="text-slate-100">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2 text-white drop-shadow-sm">
          <BookOpen className="w-8 h-8 text-sky-300" /> Lektioner &amp; Paket
        </h1>

        <div className="flex gap-3">
          <button
            onClick={() => setIsNewLessonPopoverOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-colors"
          >
            <BookOpen className="w-4 h-4" /> Ny Lektionstyp
          </button>
          <button
            onClick={() => setIsNewPackagePopoverOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-colors"
          >
            <Package className="w-4 h-4" /> Nytt Paket
          </button>
        </div>
      </div>

      <div className="mb-4">
        <button
          onClick={() => setShowActive(!showActive)}
          className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-colors"
        >
          {showActive ? 'Visa Inaktiva' : 'Visa Aktiva'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredLessons.map(lesson => (
          <div key={lesson.id} className="rounded-2xl p-4 bg-white/10 backdrop-blur-md border border-white/20 text-white">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-white">
                <BookOpen className="w-5 h-5 text-sky-300" /> {lesson.name}
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => openEditDialog(lesson)}
                  className="p-1 rounded bg-white/10 hover:bg-white/20 border border-white/20 text-white"
                  title="Edit lesson"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteLesson(lesson)}
                  className="p-1 rounded bg-rose-600/80 hover:bg-rose-600 text-white"
                  title={lesson.bookingCount > 0 ? 'Arkivera lektion' : 'Radera lektion'}
                >
                  {lesson.bookingCount > 0 ? <Archive className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <p className="text-slate-300 mb-2">{lesson.description}</p>
            <div className="flex justify-between items-center text-sm text-slate-200">
              <div>
                <span>Pris: {lesson.price} SEK</span>
                {lesson.salePrice && <span className="ml-2 text-green-300">({lesson.salePrice} SEK på rea)</span>}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-300">{lesson.durationMinutes} min</span>
                {lesson.bookingCount > 0 && (
                  <span className="text-xs bg-white/10 text-white px-2 py-1 rounded border border-white/20">
                    {lesson.bookingCount} bokningar
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

{/* Edit Lesson Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="w-full max-w-lg p-0 overflow-hidden border-0 bg-transparent shadow-none">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <BookOpen className="w-6 h-6 text-sky-400" />
                  <h3 className="text-lg font-semibold text-white">Redigera Lektionstyp</h3>
                </div>
                <button
                  onClick={() => setIsEditDialogOpen(false)}
                  className="text-white/70 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <p className="text-slate-300 mb-6">
                Gör ändringar i lektionstypens egenskaper. Klicka spara när du är klar.
              </p>
              
              <form onSubmit={handleSaveLesson} className="space-y-4">
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="name" className="block text-white font-medium mb-2">Namn</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="w-full px-4 py-2 bg-white/5 border border-white/20 text-white rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 placeholder:text-white/50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description" className="block text-white font-medium mb-2">Beskrivning</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 bg-white/5 border border-white/20 text-white rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 resize-none placeholder:text-white/50"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="duration" className="block text-white font-medium mb-2">Längd (minuter)</Label>
                      <Input
                        id="duration"
                        type="number"
                        value={formData.durationMinutes}
                        onChange={(e) => setFormData({ ...formData, durationMinutes: parseInt(e.target.value) })}
                        required
                        min="1"
                        className="w-full px-4 py-2 bg-white/5 border border-white/20 text-white rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                      />
                    </div>
                    <div>
                      <Label htmlFor="price" className="block text-white font-medium mb-2">Pris (SEK)</Label>
                      <Input
                        id="price"
                        type="number"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        required
                        min="0"
                        className="w-full px-4 py-2 bg-white/5 border border-white/20 text-white rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="priceStudent" className="block text-white font-medium mb-2">Studentpris (SEK)</Label>
                      <Input
                        id="priceStudent"
                        type="number"
                        value={formData.priceStudent}
                        onChange={(e) => setFormData({ ...formData, priceStudent: e.target.value })}
                        min="0"
                        className="w-full px-4 py-2 bg-white/5 border border-white/20 text-white rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                      />
                    </div>
                    <div>
                      <Label htmlFor="salePrice" className="block text-white font-medium mb-2">Reapris (SEK)</Label>
                      <Input
                        id="salePrice"
                        type="number"
                        value={formData.salePrice}
                        onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                        min="0"
                        className="w-full px-4 py-2 bg-white/5 border border-white/20 text-white rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="rounded border-white/20 text-sky-500 focus:ring-sky-500 bg-white/5"
                    />
                    <Label htmlFor="isActive" className="text-white font-medium">Aktiv</Label>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex gap-3 justify-end pt-4">
                  <Button 
                    type="button" 
                    onClick={() => setIsEditDialogOpen(false)}
                    className="px-4 py-2 text-white border border-white/20 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    Avbryt
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isLoading ? 'Sparar...' : 'Spara ändringar'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Lesson Type Popover */}
      {isNewLessonPopoverOpen && (
        <NewLessonTypePopover
          onClose={() => setIsNewLessonPopoverOpen(false)}
          onSave={(lessonType) => {
            // Refresh page to show new lesson type
            window.location.reload();
          }}
        />
      )}

      {/* New Package Popover */}
      {isNewPackagePopoverOpen && (
        <PackageBuilderPopover
          lessonTypes={lessons ? lessons.map(l => ({ id: l.id, name: l.name, isActive: l.isActive })) : []}
          handledarSessions={handledarSessions}
          onClose={() => setIsNewPackagePopoverOpen(false)}
          onSave={async (packageData) => {
            try {
              const response = await fetch('/api/admin/packages', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(packageData),
              });

              if (response.ok) {
                toast.success('Paket skapat!');
                // Refresh page to show new package
                window.location.reload();
              } else {
                const error = await response.json();
                toast.error(error.error || 'Fel vid skapande av paket');
              }
            } catch (error) {
              console.error('Error creating package:', error);
              toast.error('Fel vid skapande av paket');
            }
          }}
        />
      )}

      {/* Edit Package Popover */}
      {isEditPackagePopoverOpen && selectedPackage && (
        <PackageBuilderPopover
          lessonTypes={lessons ? lessons.map(l => ({ id: l.id, name: l.name, isActive: l.isActive })) : []}
          handledarSessions={handledarSessions}
          initialPackage={selectedPackage}
          onClose={() => {
            setIsEditPackagePopoverOpen(false);
            setSelectedPackage(null);
          }}
          onSave={(packageData) => {
            // Refresh page to show updated package
            window.location.reload();
          }}
          onUpdate={async (packageData) => {
            try {
              const response = await fetch('/api/admin/packages', {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(packageData),
              });

              if (response.ok) {
                toast.success('Paket uppdaterat!');
                // Refresh page to show updated package
                window.location.reload();
              } else {
                const error = await response.json();
                toast.error(error.error || 'Fel vid uppdatering av paket');
              }
            } catch (error) {
              console.error('Error updating package:', error);
              toast.error('Fel vid uppdatering av paket');
            }
          }}
        />
      )}

      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4 text-white drop-shadow-sm">Paket</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPackages.map(pkg => (
            <div key={pkg.id} className="rounded-2xl p-4 bg-white/10 backdrop-blur-md border border-white/20 text-white">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-white">
                  <Package className="w-5 h-5 text-sky-300" /> {pkg.name}
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditPackage(pkg)}
                    className="p-1 rounded bg-white/10 hover:bg-white/20 border border-white/20 text-white"
                    title="Edit package"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeletePackage(pkg)}
                    className="p-1 rounded bg-rose-600/80 hover:bg-rose-600 text-white"
                    title={pkg.purchaseCount > 0 ? 'Arkivera paket' : 'Radera paket'}
                  >
                    {pkg.purchaseCount > 0 ? <Archive className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <p className="text-slate-300 mb-2">{pkg.description}</p>
              <div className="flex justify-between items-center text-sm">
                <div>
                  <span>Pris: {pkg.price} SEK</span>
                  {pkg.salePrice && <span className="ml-2 text-green-300">({pkg.salePrice} SEK på rea)</span>}
                </div>
                <div className="flex items-center gap-2">
                  {pkg.purchaseCount > 0 && (
                    <span className="text-xs bg-white/10 text-white px-2 py-1 rounded border border-white/20">
                      {pkg.purchaseCount} köp
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Delete Lesson Confirm Dialog */}
      <Dialog open={!!deleteLessonTarget} onOpenChange={(open) => !open && setDeleteLessonTarget(null)}>
        <DialogContent className="w-full max-w-md p-0 overflow-hidden border-0 bg-transparent shadow-none">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Trash2 className="w-6 h-6 text-rose-400" />
                  <h3 className="text-lg font-semibold text-white">Bekräfta {deleteLessonTarget && deleteLessonTarget.bookingCount > 0 ? 'arkivering' : 'radering'}</h3>
                </div>
                <button onClick={() => setDeleteLessonTarget(null)} className="text-white/70 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-slate-300 mb-6">
                {deleteLessonTarget && deleteLessonTarget.bookingCount > 0
                  ? `Lektionstypen har ${deleteLessonTarget.bookingCount} bokning(ar). Den kommer att arkiveras för att bevara historik. Vill du fortsätta?`
                  : `Vill du radera "${deleteLessonTarget?.name}"? Detta kan inte ångras.`}
              </p>
              <div className="flex gap-3 justify-end">
                <Button onClick={() => setDeleteLessonTarget(null)} className="px-4 py-2 text-white border border-white/20 hover:bg-white/10 rounded-lg">Avbryt</Button>
                <Button onClick={confirmDeleteLesson} disabled={isLoading} className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg disabled:opacity-50">
                  {isLoading ? 'Bearbetar...' : (deleteLessonTarget && deleteLessonTarget.bookingCount > 0 ? 'Arkivera' : 'Radera')}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Package Confirm Dialog */}
      <Dialog open={!!deletePackageTarget} onOpenChange={(open) => !open && setDeletePackageTarget(null)}>
        <DialogContent className="w-full max-w-md p-0 overflow-hidden border-0 bg-transparent shadow-none">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Trash2 className="w-6 h-6 text-rose-400" />
                  <h3 className="text-lg font-semibold text-white">Bekräfta {deletePackageTarget && deletePackageTarget.purchaseCount > 0 ? 'arkivering' : 'radering'}</h3>
                </div>
                <button onClick={() => setDeletePackageTarget(null)} className="text-white/70 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-slate-300 mb-6">
                {deletePackageTarget && deletePackageTarget.purchaseCount > 0
                  ? `Paketet har ${deletePackageTarget.purchaseCount} köp. Det kommer att arkiveras för att bevara historik. Vill du fortsätta?`
                  : `Vill du radera "${deletePackageTarget?.name}"? Detta kommer även att ta bort paketets innehåll och kan inte ångras.`}
              </p>
              <div className="flex gap-3 justify-end">
                <Button onClick={() => setDeletePackageTarget(null)} className="px-4 py-2 text-white border border-white/20 hover:bg-white/10 rounded-lg">Avbryt</Button>
                <Button onClick={confirmDeletePackage} disabled={isLoading} className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg disabled:opacity-50">
                  {isLoading ? 'Bearbetar...' : (deletePackageTarget && deletePackageTarget.purchaseCount > 0 ? 'Arkivera' : 'Radera')}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <div className="flex gap-4 mt-8">
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20">
          <span className="text-lg font-semibold">Totalt Lektioner</span>
          <span className="text-2xl font-bold text-sky-300">{stats.totalLessons}</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20">
          <span className="text-lg font-semibold">Aktiva Lektioner</span>
          <span className="text-2xl font-bold text-sky-300">{stats.activeLessons}</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20">
          <span className="text-lg font-semibold">Totalt Paket</span>
          <span className="text-2xl font-bold text-sky-300">{stats.totalPackages}</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20">
          <span className="text-lg font-semibold">Aktiva Paket</span>
          <span className="text-2xl font-bold text-sky-300">{stats.activePackages}</span>
        </div>
      </div>
    </div>
  );
}

