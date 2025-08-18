"use client"

import { Suspense } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Laddar...</div>}>
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md text-center">
          <h1 className="text-4xl font-bold text-red-600 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Sidan hittades inte</h2>
          <p className="text-gray-600 mb-6">Tyvärr kunde vi inte hitta sidan du letar efter.</p>
          <div className="flex flex-col space-y-2">
            <Link href="/">
              <Button className="w-full bg-red-600 hover:bg-red-700">
                Gå till startsidan
              </Button>
            </Link>
            <Button 
              variant="outline" 
              className="w-full border-red-600 text-red-600 hover:bg-red-50"
              onClick={() => window.history.back()}
            >
              Gå tillbaka
            </Button>
          </div>
        </div>
      </div>
    </Suspense>
  );
}
