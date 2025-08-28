'use client';

import { useState, useEffect } from 'react';
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
  Loader2,
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

// Import Flowbite components
import { Alert, Badge, Banner, Card, Modal, Tabs, Table, Spinner, Tooltip } from 'flowbite-react';
import { HiInformationCircle, HiOutlineTicket, HiArchive, HiPlus } from 'react-icons/hi';

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
    <div className="text-gray-900 dark:text-white">
      {/* Flowbite Banner Component */}
      <Banner className="mb-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center">
            <BookOpen className="w-8 h-8 text-blue-500 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Lektioner &amp; Paket</h1>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => setIsNewLessonPopoverOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white border border-blue-600 flex items-center gap-2"
            >
              <HiPlus className="w-4 h-4" /> Ny Lektionstyp
            </Button>
            <Button
              onClick={() => setIsNewPackagePopoverOpen(true)}
              className="bg-green-600 hover:bg-green-700 text-white border border-green-600 flex items-center gap-2"
            >
              <HiPlus className="w-4 h-4" /> Nytt Paket
            </Button>
          </div>
        </div>
      </Banner>

      {/* View Toggle using Flowbite Badge */}
      <div className="mb-6 flex items-center gap-2">
        <Badge
          onClick={() => setShowActive(!showActive)}
          className="cursor-pointer transition-all duration-200"
          color={showActive ? "blue" : "gray"}
          size="lg"
        >
          {showActive ? 'Visa Aktiva' : 'Visa Inaktiva'}
        </Badge>
        <Badge color={showActive ? "blue" : "gray"}>
          {showActive ?
            `Aktiva lektioner: ${stats.activeLessons}` :
            `Inaktiva lektioner: ${stats.totalLessons - stats.activeLessons}`}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredLessons.map(lesson => (
          <Card key={lesson.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-blue-500" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{lesson.name}</h3>
              </div>
              <div className="flex gap-2">
                <Tooltip content="Redigera lektion">
                  <Button
                    onClick={() => openEditDialog(lesson)}
                    size="sm"
                    color="gray"
                  >
                    <Edit3 className="w-4 h-4" />
                  </Button>
                </Tooltip>
                <Tooltip content={lesson.bookingCount > 0 ? 'Arkivera lektion' : 'Radera lektion'}>
                  <Button
                    onClick={() => handleDeleteLesson(lesson)}
                    size="sm"
                    color="failure"
                  >
                    {lesson.bookingCount > 0 ? <HiArchive className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
                  </Button>
                </Tooltip>
              </div>
            </div>

            {lesson.description && (
              <p className="text-gray-600 dark:text-gray-300 mt-2">{lesson.description}</p>
            )}

            <div className="flex flex-wrap justify-between items-center mt-3 gap-2 text-sm">
              <div className="flex items-center gap-3">
                <Badge color="gray">
                  {lesson.durationMinutes} min
                </Badge>
                <span className="text-gray-900 dark:text-white font-semibold">
                  {lesson.price} SEK
                  {lesson.salePrice && (
                    <Badge color="success" className="ml-2">
                      {lesson.salePrice} SEK
                    </Badge>
                  )}
                </span>
              </div>

              {lesson.bookingCount > 0 && (
                <Badge color="blue">
                  {lesson.bookingCount} bokningar
                </Badge>
              )}
            </div>
          </Card>
        ))}
      </div>

{/* Edit Lesson Modal using Flowbite */}
      <Modal
        show={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        size="xl"
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-500" />
            <span className="text-lg font-bold text-gray-900 dark:text-white">Redigera Lektionstyp</span>
          </div>
        </div>
        <div className="p-6 bg-white dark:bg-gray-800">
          <Alert color="info" className="mb-4">
            <div className="flex items-center gap-2">
              <HiInformationCircle className="h-5 w-5" />
              <span>Gör ändringar i lektionstypens egenskaper. Klicka spara när du är klar.</span>
            </div>
          </Alert>
          
          <form onSubmit={handleSaveLesson} className="space-y-4">
            <div className="grid gap-4">
              <div>
                <Label htmlFor="name" className="text-gray-900 dark:text-white font-medium mb-2">Namn</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="description" className="text-gray-900 dark:text-white font-medium mb-2">Beskrivning</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="resize-none"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="duration" className="text-gray-900 dark:text-white font-medium mb-2">Längd (minuter)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={formData.durationMinutes}
                    onChange={(e) => setFormData({ ...formData, durationMinutes: parseInt(e.target.value) })}
                    required
                    min="1"
                  />
                </div>

                <div>
                  <Label htmlFor="price" className="text-gray-900 dark:text-white font-medium mb-2">Pris (SEK)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                    min="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="priceStudent" className="text-gray-900 dark:text-white font-medium mb-2">Studentpris (SEK)</Label>
                  <Input
                    id="priceStudent"
                    type="number"
                    value={formData.priceStudent}
                    onChange={(e) => setFormData({ ...formData, priceStudent: e.target.value })}
                    min="0"
                  />
                </div>

                <div>
                  <Label htmlFor="salePrice" className="text-gray-900 dark:text-white font-medium mb-2">Reapris (SEK)</Label>
                  <Input
                    id="salePrice"
                    type="number"
                    value={formData.salePrice}
                    onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                    min="0"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 bg-white dark:bg-gray-700"
                  />
                  <Label htmlFor="isActive" className="text-gray-900 dark:text-white font-medium">Aktiv</Label>
                </div>
              </div>
            </div>
          </form>
        </div>
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-end gap-3">
          <Button
            onClick={() => setIsEditDialogOpen(false)}
            color="gray"
          >
            Avbryt
          </Button>
          <Button
            onClick={handleSaveLesson}
            disabled={isLoading}
            color="blue"
          >
            {isLoading ? <><Spinner size="sm" className="mr-2" />Sparar...</> : 'Spara ändringar'}
          </Button>
        </div>
      </Modal>

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
        <Banner className="mb-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <Package className="w-7 h-7 text-blue-500 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Paket</h2>
          </div>
        </Banner>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPackages.map(pkg => (
            <Card key={pkg.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <Package className="w-6 h-6 text-blue-500" />
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">{pkg.name}</h3>
                </div>
                <div className="flex gap-2">
                  <Tooltip content="Redigera paket">
                    <Button
                      onClick={() => handleEditPackage(pkg)}
                      size="sm"
                      color="gray"
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>
                  </Tooltip>
                  <Tooltip content={pkg.purchaseCount > 0 ? 'Arkivera paket' : 'Radera paket'}>
                    <Button
                      onClick={() => handleDeletePackage(pkg)}
                      size="sm"
                      color="failure"
                    >
                      {pkg.purchaseCount > 0 ? <Archive className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
                    </Button>
                  </Tooltip>
                </div>
              </div>

              {pkg.description && (
                <p className="text-gray-600 dark:text-gray-300 mt-2">{pkg.description}</p>
              )}

              <div className="flex flex-wrap justify-between items-center mt-3 gap-2 text-sm">
                <div className="flex items-center gap-3">
                  <span className="text-gray-900 dark:text-white font-semibold">
                    {pkg.price} SEK
                    {pkg.salePrice && (
                      <Badge color="success" className="ml-2">
                        {pkg.salePrice} SEK
                      </Badge>
                    )}
                  </span>
                </div>

                {pkg.purchaseCount > 0 && (
                  <Badge color="blue">
                    {pkg.purchaseCount} köp
                  </Badge>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Delete Lesson Confirm Modal */}
      <Modal
        show={!!deleteLessonTarget}
        onClose={() => setDeleteLessonTarget(null)}
        size="md"
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Trash2 className="w-6 h-6 text-red-500" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Bekräfta {deleteLessonTarget && deleteLessonTarget.bookingCount > 0 ? 'arkivering' : 'radering'}</h3>
          </div>
        </div>
        <div className="p-6 bg-white dark:bg-gray-800">
          <Alert color="failure" className="mb-4">
            {deleteLessonTarget && deleteLessonTarget.bookingCount > 0
              ? `Lektionstypen har ${deleteLessonTarget.bookingCount} bokning(ar). Den kommer att arkiveras för att bevara historik. Vill du fortsätta?`
              : `Vill du radera "${deleteLessonTarget?.name}"? Detta kan inte ångras.`}
          </Alert>
        </div>
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex justify-end gap-3">
          <Button
            onClick={() => setDeleteLessonTarget(null)}
            color="gray"
          >
            Avbryt
          </Button>
          <Button
            onClick={confirmDeleteLesson}
            disabled={isLoading}
            color="failure"
          >
            {isLoading ? <><Spinner size="sm" className="mr-2" />Bearbetar...</> :
             (deleteLessonTarget && deleteLessonTarget.bookingCount > 0 ? 'Arkivera' : 'Radera')}
          </Button>
        </div>
      </Modal>

      {/* Delete Package Confirm Modal */}
      <Modal
        show={!!deletePackageTarget}
        onClose={() => setDeletePackageTarget(null)}
        size="md"
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Trash2 className="w-6 h-6 text-red-500" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Bekräfta {deletePackageTarget && deletePackageTarget.purchaseCount > 0 ? 'arkivering' : 'radering'}</h3>
          </div>
        </div>
        <div className="p-6 bg-white dark:bg-gray-800">
          <Alert color="failure" className="mb-4">
            {deletePackageTarget && deletePackageTarget.purchaseCount > 0
              ? `Paketet har ${deletePackageTarget.purchaseCount} köp. Det kommer att arkiveras för att bevara historik. Vill du fortsätta?`
              : `Vill du radera "${deletePackageTarget?.name}"? Detta kommer även att ta bort paketets innehåll och kan inte ångras.`}
          </Alert>
        </div>
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex justify-end gap-3">
          <Button
            onClick={() => setDeletePackageTarget(null)}
            color="gray"
          >
            Avbryt
          </Button>
          <Button
            onClick={confirmDeletePackage}
            disabled={isLoading}
            color="failure"
          >
            {isLoading ? <><Spinner size="sm" className="mr-2" />Bearbetar...</> :
             (deletePackageTarget && deletePackageTarget.purchaseCount > 0 ? 'Arkivera' : 'Radera')}
          </Button>
        </div>
      </Modal>
      <div className="mt-8">
        <Banner className="mb-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <HiInformationCircle className="w-7 h-7 text-blue-500 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Statistik</h2>
          </div>
        </Banner>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <div className="flex flex-col items-center">
              <span className="text-lg font-semibold text-gray-900 dark:text-white">Totalt Lektioner</span>
              <span className="text-3xl font-bold text-blue-500 mt-2">{stats.totalLessons}</span>
            </div>
          </Card>

          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <div className="flex flex-col items-center">
              <span className="text-lg font-semibold text-gray-900 dark:text-white">Aktiva Lektioner</span>
              <span className="text-3xl font-bold text-blue-500 mt-2">{stats.activeLessons}</span>
            </div>
          </Card>

          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <div className="flex flex-col items-center">
              <span className="text-lg font-semibold text-gray-900 dark:text-white">Totalt Paket</span>
              <span className="text-3xl font-bold text-blue-500 mt-2">{stats.totalPackages}</span>
            </div>
          </Card>

          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <div className="flex flex-col items-center">
              <span className="text-lg font-semibold text-gray-900 dark:text-white">Aktiva Paket</span>
              <span className="text-3xl font-bold text-blue-500 mt-2">{stats.activePackages}</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

