"use client";

import React, { useState, ReactElement } from 'react';
import {
  ShoppingCart,
  Check,
  Star,
  Gift,
  Percent,
  CreditCard,
  Smartphone,
  Loader2,
  QrCode,
  CheckCircle
} from 'lucide-react';

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

import toast from 'react-hot-toast';
import { useEffect } from 'react';
import StudentHeader from '@/app/dashboard/student/StudentHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQliroListener } from '@/hooks/use-qliro-listener';

interface PackagesStoreClientProps {
  user: User;
  packages: Package[];
  hasActiveCredits?: boolean;
}

const PackagesStoreClient = ({ user, packages, hasActiveCredits = false }: PackagesStoreClientProps): ReactElement => {

  const [paymentMethod, setPaymentMethod] = useState('swish');
  const [loading, setLoading] = useState(false);
  const [showSwishDialog, setShowSwishDialog] = useState(false);
  const [showQliroDialog, setShowQliroDialog] = useState(false);

  
  // Qliro availability state
  const [qliroAvailable, setQliroAvailable] = useState<boolean>(true);
  const [qliroStatusMessage, setQliroStatusMessage] = useState<string>('');
  const [qliroStatusLoading, setQliroStatusLoading] = useState<boolean>(true);
  const [notifyingPaid, setNotifyingPaid] = useState(false);
  const [paidNotified, setPaidNotified] = useState(false);
  const [swishPaymentData, setSwishPaymentData] = useState({
    amount: 0,
    message: '',
    swishNumber: process.env.NEXT_PUBLIC_SWISH_NUMBER || '1231231231',
    purchaseId: ''
  });
  const [qliroPaymentData] = useState({
    amount: 0,
    purchaseId: '',
    checkoutUrl: ''
  });

  useQliroListener({
    onCompleted: () => {
      if (qliroPaymentData.purchaseId) {
        try { window.location.href = `/qliro/return?ref=${encodeURIComponent(`package_${qliroPaymentData.purchaseId}`)}&status=paid` } catch {}
      }
    },
    onDeclined: (_, msg) => { toast.error(msg || 'Betalning nekades') }
  })

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



  const getSavingsPercentage = (pkg: Package): number => {
    const originalPrice = pkg.price;
    const effectivePrice = getEffectivePrice(pkg);
    if (effectivePrice < originalPrice) {
      return Math.round(((originalPrice - effectivePrice) / originalPrice) * 100);
    }
    return 0;
  };

  const handlePurchase = async (packageId: string): Promise<void> => {
    setLoading(true);
    try {
      // First, create invoice and get Betalhubben URL
      const invoiceResponse = await fetch('/api/packages/create-invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          packageId,
        }),
      });

      const invoiceData = await invoiceResponse.json();

      if (invoiceResponse.ok) {
        // Open Betalhubben with the created invoice
        const betalhubbenUrl = invoiceData.betalhubbenUrl;
        toast.success('Faktura skapad! Öppnar Betalhubben...');
        
        // Open Betalhubben in new tab/window
        window.open(betalhubbenUrl, '_blank');
        
        // Optionally redirect current page to show success
        setTimeout(() => {
          window.location.href = `/dashboard/student/fakturor`;
        }, 2000);
        
      } else {
        toast.error(invoiceData.error || 'Kunde inte skapa faktura');
      }
    } catch (error) {
      console.error('Purchase error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Ett fel uppstod vid skapande av köp';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Background listener for Qliro completion, redirect original page
  useEffect(() => {
    const listener = (event: MessageEvent) => {
      const data = event.data || {} as any
      const done = data && (data.type === 'qliro:completed' || data.event === 'payment_completed' || data.event === 'CheckoutCompleted' || data.status === 'Paid' || data.status === 'Completed')
      if (done && qliroPaymentData.purchaseId) {
        try { window.location.href = `/qliro/return?ref=${encodeURIComponent(`package_${qliroPaymentData.purchaseId}`)}&status=paid` } catch {}
      }
    }
    window.addEventListener('message', listener)
    return () => window.removeEventListener('message', listener)
  }, [qliroPaymentData.purchaseId])
  
  const handleSwishConfirm = async (purchaseId: string): Promise<void> => {
    try {
      // Notify admin like other Swish flows so they can clear/deny
      const res = await fetch('/api/packages/notify-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purchaseId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Kunde inte meddela admin');
      toast.success('Tack! Skolan har meddelats. Krediter aktiveras när betalningen verifierats.');
    } catch (e: any) {
      toast.error(e.message || 'Kunde inte meddela skolan');
    } finally {
      setShowSwishDialog(false);
    }
  };

  const handleQliroConfirm = async (): Promise<void> => {
    setShowQliroDialog(false);
    toast.success('Tack! Betalningen bekräftad. Omdirigerar...');
    try { window.location.href = '/booking/success?package=1'; } catch {}
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
        customMessage={swishPaymentData.message}
        mode="package"
        onConfirm={async () => {
          setNotifyingPaid(true);
          try {
            await handleSwishConfirm(swishPaymentData.purchaseId);
            setPaidNotified(true);
          } catch (error) {
            console.error('Failed to confirm Swish payment:', error);
          } finally {
            setNotifyingPaid(false);
          }
        }}
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
          <ShoppingCart className="inline-block mr-3 text-gray-500" />
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
                <Smartphone className="text-2xl" />
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
                  <CreditCard className="text-2xl" />
                  {qliroStatusLoading && <Loader2 className="text-sm animate-spin" />}
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

      {/* Inform user if they already have credits */}
      {hasActiveCredits && (
        <div className="max-w-3xl mx-auto mb-6">
          <div className="rounded-xl border border-amber-300/50 bg-amber-50 text-amber-900 p-4">
            <div className="font-semibold">Du har redan aktiva paketkrediter</div>
            <p className="text-sm mt-1">Köper du ett till paket läggs fler krediter till ditt konto.</p>
          </div>
        </div>
      )}

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
                    <Star className="text-amber-600" />
                    Populär
                  </div>
                </div>
              )}

              {/* Savings Badge */}
              {savings > 0 && (
                <div className="absolute top-4 left-4 z-10">
                  <div className="bg-green-100 text-green-700 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                    <Percent />
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
                        <Check className="text-green-500 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Payment Method Indicator */}
                <div className="mb-6 flex items-center justify-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <ShoppingCart className="text-blue-500" />
                  <span className="font-medium text-gray-700">Klicka 'Köp' för att skapa faktura och öppna Betalhubben</span>
                </div>

                {/* Purchase Button */}
                <Button
                  onClick={() => handlePurchase(pkg.id)}
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl font-semibold text-base transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" />
                      Skapar faktura...
                    </>
                  ) : (
                    <>
                      <ShoppingCart />
                      Köp
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
          <Gift className="text-5xl text-gray-400 mx-auto mb-3" />
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
              <Check className="text-2xl text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Flexibilitet</h3>
            <p className="text-gray-600">Använd dina credits när det passar dig bäst.</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star className="text-2xl text-purple-600" />
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
