'use client';

import { ArrowLeft } from 'lucide-react';

export default function BackButton() {
  const handleBack = () => {
    window.history.back();
  };

  return (
    <button
      onClick={handleBack}
      className="flex items-center gap-2 mb-6 text-gray-600 hover:text-gray-900 transition-colors"
    >
      <ArrowLeft className="w-5 h-5" />
      Tillbaka
    </button>
  );
}
