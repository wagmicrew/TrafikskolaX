"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function EmailTemplateBuilderMinimal() {
  const [count, setCount] = useState(0);

  return (
    <div className="space-y-6 bg-white text-gray-900 p-4 sm:p-6 rounded-lg">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">E-postmallar (Minimal)</h2>
        <Button onClick={() => setCount(count + 1)}>
          Ny mall ({count})
        </Button>
      </div>

      <div className="text-center">
        <p>Minimal version for testing JSX compilation</p>
        <p>Count: {count}</p>
      </div>
    </div>
  );
}
