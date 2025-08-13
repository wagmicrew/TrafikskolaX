'use client';

import { Loader2, Eye, Code, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState, useEffect, useRef } from 'react';

interface EmailPreviewProps {
  previewContent: { subject: string; html: string } | null;
  isLoading: boolean;
  onRefresh: () => void;
  className?: string;
}

export function EmailPreview({ previewContent, isLoading, onRefresh, className = '' }: EmailPreviewProps) {
  const [activeTab, setActiveTab] = useState('preview');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Update iframe content when preview changes
  useEffect(() => {
    if (iframeRef.current && previewContent) {
      const iframe = iframeRef.current;
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      
      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(previewContent.html);
        iframeDoc.close();
      }
    }
  }, [previewContent]);

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center h-64 bg-gray-50 rounded-md ${className}`}>
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        <span className="sr-only">Laddar förhandsvisning...</span>
      </div>
    );
  }

  if (!previewContent) {
    return (
      <div className={`flex flex-col items-center justify-center h-64 bg-gray-50 rounded-md p-4 text-center ${className}`}>
        <p className="text-gray-500 mb-4">Ingen förhandsvisning tillgänglig</p>
        <Button onClick={onRefresh} variant="outline">
          Uppdatera förhandsvisning
        </Button>
      </div>
    );
  }

  return (
    <div className={`border rounded-md overflow-hidden ${className}`}>
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
      
      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Förhandsgranska
          </TabsTrigger>
          <TabsTrigger value="html" className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            HTML-kod
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="preview" className="m-0">
          <div className="h-[500px] overflow-auto">
            <iframe
              ref={iframeRef}
              title="E-postförhandsvisning"
              className="w-full h-full border-0"
              sandbox="allow-same-origin"
            />
          </div>
        </TabsContent>
        
        <TabsContent value="html" className="m-0">
          <pre className="h-[500px] overflow-auto p-4 bg-gray-900 text-gray-100 text-sm">
            <code>{previewContent.html}</code>
          </pre>
        </TabsContent>
      </Tabs>
    </div>
  );
}
