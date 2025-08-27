'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert } from 'flowbite-react';
import { Database, Loader2 } from 'lucide-react';

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
      <Card className="max-w-xl w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Database className="w-16 h-16 text-blue-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
            Tabeller saknas
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600 dark:text-gray-300">
            Tabeller för lektionsinnehåll saknas. Kör uppdateringarna eller migrations först.
          </p>

          {error && (
            <Alert color="failure" className="mb-4">
              {error}
            </Alert>
          )}

          <Button
            onClick={runMigration}
            disabled={isRunning}
            color="blue"
            className="w-full"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Kör...
              </>
            ) : (
              'Kör justeringar nu'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}



