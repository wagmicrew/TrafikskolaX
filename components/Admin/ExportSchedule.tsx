'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  generateWeeklySchedulePdf,
  fetchWeeklyBookings,
  fetchDailyBookings,
  fetchAllFutureBookings,
  generateDailySchedulePdf,
  generateFutureSchedulePdf
} from '@/utils/pdfExport';
import { toast } from 'react-hot-toast';

interface ExportScheduleProps {
  userId?: string;
  role: 'admin' | 'teacher';
}

export default function ExportSchedule({ userId, role }: ExportScheduleProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleExport = async (type: string) => {
    setLoading(type);
    try {
      let bookings: any[] = [];
      let title = '';

      switch (type) {
        case 'daily':
          bookings = await fetchDailyBookings(userId, role);
          await generateDailySchedulePdf(bookings);
          title = 'Dagens Schema';
          break;
        case 'weekly':
          bookings = await fetchWeeklyBookings(userId, role);
          await generateWeeklySchedulePdf(bookings, 'Veckoschema');
          title = 'Veckoschema';
          break;
        case 'future':
          bookings = await fetchAllFutureBookings(userId, role);
          await generateFutureSchedulePdf(bookings, 'Kommande Schema');
          title = 'Kommande Schema';
          break;
        default:
          throw new Error('Okänd exporttyp');
      }

      toast.success(`${title} exporterad framgångsrikt!`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Fel vid export av schema');
    } finally {
      setLoading(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Exportera Schema</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            onClick={() => handleExport('daily')}
            disabled={loading !== null}
            className="w-full"
          >
            {loading === 'daily' ? 'Exporterar...' : 'Dagens Schema'}
          </Button>
          
          <Button
            onClick={() => handleExport('weekly')}
            disabled={loading !== null}
            className="w-full"
          >
            {loading === 'weekly' ? 'Exporterar...' : 'Veckoschema'}
          </Button>
          
          <Button
            onClick={() => handleExport('future')}
            disabled={loading !== null}
            className="w-full"
          >
            {loading === 'future' ? 'Exporterar...' : 'Kommande Schema'}
          </Button>
        </div>
        
        <p className="text-sm text-muted-foreground">
          Exportera ditt schema som PDF-fil. Schemat innehåller endast dagar med bokningar.
        </p>
      </CardContent>
    </Card>
  );
}
