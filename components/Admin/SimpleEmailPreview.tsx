'use client';

import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function SimpleEmailPreview({ 
  previewContent, 
  isLoading, 
  onRefresh 
}: { 
  previewContent: { subject: string; html: string } | null;
  isLoading: boolean;
  onRefresh: () => void;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-md">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        <span className="sr-only">Laddar förhandsvisning...</span>
      </div>
    );
  }

  if (!previewContent) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-md p-4 text-center">
        <p className="text-gray-500 mb-4">Ingen förhandsvisning tillgänglig</p>
        <Button onClick={onRefresh} variant="outline">
          Uppdatera förhandsvisning
        </Button>
      </div>
    );
  }

  return (
    <div className="border rounded-md overflow-hidden">
      <div className="border-b p-2 bg-gray-50 flex justify-between items-center">
        <h3 className="font-medium">{previewContent.subject || 'Förhandsgranska e-post'}</h3>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onRefresh}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Uppdatera
        </Button>
      </div>
      
      <div className="h-[500px] overflow-auto">
        <div 
          className="p-4"
          dangerouslySetInnerHTML={{ __html: previewContent.html }} 
        />
      </div>
    </div>
  );
}
