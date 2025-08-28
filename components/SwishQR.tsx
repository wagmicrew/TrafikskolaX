'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';

interface SwishQRProps {
  phoneNumber: string;
  amount?: string;
  message?: string;
  className?: string;
  size?: number;
  format?: 'png' | 'jpg' | 'svg';
}

export default function SwishQR({ 
  phoneNumber, 
  amount = '', 
  message = '', 
  className = '',
  size = 300,
  format = 'png'
}: SwishQRProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  // Normalize Swish payee alias similar to server
  const normalizePayee = (input: string) => {
    try {
      let p = (input || '').toString().trim();
      p = p.replace(/\s+/g, '').replace(/^\+/, '');
      p = p.replace(/[^\d]/g, '');
      if (p.startsWith('46') && p.slice(2).startsWith('123')) p = p.slice(2);
      if (p.startsWith('123')) return p; // merchant alias
      if (p.startsWith('46')) return p;  // MSISDN already intl
      if (p.startsWith('0')) return '46' + p.slice(1);
      return '46' + p;
    } catch {
      return input;
    }
  };

  useEffect(() => {
    const generateQR = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Normalize phone or merchant alias
        const formattedPhone = normalizePayee(phoneNumber);
        
        // Prepare request payload
        const requestPayload: Record<string, unknown> = {
          format,
          size: Math.max(size ?? 300, 300),
          transparent: true,
          border: 0
        };
        
        // Add payee if phone number is provided
        if (formattedPhone) {
          requestPayload.payee = formattedPhone;
        }
        
        // Add amount if provided
        if (amount) {
          requestPayload.amount = amount;
        }
        
        // Add message if provided
        if (message) {
          requestPayload.message = message;
        }
        
        // Call our API endpoint to generate QR code
        const response = await fetch('/api/payments/swish/qr-code', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestPayload),
        });
        
        if (!response.ok) {
          throw new Error(`Failed to generate QR code: ${response.status}`);
        }
        
        // Get the image blob and create object URL
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        
        setQrCodeUrl(objectUrl);
        setLoading(false);
      } catch (error) {
        console.error('Error generating QR code:', error);
        setError(error instanceof Error ? error.message : 'Unknown error');
        setLoading(false);
      }
    };

    generateQR();
    
    // Cleanup object URL on unmount or re-generation
    return () => {
      if (qrCodeUrl) {
        URL.revokeObjectURL(qrCodeUrl);
      }
    };
  }, [phoneNumber, amount, message, size, format]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-200 border-t-green-600"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-6 h-6 bg-green-500 rounded-full animate-ping"></div>
          </div>
        </div>
        <p className="mt-4 text-green-600 font-medium">Genererar QR-kod...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center ${className}`}>
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 max-w-md mx-auto">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">❌</span>
          </div>
          <h3 className="text-lg font-semibold text-red-900 mb-2">QR-kod kunde inte genereras</h3>
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!qrCodeUrl) {
    return (
      <div className={`text-center text-red-600 ${className}`}>
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 max-w-md mx-auto">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h3 className="text-lg font-semibold text-red-900 mb-2">Kunde inte generera QR-kod</h3>
          <p className="text-red-700 text-sm">Försök igen eller använd manuella betalningsuppgifter nedan</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`text-center ${className}`}>
      {/* Enhanced QR Code Container */}
      <div className="relative bg-gradient-to-br from-white via-green-50 to-white p-6 rounded-2xl shadow-2xl border border-green-200 max-w-md mx-auto">
        {/* Decorative elements */}
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full animate-pulse"></div>
        <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-green-400 rounded-full animate-bounce"></div>

        {/* QR Code */}
        <div className="bg-white p-4 rounded-xl shadow-lg inline-block mb-4">
          <Image
            src={qrCodeUrl}
            alt="Swish QR Code"
            width={192}
            height={192}
            className="w-48 h-48 mx-auto drop-shadow-sm"
          />
        </div>

        {/* Payment Info */}
        <div className="space-y-3">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm">📱</span>
            </div>
            <h3 className="text-xl font-bold text-green-900">Swish-betalning</h3>
          </div>

          <div className="bg-green-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-green-700 font-medium">Telefonnummer:</span>
              <span className="font-mono text-green-900 bg-white px-2 py-1 rounded">{phoneNumber}</span>
            </div>
            {amount && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-green-700 font-medium">Belopp:</span>
                <span className="font-bold text-green-900 bg-white px-2 py-1 rounded">{amount} kr</span>
              </div>
            )}
            {message && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-green-700 font-medium">Meddelande:</span>
                <span className="text-green-900 bg-white px-2 py-1 rounded text-xs max-w-32 truncate" title={message}>{message}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-xl p-4 max-w-md mx-auto">
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-white text-xs">📱</span>
          </div>
          <div className="text-left">
            <h4 className="font-semibold text-blue-900 mb-2">Så här betalar du:</h4>
            <ol className="text-sm text-blue-800 space-y-1">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                Öppna din Swish-app
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                Välj "Scanna QR-kod"
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                Rikta kameran mot QR-koden ovan
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                Bekräfta betalningen i appen
              </li>
            </ol>
          </div>
        </div>
      </div>

      {/* Alternative method hint */}
      <p className="text-xs text-gray-600 mt-4 max-w-md mx-auto">
        💡 <strong>Tips:</strong> Om QR-koden inte fungerar, använd betalningsuppgifterna ovan manuellt i din Swish-app
      </p>
    </div>
  );
}
