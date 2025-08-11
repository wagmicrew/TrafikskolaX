'use client';

import { useState } from 'react';

export default function MissingTablesClient() {
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runMigration = async () => {
    try {
      setIsRunning(true);
      setError(null);
      const res = await fetch('/api/admin/migrate/lesson-content', { method: 'POST' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || 'Misslyckades');
      }
      window.location.reload();
    } catch (e: any) {
      setError(e?.message || 'Misslyckades');
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl max-w-xl w-full p-6 text-white text-center">
        <h2 className="text-xl font-semibold mb-2">Tabeller saknas</h2>
        <p className="text-white/80 mb-4">Tabeller för lektionsinnehåll saknas. Kör uppdateringarna eller migrations först.</p>
        {error && <p className="text-rose-300 mb-3">{error}</p>}
        <button onClick={runMigration} disabled={isRunning} className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-600 text-white disabled:opacity-50">
          {isRunning ? 'Kör...' : 'Kör justeringar nu'}
        </button>
      </div>
    </div>
  );
}



