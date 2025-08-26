'use client';

import { LayoutGrid, Table } from 'lucide-react';
import { Button } from 'flowbite-react';

interface ViewToggleProps {
  view: 'cards' | 'table';
  onViewChange: (view: 'cards' | 'table') => void;
}

export function ViewToggle({ view, onViewChange }: ViewToggleProps) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">
        Visa som:
      </span>
      <div className="flex rounded-lg border border-gray-200 dark:border-gray-700">
        <Button
          size="sm"
          color={view === 'cards' ? 'blue' : 'light'}
          onClick={() => onViewChange('cards')}
          className={`flex items-center gap-2 rounded-l-lg border-0 ${view === 'cards' ? 'bg-blue-700 text-white' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700'}`}
        >
          <LayoutGrid className="w-4 h-4" />
          Kort
        </Button>
        <Button
          size="sm"
          color={view === 'table' ? 'blue' : 'light'}
          onClick={() => onViewChange('table')}
          className={`flex items-center gap-2 rounded-r-lg border-0 border-l border-gray-200 dark:border-gray-700 ${view === 'table' ? 'bg-blue-700 text-white' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700'}`}
        >
          <Table className="w-4 h-4" />
          Tabell
        </Button>
      </div>
    </div>
  );
}
