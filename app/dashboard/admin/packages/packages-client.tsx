'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Pencil, Trash2, Plus, X, Check, Package as PackageIcon, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
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
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const filteredPackages = showInactive 
    ? packages.filter(pkg => !pkg.isActive)
    : packages.filter(pkg => pkg.isActive);

  const handleSavePackage = async (packageData: any) => {
    try {
      setIsLoading(true);
      
      // Validate required fields
      if (!packageData.name?.trim()) {
        toast.error('Paketnamn måste anges');
        setIsLoading(false);
        return;
      }
      
      if (!packageData.price || isNaN(parseFloat(packageData.price)) || parseFloat(packageData.price) <= 0) {
        toast.error('Ett giltigt pris måste anges');
        setIsLoading(false);
        return;
      }
      
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
      
      // Force refresh data from server
      router.refresh();
    } catch (error) {
      console.error('Error saving package:', error);
      toast.error(error instanceof Error ? error.message : 'Fel vid sparning av paket');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePackage = async (packageData: any) => {
    try {
      setIsLoading(true);
      
      // Validate required fields
      if (!packageData.name?.trim()) {
        toast.error('Paketnamn måste anges');
        setIsLoading(false);
        return;
      }
      
      if (!packageData.price || isNaN(parseFloat(packageData.price)) || parseFloat(packageData.price) <= 0) {
        toast.error('Ett giltigt pris måste anges');
        setIsLoading(false);
        return;
      }
      
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
      
      // Force refresh data from server
      router.refresh();
    } catch (error) {
      console.error('Error updating package:', error);
      toast.error(error instanceof Error ? error.message : 'Fel vid uppdatering av paket');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePackage = async (packageId: string) => {
    try {
      setIsLoading(true);
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
        toast.success('Paket inaktiverat eftersom det har köphistorik');
      } else {
        // Package was actually deleted
        setPackages(prev => prev.filter(pkg => pkg.id !== packageId));
        toast.success('Paket borttaget!');
      }
      
      // Force refresh data from server
      router.refresh();
    } catch (error) {
      console.error('Error deleting package:', error);
      toast.error(error instanceof Error ? error.message : 'Fel vid borttagning av paket');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditPackage = (pkg: Package) => {
    setCurrentPackage(pkg);
    setIsPopoverOpen(true);
  };

  const openPackageBuilder = (pkg?: Package) => {
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
        
        <Button 
          onClick={() => openPackageBuilder()} 
          className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02] border border-green-500/30"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Laddar...
            </>
          ) : (
            '+ Skapa nytt paket'
          )}
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
              lessonTypes={lessonTypes.filter(lt => lt.isActive || (currentPackage?.contents || []).some(c => c.lessonTypeId === lt.id))}
              handledarSessions={handledarSessions.filter(hs => hs.isActive || (currentPackage?.contents || []).some(c => c.handledarSessionId === hs.id))}
              initialPackage={currentPackage}
              onSave={handleSavePackage}
              onUpdate={handleUpdatePackage}
              onClose={() => setIsPopoverOpen(false)}
              isLoading={isLoading}
            />
          </div>
        </div>
      )}

      {/* Packages List */}
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-blue-600 text-transparent bg-clip-text">
            Hantera Paket
          </h2>
          <div className="space-x-4">
            <Button 
              onClick={() => setShowInactive(!showInactive)} 
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02] border border-blue-500/30"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              {showInactive ? 'Dölj inaktiva' : 'Visa inaktiva'}
            </Button>
          </div>

          {filteredPackages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Inga {showInactive ? 'inaktiva' : 'aktiva'} paket hittades.
            </div>
          ) : (
            <div className="space-y-6">
              {filteredPackages.map((pkg) => (
                <div 
                  key={pkg.id} 
                  className={`relative overflow-hidden bg-white/90 backdrop-filter backdrop-blur-sm rounded-lg shadow-lg p-5 border border-gray-200/50 transition-all duration-300 hover:shadow-xl ${!pkg.isActive ? 'bg-opacity-70 grayscale-[30%]' : ''}`}
                >
                  {/* Subtle gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-transparent to-blue-500/5 pointer-events-none"></div>
                  <div className="relative z-10">
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
                            onClick={() => openPackageBuilder(pkg)}
                            variant="outline"
                            size="sm"
                            disabled={isLoading}
                            className="h-8 px-2 text-xs bg-white/10 backdrop-blur-sm border border-white/30 text-white hover:bg-white/20 hover:text-white transition-all duration-200"
                          >
                            {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Redigera'}
                          </Button>
                          <Button
                            onClick={() => handleDeletePackage(pkg.id)}
                            variant="destructive"
                            size="sm"
                            disabled={isLoading}
                            className="h-8 px-2 text-xs bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white border border-red-500/30"
                          >
                            {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Ta bort'}
                          </Button>
                        </div>
                      </div>
                      {/* Glassmorphism Container for Package Details */}
                      <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl text-sm mt-4 p-4">
                        <div className="flex justify-between mt-4">
                          <div>
                            <span className="font-bold text-gray-800">{pkg.price} kr</span>
                            {pkg.priceStudent && (
                              <span className="ml-2 text-sm text-gray-600">Student: {pkg.priceStudent} kr</span>
                            )}
                            {pkg.salePrice && (
                              <span className="ml-2 text-sm font-medium px-2 py-1 bg-green-100 text-green-700 rounded-full">{pkg.salePrice} kr</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
