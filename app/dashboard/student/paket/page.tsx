"use client";

import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Spinner, Progress } from 'flowbite-react';
import { Package, Clock, CheckCircle, Star, CreditCard, Calendar, Users } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { toast } from 'sonner';

interface UserPackage {
  id: string;
  name: string;
  description: string;
  totalLessons: number;
  usedLessons: number;
  remainingLessons: number;
  validUntil: string;
  purchaseDate: string;
  price: number;
  status: 'active' | 'expired' | 'completed';
  packageType: 'driving' | 'theory' | 'combo';
  features: string[];
}

interface AvailablePackage {
  id: string;
  name: string;
  description: string;
  price: number;
  lessons: number;
  validityMonths: number;
  packageType: 'driving' | 'theory' | 'combo';
  features: string[];
  popular: boolean;
}

export default function StudentPackagesPage() {
  const [userPackages, setUserPackages] = useState<UserPackage[]>([]);
  const [availablePackages, setAvailablePackages] = useState<AvailablePackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'my-packages' | 'available'>('my-packages');
  const { user } = useAuth();

  useEffect(() => {
    fetchPackagesData();
  }, []);

  const fetchPackagesData = async () => {
    try {
      setLoading(true);
      
      // Fetch user packages
      const userPackagesRes = await fetch('/api/user/packages');
      const userPackagesData = await userPackagesRes.json();
      
      // Fetch available packages
      const availablePackagesRes = await fetch('/api/packages');
      const availablePackagesData = await availablePackagesRes.json();

      // Mock data for now
      const mockUserPackages: UserPackage[] = [
        {
          id: '1',
          name: 'Körkortspaket Standard',
          description: 'Komplett paket för B-körkort',
          totalLessons: 20,
          usedLessons: 12,
          remainingLessons: 8,
          validUntil: '2024-12-31',
          purchaseDate: '2024-01-15',
          price: 15900,
          status: 'active',
          packageType: 'combo',
          features: ['20 körlektioner', 'Teoriprov', 'Körprov', 'Handledning']
        },
        {
          id: '2',
          name: 'Teoripaket Plus',
          description: 'Utökad teoriutbildning',
          totalLessons: 10,
          usedLessons: 10,
          remainingLessons: 0,
          validUntil: '2024-06-30',
          purchaseDate: '2024-01-10',
          price: 2500,
          status: 'completed',
          packageType: 'theory',
          features: ['10 teorilektioner', 'Online material', 'Provtillfällen']
        }
      ];

      const mockAvailablePackages: AvailablePackage[] = [
        {
          id: '1',
          name: 'Körkortspaket Premium',
          description: 'Vårt mest omfattande paket med extra stöd',
          price: 22900,
          lessons: 30,
          validityMonths: 18,
          packageType: 'combo',
          features: ['30 körlektioner', 'Teoriprov', 'Körprov', 'Personlig handledare', 'Intensivkurs'],
          popular: true
        },
        {
          id: '2',
          name: 'Körkortspaket Standard',
          description: 'Perfekt för de flesta elever',
          price: 15900,
          lessons: 20,
          validityMonths: 12,
          packageType: 'combo',
          features: ['20 körlektioner', 'Teoriprov', 'Körprov', 'Handledning'],
          popular: false
        },
        {
          id: '3',
          name: 'Körkortspaket Basic',
          description: 'Grundläggande paket för erfarna förare',
          price: 9900,
          lessons: 12,
          validityMonths: 8,
          packageType: 'driving',
          features: ['12 körlektioner', 'Körprov', 'Grundläggande handledning'],
          popular: false
        },
        {
          id: '4',
          name: 'Teoripaket Komplett',
          description: 'Allt du behöver för teoridelen',
          price: 3500,
          lessons: 15,
          validityMonths: 6,
          packageType: 'theory',
          features: ['15 teorilektioner', 'Online material', 'Obegränsade provtillfällen', 'Mobilapp'],
          popular: false
        }
      ];

      setUserPackages(mockUserPackages);
      setAvailablePackages(mockAvailablePackages);
    } catch (error) {
      console.error('Error fetching packages:', error);
      toast.error('Kunde inte hämta paketinformation');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'expired': return 'failure';
      case 'completed': return 'gray';
      default: return 'gray';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Aktivt';
      case 'expired': return 'Utgånget';
      case 'completed': return 'Avslutat';
      default: return status;
    }
  };

  const getPackageTypeColor = (type: string) => {
    switch (type) {
      case 'driving': return 'blue';
      case 'theory': return 'purple';
      case 'combo': return 'green';
      default: return 'gray';
    }
  };

  const getPackageTypeText = (type: string) => {
    switch (type) {
      case 'driving': return 'Körning';
      case 'theory': return 'Teori';
      case 'combo': return 'Komplett';
      default: return type;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sv-SE');
  };

  const formatPrice = (price: number) => {
    return `${price.toLocaleString('sv-SE')} kr`;
  };

  const handlePurchasePackage = (packageId: string) => {
    toast.info('Köpfunktion kommer snart');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <Spinner size="xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Paket & Krediter</h1>
          <p className="text-gray-600">Hantera dina körkortpaket och köp nya</p>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('my-packages')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'my-packages'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Mina paket ({userPackages.length})
              </button>
              <button
                onClick={() => setActiveTab('available')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'available'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Tillgängliga paket
              </button>
            </nav>
          </div>
        </div>

        {/* My Packages Tab */}
        {activeTab === 'my-packages' && (
          <div className="space-y-6">
            {userPackages.length === 0 ? (
              <Card>
                <div className="p-8 text-center">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Inga paket ännu</h3>
                  <p className="text-gray-500 mb-4">Du har inte köpt några paket än.</p>
                  <Button onClick={() => setActiveTab('available')}>
                    Utforska paket
                  </Button>
                </div>
              </Card>
            ) : (
              userPackages.map((pkg) => (
                <Card key={pkg.id}>
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <h3 className="text-xl font-semibold text-gray-900 mr-3">
                            {pkg.name}
                          </h3>
                          <Badge color={getStatusColor(pkg.status)} size="sm">
                            {getStatusText(pkg.status)}
                          </Badge>
                          <Badge color={getPackageTypeColor(pkg.packageType)} size="sm" className="ml-2">
                            {getPackageTypeText(pkg.packageType)}
                          </Badge>
                        </div>
                        <p className="text-gray-600 mb-4">{pkg.description}</p>
                        
                        {/* Progress */}
                        {pkg.status === 'active' && (
                          <div className="mb-4">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-medium text-gray-700">Förbrukning</span>
                              <span className="text-sm text-gray-600">
                                {pkg.usedLessons}/{pkg.totalLessons} lektioner
                              </span>
                            </div>
                            <Progress 
                              progress={(pkg.usedLessons / pkg.totalLessons) * 100} 
                              color="blue" 
                            />
                            <p className="text-sm text-gray-600 mt-1">
                              {pkg.remainingLessons} lektioner kvar
                            </p>
                          </div>
                        )}

                        {/* Features */}
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Inkluderat:</h4>
                          <div className="flex flex-wrap gap-2">
                            {pkg.features.map((feature, index) => (
                              <Badge key={index} color="gray" size="sm">
                                {feature}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="text-right ml-6">
                        <p className="text-2xl font-bold text-gray-900 mb-1">
                          {formatPrice(pkg.price)}
                        </p>
                        <p className="text-sm text-gray-600">
                          Köpt: {formatDate(pkg.purchaseDate)}
                        </p>
                        <p className="text-sm text-gray-600">
                          Giltigt till: {formatDate(pkg.validUntil)}
                        </p>
                      </div>
                    </div>

                    {/* Package Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center">
                        <Clock className="h-5 w-5 text-blue-600 mr-2" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Återstående tid</p>
                          <p className="text-sm text-gray-600">
                            {Math.ceil((new Date(pkg.validUntil).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} dagar
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Genomförda</p>
                          <p className="text-sm text-gray-600">{pkg.usedLessons} lektioner</p>
                        </div>
                      </div>

                      <div className="flex items-center">
                        <Package className="h-5 w-5 text-purple-600 mr-2" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Pakettyp</p>
                          <p className="text-sm text-gray-600">{getPackageTypeText(pkg.packageType)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Available Packages Tab */}
        {activeTab === 'available' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availablePackages.map((pkg) => (
              <Card key={pkg.id} className={`relative ${pkg.popular ? 'ring-2 ring-blue-500' : ''}`}>
                {pkg.popular && (
                  <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2">
                    <Badge color="blue" size="sm" className="flex items-center">
                      <Star className="h-3 w-3 mr-1" />
                      Populär
                    </Badge>
                  </div>
                )}
                
                <div className="p-6">
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">{pkg.name}</h3>
                      <Badge color={getPackageTypeColor(pkg.packageType)} size="sm">
                        {getPackageTypeText(pkg.packageType)}
                      </Badge>
                    </div>
                    <p className="text-gray-600 mb-4">{pkg.description}</p>
                    
                    <div className="text-center mb-4">
                      <p className="text-3xl font-bold text-gray-900 mb-1">
                        {formatPrice(pkg.price)}
                      </p>
                      <p className="text-sm text-gray-600">
                        {Math.round(pkg.price / pkg.lessons)} kr/lektion
                      </p>
                    </div>
                  </div>

                  {/* Package Details */}
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 text-gray-600 mr-2" />
                      <span className="text-sm text-gray-600">{pkg.lessons} lektioner</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-gray-600 mr-2" />
                      <span className="text-sm text-gray-600">Giltigt i {pkg.validityMonths} månader</span>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Inkluderat:</h4>
                    <ul className="space-y-1">
                      {pkg.features.map((feature, index) => (
                        <li key={index} className="flex items-center text-sm text-gray-600">
                          <CheckCircle className="h-3 w-3 text-green-600 mr-2" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Purchase Button */}
                  <Button
                    onClick={() => handlePurchasePackage(pkg.id)}
                    className="w-full"
                    color={pkg.popular ? "blue" : "gray"}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Köp paket
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
