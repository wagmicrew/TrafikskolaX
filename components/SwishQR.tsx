'use client';

import React, { useEffect, useState } from 'react';

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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!qrCodeUrl) {
    return (
      <div className={`text-center text-red-600 ${className}`}>
        <p>Kunde inte generera QR-kod</p>
      </div>
    );
  }

  return (
    <div className={`text-center ${className}`}>
      <div className="bg-white p-4 rounded-lg shadow-lg inline-block">
        <img 
          src={qrCodeUrl} 
          alt="Swish QR Code" 
          className="w-48 h-48 mx-auto"
        />
        <div className="mt-4 space-y-2">
          <p className="text-lg font-semibold text-gray-800">Swish-betalning</p>
          <p className="text-sm text-gray-600">Telefonnummer: {phoneNumber}</p>
          {amount && <p className="text-sm text-gray-600">Belopp: {amount} kr</p>}
          {message && <p className="text-sm text-gray-600">Meddelande: {message}</p>}
        </div>
      </div>
      <p className="text-sm text-gray-600 mt-3">
        Skanna QR-koden med din Swish-app eller tryck på den från din telefon
      </p>
    </div>
  );
}
