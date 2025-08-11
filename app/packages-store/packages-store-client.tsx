"use client";

import React, { useState, ReactElement } from 'react';
import {
  FaShoppingCart,
  FaCheck,
  FaStar,
  FaGift,
  FaPercent,
  FaCreditCard,
  FaMobileAlt,
  FaSpinner,
  FaCheckCircle
} from 'react-icons/fa';

interface Package {
  id: string;
  name: string;
  description: string;
  price: number;
  priceStudent?: number;
  salePrice?: number;
  isPopular: boolean;
  features: string[];
  credits: number;
  image: string;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}
import { SwishPaymentDialog } from '@/components/booking/swish-payment-dialog';
import { QliroPaymentDialog } from '@/components/booking/qliro-payment-dialog';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { useEffect } from 'react';
import StudentHeader from '@/app/dashboard/student/StudentHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface PackagesStoreClientProps {
  user: User;
  packages: Package[];
}

const PackagesStoreClient = ({ user, packages }: PackagesStoreClientProps): ReactElement => {
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('swish');
  const [loading, setLoading] = useState(false);
  const [showSwishDialog, setShowSwishDialog] = useState(false);
  const [showQliroDialog, setShowQliroDialog] = useState(false);
  
  // Qliro availability state
  const [qliroAvailable, setQliroAvailable] = useState<boolean>(true);
  const [qliroStatusMessage, setQliroStatusMessage] = useState<string>('');
  const [qliroStatusLoading, setQliroStatusLoading] = useState<boolean>(true);
  const [swishPaymentData, setSwishPaymentData] = useState({
    amount: 0,
    message: '',
    swishNumber: process.env.NEXT_PUBLIC_SWISH_NUMBER || '1231231231',
    purchaseId: ''
  });
  const [qliroPaymentData, setQliroPaymentData] = useState({
    amount: 0,
    purchaseId: '',
    checkoutUrl: ''
  });

  // Check Qliro availability on component mount
  useEffect(() => {
    const checkQliroStatus = async () => {
      try {
        setQliroStatusLoading(true);
        const response = await fetch('/api/payments/qliro/status');
        if (response.ok) {
          const data = await response.json();
          setQliroAvailable(data.available);
          setQliroStatusMessage(data.message || '');
        } else {
          setQliroAvailable(false);
          setQliroStatusMessage('Kunde inte kontrollera Qliro-status');
        }
      } catch (error) {
        console.error('Failed to check Qliro status:', error);
        setQliroAvailable(false);
        setQliroStatusMessage('Qliro-tjänsten är för närvarande inte tillgänglig');
      } finally {
        setQliroStatusLoading(false);
      }
    };

    checkQliroStatus();
  }, []);

  const getEffectivePrice = (pkg: Package): number => {
    if (pkg.salePrice !== undefined) return pkg.salePrice;
    if (user.role === 'student' && pkg.priceStudent !== undefined) return pkg.priceStudent;
    return pkg.price;
  };

  const getPricePerCredit = (pkg: Package): string => {
    const effectivePrice = getEffectivePrice(pkg);
    const pricePerCredit = (effectivePrice / pkg.credits).toFixed(2);
    return pricePerCredit;
  };

  const getSavingsPercentage = (pkg: Package): number => {
    const originalPrice = pkg.price;
    const effectivePrice = getEffectivePrice(pkg);
    if (effectivePrice < originalPrice) {
      return Math.round(((originalPrice - effectivePrice) / originalPrice) * 100);
    }
    return 0;
  };

  const handlePurchase = async (packageId: string): Promise<void> => {
    // Check if trying to purchase with Qliro when it's unavailable
    if (paymentMethod === 'qliro' && !qliroAvailable) {
      toast.error(qliroStatusMessage || 'Qliro är för närvarande inte tillgänglig. Välj Swish istället.');
      return;
    }

    setLoading(true);
    try {
      // First, create the package purchase record
      const response = await fetch('/api/packages/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          packageId,
          paymentMethod,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        if (paymentMethod === 'swish') {
          // Set up Swish payment dialog
          const pkg = packages.find((p: Package) => p.id === packageId);
          if (!pkg) {
            throw new Error('Paketet kunde inte hittas');
          }
          
          const effectivePrice = getEffectivePrice(pkg);
          
          setSwishPaymentData({
            amount: effectivePrice,
            message: `Paket ${pkg.name} - Order ${data.purchaseId}`,
            purchaseId: data.purchaseId,
            swishNumber: process.env.NEXT_PUBLIC_SWISH_NUMBER || '1231231231'
          });
          
          setShowSwishDialog(true);
          
        } else if (paymentMethod === 'qliro') {
          // Set up Qliro payment dialog
          const pkg = packages.find((p: Package) => p.id === packageId);
          if (!pkg) {
            throw new Error('Paketet kunde inte hittas');
          }
          
          const effectivePrice = getEffectivePrice(pkg);
          
          setQliroPaymentData({
            amount: effectivePrice,
            purchaseId: data.purchaseId,
            checkoutUrl: data.checkoutUrl
          });
          
          setShowQliroDialog(true);
        }
      } else {
        toast.error(data.error || 'Något gick fel vid skapande av köp');
      }
    } catch (error) {
      console.error('Payment error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Ett fel uppstod vid behandling av din betalning';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSwishConfirm = async (purchaseId: string): Promise<void> => {
    // For Swish, we show a confirmation message and wait for manual/admin verification or webhook
    toast.success('Tack! Vi verifierar din Swish-betalning snarast.');
    setShowSwishDialog(false);
  };

  const handleQliroConfirm = async (): Promise<void> => {
    setShowQliroDialog(false);
    toast.success('Du omdirigeras till Qliro för att slutföra betalningen.');
  };

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      {/* Payment Dialogs */}
      <SwishPaymentDialog
        isOpen={showSwishDialog}
        onClose={() => setShowSwishDialog(false)}
        booking={{
          id: swishPaymentData.purchaseId,
          totalPrice: swishPaymentData.amount
        }}
        mode="package"
        onConfirm={() => handleSwishConfirm(swishPaymentData.purchaseId)}
      />
      
      <QliroPaymentDialog
        isOpen={showQliroDialog}
        onClose={() => setShowQliroDialog(false)}
        purchaseId={qliroPaymentData.purchaseId}
        amount={qliroPaymentData.amount}
        checkoutUrl={qliroPaymentData.checkoutUrl}
        onConfirm={handleQliroConfirm}
      />
      
      {/* Content Container */}
      <div className="max-w-7xl mx-auto">
        <div className="p-4 md:p-6">
      
      {/* Main Content */}
      {/* Header */}
      <div className="mb-6">
        <StudentHeader title="Paketbutik" />
      </div>
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-2">
          <FaShoppingCart className="inline-block mr-3 text-gray-500" />
          Paketbutik
        </h1>
        <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto mb-6">
          Välj mellan våra populära paket och spara pengar på dina körlektioner.
        </p>
        
        {/* Payment Method Selector */}
        <Card className="mb-10 max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Välj betalningsmetod</CardTitle>
            <CardDescription>Välj hur du vill betala ditt paket.</CardDescription>
          </CardHeader>
          <CardContent>
            {!qliroStatusLoading && !qliroAvailable && (
              <div className="mb-4">
                <Badge variant="destructive">{qliroStatusMessage || 'Qliro är otillgänglig just nu'}</Badge>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
              <Button
                onClick={() => setPaymentMethod('swish')}
                variant={paymentMethod === 'swish' ? 'default' : 'outline'}
                className="p-4 rounded-xl flex flex-col items-center justify-center gap-2"
              >
                <FaMobileAlt className="text-2xl" />
                <span className="font-medium">Swish</span>
              </Button>
              
              <Button
                onClick={() => qliroAvailable && setPaymentMethod('qliro')}
                disabled={!qliroAvailable}
                variant={paymentMethod === 'qliro' ? 'default' : 'outline'}
                className="p-4 rounded-xl flex flex-col items-center justify-center gap-2 relative"
                title={!qliroAvailable ? qliroStatusMessage : 'Välj Qliro som betalningsmetod'}
              >
                <div className="flex items-center gap-1">
                  <FaCreditCard className="text-2xl" />
                  {qliroStatusLoading && <FaSpinner className="text-sm animate-spin" />}
                </div>
                <span className="font-medium">Qliro</span>
                {!qliroAvailable && (
                  <span className="text-xs text-center mt-1">Otillgänglig</span>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Packages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
        {packages.map((pkg) => {
          const effectivePrice = getEffectivePrice(pkg);
          const savings = getSavingsPercentage(pkg);
          const isPopular = savings > 15;

          return (
            <Card 
              key={pkg.id} 
              className={`relative border border-gray-200 rounded-xl shadow-sm overflow-hidden transition-shadow duration-200 hover:shadow-md`}
            >
              {/* Popular Badge */}
              {isPopular && (
                <div className="absolute top-4 right-4 z-10">
                  <div className="bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                    <FaStar className="text-amber-600" />
                    Populär
                  </div>
                </div>
              )}

              {/* Savings Badge */}
              {savings > 0 && (
                <div className="absolute top-4 left-4 z-10">
                  <div className="bg-green-100 text-green-700 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                    <FaPercent />
                    Spara {savings}%
                  </div>
                </div>
              )}

              <div className="p-6">
                {/* Package Header */}
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{pkg.name}</h3>
                  <p className="text-gray-600 text-sm">{pkg.description}</p>
                </div>

                {/* Price */}
                <div className="text-center mb-6">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <span className="text-3xl font-extrabold text-gray-900">{effectivePrice}</span>
                    <span className="text-lg text-gray-600">kr</span>
                  </div>
                  
                  {savings > 0 && (
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-sm text-gray-500 line-through">{pkg.price} kr</span>
                      <span className="text-sm text-green-700 font-medium">
                        Du sparar {pkg.price - effectivePrice} kr
                      </span>
                    </div>
                  )}
                </div>

                {/* Package Contents */}
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Innehåller</h4>
                  <ul className="space-y-2">
                    {pkg.features.map((feature: string, index: number) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <FaCheck className="text-green-500 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Payment Method Indicator */}
                <div className="mb-6 flex items-center justify-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  {paymentMethod === 'swish' ? (
                    <>
                      <FaMobileAlt className="text-blue-500" />
                      <span className="font-medium text-gray-700">Betalas med Swish</span>
                    </>
                  ) : (
                    <>
                      <FaCreditCard className="text-indigo-600" />
                      <span className="font-medium text-gray-700">Betalas med Qliro</span>
                    </>
                  )}
                </div>

                {/* Purchase Button */}
                <Button
                  onClick={() => handlePurchase(pkg.id)}
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl font-semibold text-base transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      Bearbetar...
                    </>
                  ) : (
                    <>
                      <FaShoppingCart />
                      Köp nu
                    </>
                  )}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {packages.length === 0 && (
        <div className="text-center py-16">
          <FaGift className="text-5xl text-gray-400 mx-auto mb-3" />
          <h3 className="text-xl font-bold text-gray-900 mb-1">Inga paket tillgängliga</h3>
          <p className="text-gray-600">Kom tillbaka senare för fler erbjudanden.</p>
        </div>
      )}

      {/* Info Section */}
      <div className="max-w-4xl mx-auto mt-16 bg-white border border-gray-200 rounded-xl shadow-sm p-8">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">Varför välja våra paket?</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl text-green-600">kr</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Spara pengar</h3>
            <p className="text-gray-600">Få mer värde för dina pengar med våra paketpriser.</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaCheck className="text-2xl text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Flexibilitet</h3>
            <p className="text-gray-600">Använd dina credits när det passar dig bäst.</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaStar className="text-2xl text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Kvalitet</h3>
            <p className="text-gray-600">Samma höga kvalitet på alla våra lektioner.</p>
          </div>
        </div>
      </div>
        </div>
      </div>
    </div>
  );
};

export default PackagesStoreClient;
