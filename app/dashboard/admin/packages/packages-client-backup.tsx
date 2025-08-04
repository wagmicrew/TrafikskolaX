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
  stats: PackageStats;
}

export default function PackagesClient({ packages: initialPackages, lessonTypes, stats }: PackagesClientProps) {
  const router = useRouter();
  const [packages, setPackages] = useState<Package[]>(initialPackages);
const [showInactive, setShowInactive] = useState<boolean>(false);
const [isPopoverOpen, setIsPopoverOpen] = useState<boolean>(false);
const [currentPackage, setCurrentPackage] = useState<Package | undefined>(undefined);

  const filteredPackages = showInactive 
    ? packages.filter(pkg => !pkg.isActive)
    : packages.filter(pkg => pkg.isActive);

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
        
<Button onClick={() => setIsPopoverOpen(true)}>
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

{isPopoverOpen && <PackageBuilderPopover lessonTypes={lessonTypes} onSave={(pkg) => {
        // Logic to save package
        setIsPopoverOpen(false);
        toast.success('Package saved successfully!');
      }} />}

        {/* Packages List */}
      div className="space-y-4"
        div className="flex justify-between items-center"
          h2 className="text-xl font-semibold"
            {showInactive ? 'Inaktiva Paket' : 'Aktiva Paket'}
          /h2
          Button
            variant="outline"
            onClick={() = setShowInactive(!showInactive)}
          
            {showInactive ? 'Visa Aktiva' : 'Visa Inaktiva'}
          /Button
        /div

        {filteredPackages.length === 0 ? (
          div className="text-center py-8 text-muted-foreground"
            Inga {showInactive ? 'inaktiva' : 'aktiva'} paket hittades.
          /div
        ) : (
          div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            {filteredPackages.map((pkg) = (
              Card key={pkg.id} className="relative flex flex-col h-full hover:shadow-lg transition-shadow"
                CardHeader className="pb-2"
                  div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2"
                    div className="flex-1 min-w-0"
                      CardTitle className="text-xl font-bold truncate"{pkg.name}/CardTitle
                      CardDescription className="mt-1 line-clamp-2"
                        {pkg.description || 'Ingen beskrivning tillgänglig'}
                      /CardDescription
                    /div
                  /div
                  {/* Glassmorphism Container for Package Details */}
                  div className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl text-sm mt-4 p-4"
                    Details:
                    div className="flex justify-between mt-2"
                      span{pkg.price} SEK/span
                      {pkg.salePrice  (
                        span className="text-green-500"({pkg.salePrice} SEK på rea)/span
                      )}
                    /div
                  /div
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
