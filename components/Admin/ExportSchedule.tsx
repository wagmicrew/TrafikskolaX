'use client';

import { useState } from 'react';
import { ExportButton } from '@/components/ui/ExportButton';
import { 
  fetchDailyBookings, 
  fetchWeeklyBookings, 
  fetchAllFutureBookings,
  generateWeeklySchedulePdf 
} from '@/utils/pdfExport';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Download, Calendar, CalendarDays, CalendarRange } from 'lucide-react';

interface ExportScheduleProps {
  userId?: string;
  className?: string;
}

export const ExportSchedule: React.FC<ExportScheduleProps> = ({ userId, className = '' }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState<'daily' | 'weekly' | 'all'>('weekly');

  const handleExport = async (type: 'daily' | 'weekly' | 'all') => {
    try {
      setIsExporting(true);
      setExportType(type);
      
      let bookings;
      let title = '';
      
      switch (type) {
        case 'daily':
          bookings = await fetchDailyBookings(userId, 'admin');
          title = 'Dagens Schema';
          break;
        case 'all':
          bookings = await fetchAllFutureBookings(userId, 'admin');
          title = 'Alla Kommande Bokningar';
          break;
        case 'weekly':
        default:
          bookings = await fetchWeeklyBookings(userId, 'admin');
          title = 'Veckoschema';
          break;
      }
      
      generateWeeklySchedulePdf(bookings, title);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Kunde inte exportera schemat. Försök igen senare.');
    } finally {
      setIsExporting(false);
    }
  };

  const getButtonLabel = () => {
    switch (exportType) {
      case 'daily':
        return 'Dagens Schema';
      case 'all':
        return 'Alla Kommande';
      case 'weekly':
      default:
        return 'Veckoschema';
    }
  };

  return (
    <div className={`flex gap-2 ${className}`}>
      <Button 
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={() => handleExport(exportType)}
        disabled={isExporting}
      >
        {isExporting ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Exporterar...
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            Exportera
          </>
        )}
      </Button>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="px-2">
            <span className="sr-only">Visa fler exportalternativ</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m6 9 6 6 6-6"/>
            </svg>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleExport('daily')}>
            <Calendar className="mr-2 h-4 w-4" />
            <span>Dagens Schema</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExport('weekly')}>
            <CalendarDays className="mr-2 h-4 w-4" />
            <span>Veckoschema</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExport('all')}>
            <CalendarRange className="mr-2 h-4 w-4" />
            <span>Alla Kommande</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
