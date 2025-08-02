'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Package, Trash2, Pencil, Check, X } from 'lucide-react';

interface LessonType {
  id: string;
  name: string;
  price: string;
  durationMinutes: number;
}

interface PackageContent {
  id?: string;
  lessonTypeId: string;
  lessonType?: LessonType;
  credits: number;
  freeText?: string | null;
}

interface Package {
  id: string;
  name: string;
  description: string | null;
  price: string;
  priceStudent: string | null;
  salePrice: string | null;
  isActive: boolean;
  contents: PackageContent[];
  purchaseCount?: number;
}

interface PackageStats {
  totalPackages: number;
  activePackages: number;
}

interface PackagesClientProps {
  packages: Package[];
  lessonTypes: LessonType[];
  stats: PackageStats;
}

export default function PackagesClient({ packages: initialPackages, lessonTypes, stats }: PackagesClientProps) {
  const router = useRouter();
  const [packages, setPackages] = useState<Package[]>(initialPackages);
  const [showInactive, setShowInactive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Package form state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    price: string;
    priceStudent: string;
    salePrice: string;
    isActive: boolean;
    contents: PackageContent[];
  }>({
    name: '',
    description: '',
    price: '',
    priceStudent: '',
    salePrice: '',
    isActive: true,
    contents: [],
  });

  // Filter packages based on active/inactive filter
  const filteredPackages = showInactive 
    ? packages.filter(pkg => !pkg.isActive)
    : packages.filter(pkg => pkg.isActive);

  // Handle opening the dialog for a new package
  const handleNewPackage = () => {
    setEditingPackage(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      priceStudent: '',
      salePrice: '',
      isActive: true,
      contents: [],
    });
    setIsDialogOpen(true);
  };

  // Handle opening the dialog for editing an existing package
  const handleEditPackage = (pkg: Package) => {
    setEditingPackage(pkg);
    setFormData({
      name: pkg.name,
      description: pkg.description || '',
      price: pkg.price,
      priceStudent: pkg.priceStudent || '',
      salePrice: pkg.salePrice || '',
      isActive: pkg.isActive,
      contents: pkg.contents.map(content => ({
        ...content,
        lessonType: content.lessonType || lessonTypes.find(lt => lt.id === content.lessonTypeId)
      }))
    });
    setIsDialogOpen(true);
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle adding a new content item to the package
  const handleAddContent = () => {
    if (!formData.contents.some(item => !item.lessonTypeId)) {
      setFormData(prev => ({
        ...prev,
        contents: [
          ...prev.contents,
          { lessonTypeId: '', credits: 1, freeText: '' }
        ]
      }));
    }
  };

  // Handle removing a content item from the package
  const handleRemoveContent = (index: number) => {
    setFormData(prev => ({
      ...prev,
      contents: prev.contents.filter((_, i) => i !== index)
    }));
  };

  // Handle content item changes
  const handleContentChange = (index: number, field: keyof PackageContent, value: any) => {
    const updatedContents = [...formData.contents];
    updatedContents[index] = { ...updatedContents[index], [field]: value };
    
    // If lesson type changed, update the lessonType reference
    if (field === 'lessonTypeId') {
      const lessonType = lessonTypes.find(lt => lt.id === value);
      if (lessonType) {
        updatedContents[index].lessonType = lessonType;
      }
    }
    
    setFormData(prev => ({
      ...prev,
      contents: updatedContents
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const url = editingPackage 
        ? `/api/admin/packages`
        : '/api/admin/packages';
      
      const method = editingPackage ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...(editingPackage && { id: editingPackage.id }),
          name: formData.name,
          description: formData.description || null,
          price: formData.price,
          priceStudent: formData.priceStudent || null,
          salePrice: formData.salePrice || null,
          isActive: formData.isActive,
          contents: formData.contents.map(content => ({
            lessonTypeId: content.lessonTypeId,
            credits: Number(content.credits) || 0,
            freeText: content.freeText || null
          }))
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to save package');
      }
      
      const result = await response.json();
      
      toast({
        title: 'Success',
        description: editingPackage ? 'Package updated successfully' : 'Package created successfully',
      });
      
      // Refresh the packages list
      router.refresh();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving package:', error);
      toast({
        title: 'Error',
        description: 'Failed to save package',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle package deletion
  const handleDeletePackage = async (id: string) => {
    if (!confirm('Are you sure you want to delete this package? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/admin/packages?id=${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete package');
      }
      
      toast({
        title: 'Success',
        description: 'Package deleted successfully',
      });
      
      // Refresh the packages list
      router.refresh();
    } catch (error) {
      console.error('Error deleting package:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete package',
        variant: 'destructive',
      });
    }
  };

  // Toggle package active status
  const togglePackageStatus = async (pkg: Package) => {
    try {
      const response = await fetch(`/api/admin/packages`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: pkg.id,
          name: pkg.name,
          description: pkg.description,
          price: pkg.price,
          priceStudent: pkg.priceStudent,
          salePrice: pkg.salePrice,
          isActive: !pkg.isActive,
          contents: pkg.contents.map(content => ({
            lessonTypeId: content.lessonTypeId,
            credits: content.credits,
            freeText: content.freeText
          }))
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update package status');
      }
      
      // Refresh the packages list
      router.refresh();
    } catch (error) {
      console.error('Error updating package status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update package status',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="w-6 h-6" />
            Hantera Paket
          </h1>
          <p className="text-muted-foreground">
            Skapa och hantera lektionspaket som elever kan köpa
          </p>
        </div>
        
        <Button onClick={handleNewPackage}>
          <Plus className="w-4 h-4 mr-2" />
          Nytt Paket
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Totalt Paket
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPackages}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Aktiva Paket
            </CardTitle>
            <Check className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activePackages}</div>
          </CardContent>
        </Card>
      </div>

      {/* Packages List */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">
            {showInactive ? 'Inaktiva Paket' : 'Aktiva Paket'}
          </h2>
          <Button
            variant="outline"
            onClick={() => setShowInactive(!showInactive)}
          >
            {showInactive ? 'Visa Aktiva' : 'Visa Inaktiva'}
          </Button>
        </div>

        {filteredPackages.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Inga {showInactive ? 'inaktiva' : 'aktiva'} paket hittades.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredPackages.map((pkg) => (
              <Card key={pkg.id} className="relative">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{pkg.name}</CardTitle>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditPackage(pkg)}
                        className="text-muted-foreground hover:text-foreground"
                        aria-label="Edit package"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeletePackage(pkg.id)}
                        className="text-destructive hover:text-destructive/80"
                        aria-label="Delete package"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {pkg.description || 'Ingen beskrivning tillgänglig'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pris:</span>
                      <span className="font-medium">{pkg.price} SEK</span>
                    </div>
                    {pkg.salePrice && (
                      <div className="flex justify-between text-green-600">
                        <span>Reapris:</span>
                        <span className="font-medium">{pkg.salePrice} SEK</span>
                      </div>
                    )}
                    <div className="pt-2">
                      <p className="text-sm font-medium mb-1">Innehåll:</p>
                      <ul className="text-sm space-y-1">
                        {pkg.contents.length > 0 ? (
                          pkg.contents.map((content, idx) => (
                            <li key={idx} className="flex justify-between">
                              <span>
                                {content.lessonType?.name || 'Okänd lektion'} 
                                {content.credits > 0 && ` (${content.credits} krediter)`}
                              </span>
                            </li>
                          ))
                        ) : (
                          <li className="text-muted-foreground">Inget innehåll</li>
                        )}
                      </ul>
                    </div>
                  </div>
                  <div className="mt-4 pt-2 border-t flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id={`active-${pkg.id}`} 
                        checked={pkg.isActive}
                        onCheckedChange={() => togglePackageStatus(pkg)}
                      />
                      <Label htmlFor={`active-${pkg.id}`} className="text-sm">
                        Aktiv
                      </Label>
                    </div>
                    {pkg.purchaseCount !== undefined && (
                      <span className="text-sm text-muted-foreground">
                        {pkg.purchaseCount} köp
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Package Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPackage ? 'Redigera Paket' : 'Nytt Paket'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Namn *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Ex: Grundpaket B-körkort"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="price">Pris (SEK) *</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="priceStudent">Studentpris (SEK, valfritt)</Label>
                <Input
                  id="priceStudent"
                  name="priceStudent"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.priceStudent}
                  onChange={handleInputChange}
                  placeholder="Lämna tomt för inget extrapris"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="salePrice">Reapris (SEK, valfritt)</Label>
                <Input
                  id="salePrice"
                  name="salePrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.salePrice}
                  onChange={handleInputChange}
                  placeholder="Lämna tomt för inget extrapris"
                />
              </div>
              
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="description">Beskrivning</Label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Beskrivning av paketet och dess förmåner..."
                  rows={3}
                />
              </div>
            </div>
            
            {/* Package Contents */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">Innehåll i paketet</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddContent}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Lägg till innehåll
                </Button>
              </div>
              
              {formData.contents.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground border rounded-md">
                  Inget innehåll tillagt ännu. Klicka på "Lägg till innehåll" för att börja.
                </div>
              ) : (
                <div className="space-y-3">
                  {formData.contents.map((content, index) => (
                    <div key={index} className="flex items-start gap-2 p-3 border rounded-md">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                        <div className="space-y-1">
                          <Label htmlFor={`lessonType-${index}`} className="text-xs">Lektionstyp *</Label>
                          <Select
                            value={content.lessonTypeId}
                            onValueChange={(value) => handleContentChange(index, 'lessonTypeId', value)}
                            required
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Välj lektionstyp" />
                            </SelectTrigger>
                            <SelectContent>
                              {lessonTypes.map((lessonType) => (
                                <SelectItem key={lessonType.id} value={lessonType.id}>
                                  {lessonType.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-1">
                          <Label htmlFor={`credits-${index}`} className="text-xs">Antal krediter</Label>
                          <Input
                            id={`credits-${index}`}
                            type="number"
                            min="0"
                            value={content.credits}
                            onChange={(e) => handleContentChange(index, 'credits', parseInt(e.target.value) || 0)}
                            placeholder="0"
                          />
                        </div>
                        
                        <div className="space-y-1">
                          <Label htmlFor={`freeText-${index}`} className="text-xs">Fritext (valfritt)</Label>
                          <Input
                            id={`freeText-${index}`}
                            value={content.freeText || ''}
                            onChange={(e) => handleContentChange(index, 'freeText', e.target.value)}
                            placeholder="T.ex. 'Inkl. riskutbildning'"
                          />
                        </div>
                      </div>
                      
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive/80"
                        onClick={() => handleRemoveContent(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="isActive" 
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: Boolean(checked) }))}
                />
                <Label htmlFor="isActive">Aktivt paket</Label>
              </div>
              
              <div className="space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isLoading}
                >
                  Avbryt
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Sparar...' : 'Spara Paket'}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
