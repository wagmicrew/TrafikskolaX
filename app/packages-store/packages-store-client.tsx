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
  FaCopy,
  FaCheckCircle,
  FaEuroSign
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
            message: `Paket: ${pkg.name}`,
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
    try {
      const statusResponse = await fetch('/api/packages/confirm-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purchaseId }),
      });
      
      if (statusResponse.ok) {
        toast.success('Tack för din betalning! Dina krediter kommer att aktiveras så snart vi bekräftar betalningen.');
      } else {
        const errorData = await statusResponse.json();
        throw new Error(errorData.error || 'Kunde inte bekräfta betalningen');
      }
    } catch (error) {
      console.error('Payment confirmation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Ett fel uppstod vid bekräftelse av betalning';
      toast.error(errorMessage);
    }
  };

  const handleQliroConfirm = async (): Promise<void> => {
    setShowQliroDialog(false);
    toast.success('Du omdirigeras till Qliro för att slutföra betalningen.');
  };

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-purple-50 to-pink-100">
      {/* Swish Payment Dialog */}
      <SwishPaymentDialog
        isOpen={showSwishDialog}
        onClose={() => setShowSwishDialog(false)}
        booking={{
          id: swishPaymentData.purchaseId,
          totalPrice: swishPaymentData.amount
        }}
        onConfirm={() => handleSwishConfirm(swishPaymentData.purchaseId)}
      />
      
      {/* Qliro Payment Dialog */}
      <QliroPaymentDialog
        isOpen={showQliroDialog}
        onClose={() => setShowQliroDialog(false)}
        purchaseId={qliroPaymentData.purchaseId}
        amount={qliroPaymentData.amount}
        checkoutUrl={qliroPaymentData.checkoutUrl}
        onConfirm={handleQliroConfirm}
      />
      
      {/* Main Content */}
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-5xl font-bold text-gray-800 mb-4">
          <FaShoppingCart className="inline-block mr-4 text-purple-600" />
          Paketbutik
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
          Välj mellan våra populära paket och spara pengar på dina körlektioner!
        </p>
        
        {/* Payment Method Selector - Moved to top */}
        <div className="bg-white p-6 rounded-xl shadow-lg mb-12 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Välj betalningsmetod</h2>
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
            <button
              onClick={() => setPaymentMethod('swish')}
              className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-2 ${
                paymentMethod === 'swish'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <FaMobileAlt className="text-2xl" />
              <span className="font-medium">Swish</span>
            </button>
            
            <button
              onClick={() => setPaymentMethod('qliro')}
              className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-2 ${
                paymentMethod === 'qliro'
                  ? 'border-purple-500 bg-purple-50 text-purple-700'
                  : 'border-gray-200 hover:border-purple-300'
              }`}
            >
              <FaCreditCard className="text-2xl" />
              <span className="font-medium">Qliro</span>
            </button>
          </div>
        </div>
      </div>

      {/* Packages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {packages.map((pkg) => {
          const effectivePrice = getEffectivePrice(pkg);
          const savings = getSavingsPercentage(pkg);
          const isPopular = savings > 15;

          return (
            <div 
              key={pkg.id} 
              className={`relative bg-white rounded-2xl shadow-xl overflow-hidden transform hover:scale-105 transition-all duration-300 ${
                isPopular ? 'ring-4 ring-purple-500' : ''
              }`}
            >
              {/* Popular Badge */}
              {isPopular && (
                <div className="absolute top-4 right-4 z-10">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                    <FaStar className="text-yellow-300" />
                    POPULÄR
                  </div>
                </div>
              )}

              {/* Savings Badge */}
              {savings > 0 && (
                <div className="absolute top-4 left-4 z-10">
                  <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                    <FaPercent />
                    SPARA {savings}%
                  </div>
                </div>
              )}

              <div className="p-6">
                {/* Package Header */}
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">{pkg.name}</h3>
                  <p className="text-gray-600">{pkg.description}</p>
                </div>

                {/* Price */}
                <div className="text-center mb-6">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <span className="text-4xl font-bold text-gray-800">{effectivePrice}</span>
                    <span className="text-xl text-gray-600">kr</span>
                  </div>
                  
                  {savings > 0 && (
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-sm text-gray-500 line-through">{pkg.price} kr</span>
                      <span className="text-sm text-green-600 font-semibold">
                        Du sparar {pkg.price - effectivePrice} kr!
                      </span>
                    </div>
                  )}
                </div>

                {/* Package Contents */}
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-800 mb-3">Innehåller:</h4>
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
                <div className="mb-6 flex items-center justify-center gap-2 p-3 bg-gray-50 rounded-lg">
                  {paymentMethod === 'swish' ? (
                    <>
                      <FaMobileAlt className="text-blue-500" />
                      <span className="font-medium text-gray-700">Betalas med Swish</span>
                    </>
                  ) : (
                    <>
                      <FaCreditCard className="text-purple-500" />
                      <span className="font-medium text-gray-700">Betalas med Qliro</span>
                    </>
                  )}
                </div>

                {/* Purchase Button */}
                <button
                  onClick={() => handlePurchase(pkg.id)}
                  disabled={loading}
                  className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${
                    isPopular
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {loading ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      Bearbetar...
                    </>
                  ) : (
                    <>
                      <FaShoppingCart />
                      Köp Nu
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {packages.length === 0 && (
        <div className="text-center py-16">
          <FaGift className="text-6xl text-gray-400 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-600 mb-2">Inga paket tillgängliga</h3>
          <p className="text-gray-500">Kom tillbaka senare för fantastiska erbjudanden!</p>
        </div>
      )}

      {/* Info Section */}
      <div className="max-w-4xl mx-auto mt-16 bg-white rounded-2xl shadow-lg p-8">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
          Varför välja våra paket?
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl text-green-600">kr</span>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Spara Pengar</h3>
            <p className="text-gray-600">
              Få mer värde för dina pengar med våra paketpriser
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaCheck className="text-2xl text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Flexibilitet</h3>
            <p className="text-gray-600">
              Använd dina credits när det passar dig bäst
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaStar className="text-2xl text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Kvalitet</h3>
            <p className="text-gray-600">
              Samma höga kvalitet på alla våra lektioner
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PackagesStoreClient;
