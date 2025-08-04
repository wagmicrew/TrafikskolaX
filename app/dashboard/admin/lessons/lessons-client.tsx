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
  description: string | null;
  price: string;
  priceStudent: string | null;
  salePrice: string | null;
  isActive: boolean;
  purchaseCount: number;
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
  stats: LessonStats;
}

export default function LessonsClient({ lessons, packages, stats }: LessonsClientProps) {
  const [showActive, setShowActive] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isNewLessonPopoverOpen, setIsNewLessonPopoverOpen] = useState(false);
  const [isNewPackagePopoverOpen, setIsNewPackagePopoverOpen] = useState(false);
  const [isEditPackagePopoverOpen, setIsEditPackagePopoverOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
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

  const handleDeleteLesson = async (lesson: Lesson) => {
    const hasBookings = lesson.bookingCount > 0;
    const confirmMessage = hasBookings
      ? `This lesson type has ${lesson.bookingCount} booking(s). It will be archived instead of deleted to preserve booking history. Continue?`
      : `Are you sure you want to delete "${lesson.name}"? This action cannot be undone.`;

    if (!confirm(confirmMessage)) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/lesson-types/${lesson.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(result.message || 'Lesson type processed successfully');
        // Refresh page to show updates
        window.location.reload();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to process lesson type');
      }
    } catch (error) {
      toast.error('Failed to process lesson type');
      console.error('Error processing lesson type:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditPackage = (pkg: Package) => {
    setSelectedPackage(pkg);
    setIsEditPackagePopoverOpen(true);
  };

  const handleDeletePackage = async (pkg: Package) => {
    const hasPurchases = pkg.purchaseCount > 0;
    const confirmMessage = hasPurchases
      ? `This package has ${pkg.purchaseCount} purchase(s). It will be archived instead of deleted to preserve purchase history. Continue?`
      : `Are you sure you want to delete "${pkg.name}"? This will also delete all package contents. This action cannot be undone.`;

    if (!confirm(confirmMessage)) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/packages?id=${pkg.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(result.message || 'Package processed successfully');
        // Refresh page to show updates
        window.location.reload();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to process package');
      }
    } catch (error) {
      toast.error('Failed to process package');
      console.error('Error processing package:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <BookOpen className="w-8 h-8 text-blue-600" /> Lektioner &amp; Paket
        </h1>

        <div className="flex gap-3">
          <button
            onClick={() => setIsNewLessonPopoverOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <BookOpen className="w-4 h-4" /> Ny Lektionstyp
          </button>
          <button
            onClick={() => setIsNewPackagePopoverOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Package className="w-4 h-4" /> Nytt Paket
          </button>
        </div>
      </div>

      <div className="mb-4">
        <button
          onClick={() => setShowActive(!showActive)}
          className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
        >
          {showActive ? 'Visa Inaktiva' : 'Visa Aktiva'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredLessons.map(lesson => (
          <div key={lesson.id} className="bg-white rounded-xl shadow-md p-4">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-500" /> {lesson.name}
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => openEditDialog(lesson)}
                  className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                  title="Edit lesson"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteLesson(lesson)}
                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                  title={lesson.bookingCount > 0 ? 'Archive lesson' : 'Delete lesson'}
                >
                  {lesson.bookingCount > 0 ? <Archive className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <p className="text-gray-600 mb-2">{lesson.description}</p>
            <div className="flex justify-between items-center text-sm">
              <div>
                <span>Pris: {lesson.price} SEK</span>
                {lesson.salePrice && <span className="ml-2 text-green-500">({lesson.salePrice} SEK på rea)</span>}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">{lesson.durationMinutes} min</span>
                {lesson.bookingCount > 0 && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
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
          {/* Glassmorphism style */}
          <div className="dialog-glassmorphism relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 via-transparent to-blue-500/20 rounded-xl"></div>
            <div className="relative z-10 p-6 sm:p-8">
            <DialogHeader>
                <DialogTitle className="text-xl font-bold text-white drop-shadow-lg">Redigera Lektionstyp</DialogTitle>
                <DialogDescription className="text-white/80 drop-shadow-sm">
                  Gör ändringar i lektionstypens egenskaper. Klicka spara när du är klar.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSaveLesson} className="space-y-4">
                <div className="grid gap-4">
              <div>
                <Label htmlFor="name" className="text-white font-medium drop-shadow-sm">Namn</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="bg-white/10 backdrop-blur-sm border border-white/30 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/50 transition-all duration-200 rounded-lg"
                />
              </div>
              <div>
                <Label htmlFor="description" className="text-white font-medium drop-shadow-sm">Beskrivning</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="bg-white/10 backdrop-blur-sm border border-white/30 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/50 transition-all duration-200 rounded-lg resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="duration" className="text-white font-medium drop-shadow-sm">Längd (minuter)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={formData.durationMinutes}
                    onChange={(e) => setFormData({ ...formData, durationMinutes: parseInt(e.target.value) })}
                    required
                    min="1"
                    className="bg-white/10 backdrop-blur-sm border border-white/30 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/50 transition-all duration-200 rounded-lg"
                  />
                </div>
                <div>
                  <Label htmlFor="price" className="text-white font-medium drop-shadow-sm">Pris (SEK)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                    min="0"
                    className="bg-white/10 backdrop-blur-sm border border-white/30 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/50 transition-all duration-200 rounded-lg"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="priceStudent" className="text-white font-medium drop-shadow-sm">Studentpris (SEK)</Label>
                  <Input
                    id="priceStudent"
                    type="number"
                    value={formData.priceStudent}
                    onChange={(e) => setFormData({ ...formData, priceStudent: e.target.value })}
                    min="0"
                    className="bg-white/10 backdrop-blur-sm border border-white/30 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/50 transition-all duration-200 rounded-lg"
                  />
                </div>
                <div>
                  <Label htmlFor="salePrice" className="text-white font-medium drop-shadow-sm">Reapris (SEK)</Label>
                  <Input
                    id="salePrice"
                    type="number"
                    value={formData.salePrice}
                    onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                    min="0"
                    className="bg-white/10 backdrop-blur-sm border border-white/30 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/50 transition-all duration-200 rounded-lg"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="isActive" className="text-white font-medium drop-shadow-sm">Aktiv</Label>
              </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Avbryt
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Sparar...' : 'Spara ändringar'}
                </Button>
              </DialogFooter>
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
          lessonTypes={lessons ? lessons.map(l => ({ id: l.id, name: l.name })) : []}
          onClose={() => setIsNewPackagePopoverOpen(false)}
          onSave={(packageData) => {
            // Refresh page to show new package
            window.location.reload();
          }}
        />
      )}

      {/* Edit Package Popover */}
      {isEditPackagePopoverOpen && selectedPackage && (
        <PackageBuilderPopover
          lessonTypes={lessons ? lessons.map(l => ({ id: l.id, name: l.name })) : []}
          initialPackage={selectedPackage}
          onClose={() => {
            setIsEditPackagePopoverOpen(false);
            setSelectedPackage(null);
          }}
          onSave={(packageData) => {
            // Refresh page to show updated package
            window.location.reload();
          }}
        />
      )}

      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Paket</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPackages.map(pkg => (
            <div key={pkg.id} className="bg-white rounded-xl shadow-md p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Package className="w-5 h-5 text-indigo-500" /> {pkg.name}
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditPackage(pkg)}
                    className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                    title="Edit package"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeletePackage(pkg)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                    title={pkg.purchaseCount > 0 ? 'Archive package' : 'Delete package'}
                  >
                    {pkg.purchaseCount > 0 ? <Archive className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <p className="text-gray-600 mb-2">{pkg.description}</p>
              <div className="flex justify-between items-center text-sm">
                <div>
                  <span>Pris: {pkg.price} SEK</span>
                  {pkg.salePrice && <span className="ml-2 text-green-500">({pkg.salePrice} SEK på rea)</span>}
                </div>
                <div className="flex items-center gap-2">
                  {pkg.purchaseCount > 0 && (
                    <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                      {pkg.purchaseCount} köp
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-4 mt-8">
        <div className="flex items-center gap-2 px-4 py-3 border rounded-lg">
          <span className="text-lg font-semibold">Totalt Lektioner</span>
          <span className="text-2xl font-bold text-blue-600">{stats.totalLessons}</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-3 border rounded-lg">
          <span className="text-lg font-semibold">Aktiva Lektioner</span>
          <span className="text-2xl font-bold text-blue-600">{stats.activeLessons}</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-3 border rounded-lg">
          <span className="text-lg font-semibold">Totalt Paket</span>
          <span className="text-2xl font-bold text-blue-600">{stats.totalPackages}</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-3 border rounded-lg">
          <span className="text-lg font-semibold">Aktiva Paket</span>
          <span className="text-2xl font-bold text-blue-600">{stats.activePackages}</span>
        </div>
      </div>
    </div>
  );
}

