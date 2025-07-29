"use client";

import React, { useState } from 'react';
import {
  FaShoppingCart,
  FaEuroSign,
  FaCheck,
  FaStar,
  FaGift,
  FaPercent,
  FaCreditCard,
  FaMobileAlt,
  FaSpinner
} from 'react-icons/fa';
import Image from 'next/image';
import toast from 'react-hot-toast';

const PackagesStoreClient = ({ user, packages }) => {
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('swish');
  const [loading, setLoading] = useState(false);

  const getEffectivePrice = (pkg) => {
    if (pkg.salePrice) return pkg.salePrice;
    if (user.role === 'student' && pkg.priceStudent) return pkg.priceStudent;
    return pkg.price;
  };

  const getSavingsPercentage = (pkg) => {
    const originalPrice = pkg.price;
    const effectivePrice = getEffectivePrice(pkg);
    if (effectivePrice < originalPrice) {
      return Math.round(((originalPrice - effectivePrice) / originalPrice) * 100);
    }
    return 0;
  };

  const handlePurchase = async (packageId) => {
    setLoading(true);
    try {
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
          // Handle Swish payment
          window.open(data.swishUrl, '_blank');
          toast.success('Swish betalning initierad!');
        } else if (paymentMethod === 'qliro') {
          // Handle Qliro checkout
          window.location.href = data.checkoutUrl;
        }
      } else {
        toast.error(data.error || 'Något gick fel');
      }
    } catch (error) {
      toast.error('Nätverksfel vid betalning');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-purple-50 to-pink-100">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-gray-800 mb-4">
          <FaShoppingCart className="inline-block mr-4 text-purple-600" />
          Paketbutik
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Välj mellan våra populära paket och spara pengar på dina körlektioner!
        </p>
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
                    <FaEuroSign className="text-2xl text-green-600" />
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
                  <h4 className="font-semibold text-gray-800 mb-3">Ingår i paketet:</h4>
                  <ul className="space-y-2">
                    {pkg.contents.map((content) => (
                      <li key={content.id} className="flex items-center gap-2 text-sm">
                        <FaCheck className="text-green-500 flex-shrink-0" />
                        <span>
                          {content.lessonTypeName && content.credits 
                            ? `${content.credits}x ${content.lessonTypeName}`
                            : content.freeText
                          }
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Payment Methods */}
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-800 mb-3">Betalningsmetod:</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setPaymentMethod('swish')}
                      className={`p-3 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${
                        paymentMethod === 'swish'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <FaMobileAlt />
                      <span className="font-medium">Swish</span>
                    </button>
                    
                    <button
                      onClick={() => setPaymentMethod('qliro')}
                      className={`p-3 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${
                        paymentMethod === 'qliro'
                          ? 'border-purple-500 bg-purple-50 text-purple-700'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <FaCreditCard />
                      <span className="font-medium">Qliro</span>
                    </button>
                  </div>
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
              <FaEuroSign className="text-2xl text-green-600" />
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
