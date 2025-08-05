'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, XCircle, CreditCard, ArrowLeft } from 'lucide-react';

export default function MockQliroCheckout() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const purchaseId = searchParams.get('purchase');
  const amount = searchParams.get('amount');

  const handlePaymentSuccess = async () => {
    setLoading(true);
    try {
      // Simulate payment confirmation
      const response = await fetch('/api/packages/confirm-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ purchaseId }),
      });

      if (response.ok) {
        router.push(`/packages-store/success?purchase=${purchaseId}`);
      } else {
        alert('Payment confirmation failed');
      }
    } catch (error) {
      console.error('Payment confirmation error:', error);
      alert('Payment confirmation error');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentCancel = () => {
    router.push(`/packages-store/cancel?purchase=${purchaseId}`);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Tillbaka
          </Button>
        </div>

        <Card className="mb-6">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <CreditCard className="w-6 h-6 text-blue-600" />
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                MOCK BETALNING
              </Badge>
            </div>
            <CardTitle>Qliro Checkout (Development Mode)</CardTitle>
            <CardDescription>
              Detta är en simulerad betalningssida för utveckling och testning
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">Beställningsdetaljer</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Köp-ID:</span>
                    <span className="font-mono text-xs">{purchaseId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Belopp:</span>
                    <span className="font-semibold">{amount} SEK</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Valuta:</span>
                    <span>SEK</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Betalningsmetod:</span>
                    <span>Qliro (Mock)</span>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                <h4 className="font-semibold text-amber-900 mb-2">⚠️ Utvecklingsläge</h4>
                <p className="text-sm text-amber-800">
                  Detta är en simulerad betalningssida. Inga riktiga betalningar kommer att behandlas.
                  Använd knapparna nedan för att simulera betalningsresultat.
                </p>
              </div>

              <div className="space-y-3 mt-6">
                <h4 className="font-semibold">Simulera betalningsresultat:</h4>
                
                <Button
                  onClick={handlePaymentSuccess}
                  disabled={loading}
                  className="w-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  {loading ? 'Behandlar...' : 'Simulera Lyckad Betalning'}
                </Button>

                <Button
                  onClick={handlePaymentCancel}
                  variant="outline"
                  className="w-full border-red-300 text-red-700 hover:bg-red-50 flex items-center justify-center gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  Simulera Avbruten Betalning
                </Button>
              </div>

              <div className="text-xs text-gray-500 mt-6 p-3 bg-gray-50 rounded">
                <strong>För utvecklare:</strong> I produktionsmiljön skulle denna sida ersättas av Qliros faktiska checkout-formulär.
                Nätverksfel eller otillgängliga Qliro-domäner triggar automatiskt denna fallback-läge för testning.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
