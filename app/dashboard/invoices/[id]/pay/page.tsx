'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';

export default function PaymentRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.id as string;

  useEffect(() => {
    // Redirect to the new Payment Hub
    router.replace(`/betalhubben/${invoiceId}`);
  }, [invoiceId, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-900 font-medium">Omdirigerar till Betalhubben...</p>
      </div>
    </div>
  );
}