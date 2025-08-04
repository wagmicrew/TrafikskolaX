'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Pencil, Trash2, Plus, X, Check, Package as PackageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import PackageBuilderPopover from '@/components/PackageBuilderPopover';

interface Package {
  id: string;
  name: string;
  description: string | null;
  price: string;
  priceStudent: string | null;
  salePrice: string | null;
  isActive: boolean;
  contents: any[];
  purchaseCount?: number;
}

interface PackageStats {
  totalPackages: number;
  activePackages: number;
}

interface PackagesClientProps {
  packages: Package[];
  lessonTypes: any[];
  handledarSessions: any[];
  stats: PackageStats;
}

export default function PackagesClient({ packages: initialPackages, lessonTypes, handledarSessions, stats }: PackagesClientProps) {
  const router = useRouter();
  const [packages, setPackages] = useState<Package[]>(initialPackages);
  const [showInactive, setShowInactive] = useState<boolean>(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState<boolean>(false);
  const [currentPackage, setCurrentPackage] = useState<Package | undefined>(undefined);

  const filteredPackages = showInactive 
    ? packages.filter(pkg => !pkg.isActive)
    : packages.filter(pkg => pkg.isActive);

  const handleSavePackage = async (packageData: any) => {
    try {
      const response = await fetch('/api/admin/packages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(packageData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save package');
      }

      const savedPackage = await response.json();
      setPackages(prev => [...prev, savedPackage]);
      setIsPopoverOpen(false);
      toast.success('Paket sparat!');
    } catch (error) {
      console.error('Error saving package:', error);
      toast.error(error instanceof Error ? error.message : 'Fel vid sparning av paket');
    }
  };

  const handleUpdatePackage = async (packageData: any) => {
    try {
      const response = await fetch('/api/admin/packages', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(packageData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update package');
      }

      const updatedPackage = await response.json();
      setPackages(prev => prev.map(pkg => 
        pkg.id === updatedPackage.id ? updatedPackage : pkg
      ));
      setIsPopoverOpen(false);
      toast.success('Paket uppdaterat!');
    } catch (error) {
      console.error('Error updating package:', error);
      toast.error(error instanceof Error ? error.message : 'Fel vid uppdatering av paket');
    }
  };

  const handleDeletePackage = async (packageId: string) => {
    try {
      const response = await fetch(`/api/admin/packages?id=${packageId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete package');
      }

      const result = await response.json();
      
      if (result.message) {
        // Package was deactivated instead of deleted
        setPackages(prev => prev.map(pkg => 
          pkg.id === packageId ? { ...pkg, isActive: false } : pkg
        ));
        toast.success('Paket inaktiverat');
      } else {
        // Package was actually deleted
        setPackages(prev => prev.filter(pkg => pkg.id !== packageId));
        toast.success('Paket borttaget!');
      }
    } catch (error) {
      console.error('Error deleting package:', error);
      toast.error(error instanceof Error ? error.message : 'Fel vid borttagning av paket');
    }
  };

  const handleEditPackage = (pkg: Package) => {
    setCurrentPackage(pkg);
    setIsPopoverOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <PackageIcon className="w-6 h-6" />
            Hantera Paket
          </h1>
          <p className="text-muted-foreground">
            Skapa och hantera lektionspaket som elever kan köpa
          </p>
        </div>
        
        <Button onClick={() => {
          setCurrentPackage(undefined);
          setIsPopoverOpen(true);
        }}>
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
            <PackageIcon className="h-4 w-4 text-muted-foreground" />
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

      {/* Package Builder Popover */}
      {isPopoverOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <PackageBuilderPopover 
              lessonTypes={lessonTypes}
              handledarSessions={handledarSessions}
              initialPackage={currentPackage}
              onSave={handleSavePackage}
              onUpdate={handleUpdatePackage}
              onClose={() => setIsPopoverOpen(false)}
            />
          </div>
        </div>
      )}

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
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPackages.map((pkg) => (
              <Card key={pkg.id} className="relative flex flex-col h-full hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-xl font-bold truncate">{pkg.name}</CardTitle>
                      <CardDescription className="mt-1 line-clamp-2">
                        {pkg.description || 'Ingen beskrivning tillgänglig'}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditPackage(pkg)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => {
                          if (confirm('Är du säker på att du vill ta bort detta paket?')) {
                            handleDeletePackage(pkg.id);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  {/* Glassmorphism Container for Package Details */}
                  <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl text-sm mt-4 p-4">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Pris:</span>
                      <div className="text-right">
                        <span className="font-bold">{pkg.price} SEK</span>
                        {pkg.salePrice && (
                          <div className="text-green-500 text-xs">
                            ({pkg.salePrice} SEK på rea)
                          </div>
                        )}
                      </div>
                    </div>
                    {pkg.contents && pkg.contents.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-white/10">
                        <span className="text-xs text-gray-600">
                          {pkg.contents.length} innehållsdelar
                        </span>
                      </div>
                    )}
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
