"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import toast from 'react-hot-toast';
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

// TinyMCE configuration
const TINYMCE_CONFIG = {
  height: 700,
  plugins: [
    'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
    'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
    'insertdatetime', 'media', 'table', 'help', 'wordcount', 'codesample',
    'emoticons', 'template', 'pagebreak', 'nonbreaking', 'visualchars',
    'quickbars', 'directionality', 'paste'
  ],
  toolbar: 'undo redo | formatselect | ' +
    'bold italic underline strikethrough | forecolor backcolor | ' +
    'alignleft aligncenter alignright alignjustify | ' +
    'bullist numlist outdent indent | blockquote | ' +
    'link image media table | code codesample | ' +
    'removeformat | help | preview fullscreen',
  toolbar_mode: 'sliding',
  toolbar_sticky: true,
  toolbar_sticky_offset: 0,
  menubar: 'edit view insert format tools table help',
  statusbar: true,
  elementpath: true,
  resize: true,

  // Improved content styling for markdown-like readability
  content_style: `
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      font-size: 16px;
      line-height: 1.7;
      color: #2c3e50;
      background-color: #ffffff;
      margin: 2rem;
      max-width: 800px;
      margin-left: auto;
      margin-right: auto;
    }

    /* Headings with clear hierarchy */
    h1 { font-size: 2.5rem; font-weight: 700; color: #1a202c; margin: 2rem 0 1rem 0; border-bottom: 3px solid #e2e8f0; padding-bottom: 0.5rem; }
    h2 { font-size: 2rem; font-weight: 600; color: #2d3748; margin: 1.8rem 0 1rem 0; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.5rem; }
    h3 { font-size: 1.5rem; font-weight: 600; color: #4a5568; margin: 1.6rem 0 0.8rem 0; }
    h4 { font-size: 1.25rem; font-weight: 600; color: #718096; margin: 1.4rem 0 0.6rem 0; }
    h5 { font-size: 1.1rem; font-weight: 600; color: #a0aec0; margin: 1.2rem 0 0.5rem 0; }
    h6 { font-size: 1rem; font-weight: 600; color: #cbd5e0; margin: 1rem 0 0.4rem 0; }

    /* Paragraphs and text */
    p { margin: 0 0 1.2rem 0; text-align: justify; }

    /* Lists */
    ul, ol { margin: 1rem 0; padding-left: 2rem; }
    li { margin: 0.5rem 0; }
    ul li::marker { color: #e53e3e; font-weight: bold; }
    ol li::marker { color: #3182ce; font-weight: bold; }

    /* Links */
    a { color: #3182ce; text-decoration: none; border-bottom: 2px solid transparent; transition: border-color 0.2s ease; }
    a:hover { border-bottom-color: #3182ce; }

    /* Code blocks */
    pre { background: #f7fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1.5rem; margin: 1.5rem 0; overflow-x: auto; }
    code { background: #f7fafc; color: #d53f8c; padding: 0.2rem 0.4rem; border-radius: 4px; font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace; font-size: 0.9em; }

    /* Blockquotes */
    blockquote { border-left: 4px solid #e53e3e; background: #fff5f5; padding: 1rem 1.5rem; margin: 1.5rem 0; font-style: italic; color: #742a2a; }

    /* Tables */
    table { border-collapse: collapse; width: 100%; margin: 1.5rem 0; }
    th, td { border: 1px solid #e2e8f0; padding: 0.75rem; text-align: left; }
    th { background: #f7fafc; font-weight: 600; color: #2d3748; }
    tr:nth-child(even) { background: #f8fafc; }

    /* Images */
    img { max-width: 100%; height: auto; border-radius: 8px; margin: 1rem 0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }

    /* Focus and selection */
    *:focus { outline: 2px solid #3182ce; outline-offset: 2px; }

    /* Print styles */
    @media print {
      body { background: white; color: black; margin: 0; }
      a { color: black; text-decoration: underline; }
    }
  `,

  // Enhanced image handling
  image_title: true,
  automatic_uploads: true,
  file_picker_types: 'image',
  images_upload_handler: async (blobInfo: any) => {
    try {
      const formData = new FormData();
      formData.append('file', blobInfo.blob(), blobInfo.filename());

      const response = await fetch('/api/admin/sideditor/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      return data.location;
    } catch (error) {
      toast.error('Bilduppladdning misslyckades');
      throw error;
    }
  },

  // Improved paste handling
  paste_as_text: false,
  paste_data_images: true,
  paste_retain_style_properties: 'all',
  paste_merge_formats: true,
  paste_auto_cleanup_on_paste: true,
  paste_remove_styles: false,
  paste_remove_styles_if_webkit: false,
  paste_strip_class_attributes: 'none',

  // Better mobile experience
  mobile: {
    theme: 'mobile',
    toolbar: ['undo', 'redo', 'bold', 'italic', 'link', 'image'],
    menubar: false
  },

  // Enhanced accessibility
  accessibility: {
    advtab: true,
    focus_skip: true
  },

  // Improved table handling
  table_default_attributes: {
    'border': '1',
    'cellpadding': '5',
    'cellspacing': '0'
  },
  table_default_styles: {
    'border-collapse': 'collapse',
    'width': '100%'
  },
  table_responsive_width: true,
  table_advtab: true,
  table_cell_advtab: true,
  table_row_advtab: true,
  table_resize_bars: true,
  table_style_by_css: false,

  // Enhanced code sample support
  codesample_global_prismjs: true,
  codesample_languages: [
    { text: 'HTML/XML', value: 'markup' },
    { text: 'CSS', value: 'css' },
    { text: 'JavaScript', value: 'javascript' },
    { text: 'TypeScript', value: 'typescript' },
    { text: 'Python', value: 'python' },
    { text: 'PHP', value: 'php' },
    { text: 'SQL', value: 'sql' },
    { text: 'JSON', value: 'json' },
    { text: 'Bash', value: 'bash' },
    { text: 'Markdown', value: 'markdown' }
  ],

  // Clean UI
  skin: 'oxide',
  content_css: '',
  branding: false,
  promotion: false,

  // Better UX
  contextmenu: 'link image table configurepermanentpen',
  quickbars_insert_toolbar: 'quickimage quicktable media codesample | blockquote hr',
  quickbars_selection_toolbar: 'bold italic underline strikethrough | h2 h3 blockquote quicklink',

  // Enhanced spell checking
  spellchecker_active: true,
  spellchecker_language: 'sv',
  spellchecker_languages: 'Swedish=sv,English=en',

  // Content editing restrictions - only allow content elements
  valid_elements: 'p[style],br,span[style],strong,b,em,i,u,strike,s,blockquote[style],ul,ol,li[style],h1[style],h2[style],h3[style],h4[style],h5[style],h6[style],a[href|target|title|style],img[src|alt|title|width|height|style],table[style],thead,tbody,tfoot,tr[style],th[style],td[style],caption[style],div[style|class],section[style|class],article[style|class],header[style|class],footer[style|class],aside[style|class],nav[style|class],main[style|class]',
  invalid_elements: 'script,style,meta,link,base,title,noscript,object,embed,applet,param,iframe,frame,frameset,noframes,area,map,form,input,button,select,textarea,fieldset,legend,label,optgroup,option,datalist,keygen,output,progress,meter,details,summary,command,menu,menuitem,dialog,video,audio,source,track,canvas,svg,math,template,slot',

  // Protect specific patterns and elements
  protect: [
    /<\?[\s\S]*?\?>/g,  // PHP code
    /<script[\s\S]*?<\/script>/gi,  // Script tags
    /<style[\s\S]*?<\/style>/gi,  // Style tags
    /<!--[\s\S]*?-->/g,  // HTML comments
    /\{\{[\s\S]*?\}\}/g,  // Template variables
    /<meta[\s\S]*?\/?>/gi,  // Meta tags
    /<link[\s\S]*?\/?>/gi,  // Link tags
    /<base[\s\S]*?\/?>/gi,  // Base tags
  ],

  // Extended valid elements for specific use cases
  extended_valid_elements: 'span[class|style],div[class|style],section[class|style],article[class|style],header[class|style],footer[class|style],aside[class|style],nav[class|style],main[class|style],figure[style],figcaption[style]',

  // Valid children - restrict nesting
  valid_children: '+body[p|div|section|article|h1|h2|h3|h4|h5|h6|ul|ol|blockquote|table|figure],+div[p|div|section|article|h1|h2|h3|h4|h5|h6|ul|ol|blockquote|table|figure],+section[p|div|section|article|h1|h2|h3|h4|h5|h6|ul|ol|blockquote|table|figure],+article[p|div|section|article|h1|h2|h3|h4|h5|h6|ul|ol|blockquote|table|figure]',

  // Improved performance
  cache_suffix: '?v=1.0.0',
  object_resizing: true,
  element_format: 'html',
  schema: 'html5',

  // Additional security and content restrictions
  allow_conditional_comments: false,
  allow_html_in_named_anchor: false,
  convert_fonts_to_spans: true,
  convert_urls: false,
  custom_elements: false,
  doctype: '<!DOCTYPE html>',
  element_format: 'html',
  encoding: 'utf-8',
  entities: '160,nbsp,161,iexcl,162,cent,163,pound,164,curren,165,yen,166,brvbar,167,sect,168,uml,169,copy,170,ordf,171,laquo,172,not,173,shy,174,reg,175,macr,176,deg,177,plusmn,178,sup2,179,sup3,180,acute,181,micro,182,para,183,middot,184,cedil,185,sup1,186,ordm,187,raquo,188,frac14,189,frac12,190,frac34,191,iquest,192,Agrave,193,Aacute,194,Acirc,195,Atilde,196,Auml,197,Aring,198,AElig,199,Ccedil,200,Egrave,201,Eacute,202,Ecirc,203,Euml,204,Igrave,205,Iacute,206,Icirc,207,Iuml,208,ETH,209,Ntilde,210,Ograve,211,Oacute,212,Ocirc,213,Otilde,214,Ouml,215,times,216,Oslash,217,Ugrave,218,Uacute,219,Ucirc,220,Uuml,221,Yacute,222,THORN,223,szlig,224,agrave,225,aacute,226,acirc,227,atilde,228,auml,229,aring,230,aelig,231,ccedil,232,egrave,233,eacute,234,ecirc,235,euml,236,igrave,237,iacute,238,icirc,239,iuml,240,eth,241,ntilde,242,ograve,243,oacute,244,ocirc,245,otilde,246,ouml,247,divide,248,oslash,249,ugrave,250,uacute,251,ucirc,252,uuml,253,yacute,254,thorn,255,yuml',

  // Force content to be cleaned and validated
  fix_list_elements: true,
  fix_table_elements: true,
  forced_root_block: 'p',
  forced_root_block_attrs: { 'class': 'content-paragraph' },
  remove_trailing_brs: true,
  verify_html: true
};

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
                    init={TINYMCE_CONFIG}
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
