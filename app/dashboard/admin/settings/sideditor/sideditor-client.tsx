"use client";

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import toast from 'react-hot-toast';
import { createSideEditorConfig } from '@/lib/tinymce-config';
import {
  Save,
  Eye,
  Edit3,
  FileText,
  Image,
  Upload,
  AlertTriangle,
  CheckCircle,
  Loader2,
  RefreshCw,
  Copy,
  Settings
} from 'lucide-react';

const Editor = dynamic(() => import('@tinymce/tinymce-react').then(m => m.Editor), { ssr: false }) as any;

// Page configurations
const PAGE_CONFIGS = {
  'om-oss': {
    title: 'Om oss',
    path: 'app/om-oss/page.tsx',
    description: 'Sidan som presenterar vår trafikskola och våra tjänster'
  },
  'vara-tjanster': {
    title: 'Våra Tjänster',
    path: 'app/vara-tjanster/page.tsx',
    description: 'Sidan med detaljerad information om våra tjänster och priser'
  },
  'lokalerna': {
    title: 'Våra Lokaler',
    path: 'app/lokalerna/page.tsx',
    description: 'Sidan som visar våra lokaler och faciliteter'
  }
};

// Create side editor configuration with UTF-8 support
const getSideEditorConfig = (apiKey: string) => createSideEditorConfig(apiKey, async (blobInfo: any) => {
  try {
    const formData = new FormData();
    formData.append('file', blobInfo.blob(), blobInfo.filename());

    const response = await fetch('/api/admin/sideditor/upload-image', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Bilduppladdning misslyckades');
    }

    const data = await response.json();
    return data.location;
  } catch (error) {
    toast.error('Bilduppladdning misslyckades');
    throw error;
  }
});

interface PageContent {
  title: string;
  content: string;
  lastModified?: string;
}

export default function SideditorClient() {
  const [selectedPage, setSelectedPage] = useState<string>('');
  const [pageContent, setPageContent] = useState<PageContent>({ title: '', content: '' });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [editorContent, setEditorContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [tinymceApiKey, setTinymceApiKey] = useState<string>('');
  const [isApiKeyLoading, setIsApiKeyLoading] = useState<boolean>(true);

  // Fetch TinyMCE API key from settings
  const fetchTinymceApiKey = useCallback(async () => {
    setIsApiKeyLoading(true);
    try {
      const response = await fetch('/api/admin/settings');
      if (response.ok) {
        const data = await response.json();
        const apiKey = data.settings?.tinymce_api_key || 'ctrftbh9mzgkawsuuql8861wbce1ubk5ptt4q775x8l4m4k6';
        console.log('Sideditor - Fetched TinyMCE API key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'none');
        setTinymceApiKey(apiKey);
      } else {
        console.error('Sideditor - Failed to fetch settings:', response.status);
      }
    } catch (error) {
      console.error('Sideditor - Error fetching TinyMCE API key:', error);
      // Use default API key as fallback
      setTinymceApiKey('ctrftbh9mzgkawsuuql8861wbce1ubk5ptt4q775x8l4m4k6');
    } finally {
      setIsApiKeyLoading(false);
    }
  }, []);

  // Load page content
  const loadPageContent = useCallback(async (pageId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/sideditor/load-page?page=${pageId}`);
      if (!response.ok) {
        throw new Error('Kunde inte ladda sidinnehåll');
      }
      const data = await response.json();
      setPageContent(data);
      setEditorContent(data.content);
      setOriginalContent(data.content);
      toast.success(`Sidan "${PAGE_CONFIGS[pageId as keyof typeof PAGE_CONFIGS]?.title}" laddad`);
    } catch (error) {
      console.error('Error loading page:', error);
      toast.error('Kunde inte ladda sidinnehåll');
    } finally {
      setLoading(false);
    }
  }, []);

  // Save page content
  const savePageContent = useCallback(async () => {
    if (!selectedPage || !editorContent) {
      toast.error('Välj en sida och ange innehåll');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/admin/sideditor/save-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page: selectedPage,
          content: editorContent,
          title: pageContent.title
        }),
      });

      if (!response.ok) {
        throw new Error('Kunde inte spara sidan');
      }

      const data = await response.json();
      setPageContent(prev => ({ ...prev, lastModified: data.lastModified }));
      setOriginalContent(editorContent);
      toast.success(`Sidan "${PAGE_CONFIGS[selectedPage as keyof typeof PAGE_CONFIGS]?.title}" sparad`);
    } catch (error) {
      console.error('Error saving page:', error);
      toast.error('Kunde inte spara sidan');
    } finally {
      setSaving(false);
    }
  }, [selectedPage, editorContent, pageContent.title]);

  // Handle page selection
  const handlePageSelect = (pageId: string) => {
    if (editorContent !== originalContent && editorContent.trim()) {
      if (!confirm('Du har osparade ändringar. Vill du fortsätta utan att spara?')) {
        return;
      }
    }
    setSelectedPage(pageId);
    loadPageContent(pageId);
  };

  // Handle editor content change
  const handleEditorChange = (content: string) => {
    setEditorContent(content);
  };

  // Check for unsaved changes
  const hasUnsavedChanges = editorContent !== originalContent && editorContent.trim().length > 0;

  // Fetch API key on component mount
  useEffect(() => {
    fetchTinymceApiKey();
  }, [fetchTinymceApiKey]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-800 dark:text-slate-100 mb-2">
            📝 Sideditor
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-300">
            Markdown-stil redigering för webbplatsens sidor
          </p>
        </div>

        {/* Page Selection */}
        <Card className="shadow-xl border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-xl font-semibold text-slate-800 dark:text-slate-100">
              <FileText className="w-6 h-6 text-blue-600" />
              Välj sida att redigera
            </CardTitle>
            <CardDescription className="text-base text-slate-600 dark:text-slate-300">
              Välj vilken sida du vill redigera med den förbättrade WYSIWYG-editorn
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Object.entries(PAGE_CONFIGS).map(([pageId, config]) => (
                <Card
                  key={pageId}
                  className={`cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 border-2 ${
                    selectedPage === pageId
                      ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50 dark:bg-blue-950/50 shadow-blue-100 dark:shadow-blue-900/50'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800'
                  }`}
                  onClick={() => handlePageSelect(pageId)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-1">
                          {config.title}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                          {config.description}
                        </p>
                      </div>
                      {selectedPage === pageId && (
                        <CheckCircle className="w-6 h-6 text-blue-600 flex-shrink-0 ml-3" />
                      )}
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        📄 {config.title}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Editor */}
        {selectedPage && (
          <Card className="shadow-xl border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
            <CardHeader className="pb-4 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                    <Edit3 className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                      Redigera: {PAGE_CONFIGS[selectedPage as keyof typeof PAGE_CONFIGS]?.title}
                    </CardTitle>
                    <CardDescription className="text-base text-slate-600 dark:text-slate-300 mt-1">
                      Använd den förbättrade WYSIWYG-editorn för att redigera sidans innehåll med markdown-stil formatering
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {hasUnsavedChanges && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg border border-yellow-300 dark:border-yellow-700">
                      <AlertTriangle className="w-5 h-5 text-yellow-600" />
                      <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                        Osparade ändringar
                      </span>
                    </div>
                  )}
                  <Button
                    onClick={() => setShowPreview(true)}
                    variant="outline"
                    size="lg"
                    className="border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700"
                  >
                    <Eye className="w-5 h-5 mr-2" />
                    Förhandsgranska
                  </Button>
                  <Button
                    onClick={savePageContent}
                    disabled={saving || !hasUnsavedChanges}
                    size="lg"
                    className={`font-semibold transition-all duration-200 ${
                      hasUnsavedChanges
                        ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl'
                        : 'bg-slate-400 dark:bg-slate-600 text-slate-200 cursor-not-allowed'
                    }`}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Sparar...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5 mr-2" />
                        Spara ändringar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {loading || isApiKeyLoading ? (
                <div className="flex flex-col items-center justify-center h-96 bg-slate-50 dark:bg-slate-900/50 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    <div className="text-center">
                      <p className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                        Laddar editor...
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        Förbereder TinyMCE med API-nyckel
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden shadow-inner">
                  <Editor
                    key={tinymceApiKey || 'no-api-key'}
                    apiKey={tinymceApiKey}
                    value={editorContent}
                    onEditorChange={handleEditorChange}
                    init={getSideEditorConfig(tinymceApiKey)}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center py-8">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-white/60 dark:bg-slate-800/60 rounded-full backdrop-blur-sm border border-slate-200 dark:border-slate-700">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              ✨ Förbättrad redigeringsupplevelse med markdown-stil formatering
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
