'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';
import { Loader2, Save, Mail, AlertCircle, Eye, Pencil, Copy, Info, Zap, Image, Upload } from 'lucide-react';
import { Editor } from '@tinymce/tinymce-react';
import { SimpleEmailPreview } from './SimpleEmailPreview';
import { TriggerFlowPopup } from './TriggerFlowPopup';
import { TRIGGER_DEFINITIONS, getTriggerById, type TriggerDefinition } from '@/lib/email/trigger-definitions';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Schema for form validation
const templateFormSchema = z.object({
  id: z.string().optional(),
  triggerType: z.string().min(1, 'Välj en utlösare'),
  subject: z.string().min(1, 'Ämne krävs').max(200, 'För långt ämne (max 200 tecken)'),
  htmlContent: z.string().min(1, 'Innehåll krävs'),
  isActive: z.boolean().default(true),
  receivers: z.array(z.string()).min(1, 'Minst en mottagare krävs')
});

type TemplateFormValues = z.infer<typeof templateFormSchema>;

// Convert trigger definitions to options for select
const TRIGGER_TYPES = TRIGGER_DEFINITIONS.map(trigger => ({
  value: trigger.id,
  label: trigger.name,
  description: trigger.description,
  category: trigger.category,
  variables: trigger.availableVariables,
  receivers: trigger.defaultReceivers
}));

// Common variables available across templates
const COMMON_VARIABLES = [
  '{{user.firstName}}',
  '{{user.lastName}}',
  '{{user.email}}',
  '{{user.customerNumber}}',
  '{{appUrl}}',
  '{{schoolName}}',
  '{{schoolPhone}}',
  '{{schoolEmail}}',
];

// Available receiver types
const RECEIVER_TYPES = [
  { value: 'student', label: 'Elev' },
  { value: 'teacher', label: 'Lärare' },
  { value: 'admin', label: 'Administratör' },
  { value: 'supervisor', label: 'Handledare' },
  { value: 'school', label: 'Skola' },
  { value: 'specific_user', label: 'Specifik användare' },
];

export function EmailTemplateBuilder() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewContent, setPreviewContent] = useState<{ subject: string; html: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [templates, setTemplates] = useState<Array<{ id: string; triggerType: string; subject: string }>>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [activeTab, setActiveTab] = useState('edit');
  const [showTriggerPopup, setShowTriggerPopup] = useState(false);
  const [selectedTriggerInfo, setSelectedTriggerInfo] = useState<TriggerDefinition | null>(null);
  const [tinymceApiKey, setTinymceApiKey] = useState<string>('');
  const [isApiKeyLoading, setIsApiKeyLoading] = useState<boolean>(true);

  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      triggerType: '',
      subject: '',
      htmlContent: '',
      isActive: true,
      receivers: [],
    },
  });

  const { watch } = form;
  const watchHtmlContent = watch('htmlContent');
  const watchSubject = watch('subject');
  const watchTriggerType = watch('triggerType');
  const watchReceivers = watch('receivers');

  // Define preview handler BEFORE effects that depend on it to avoid TDZ issues
  const handlePreview = useCallback(async () => {
    if (!watchHtmlContent || !watchSubject) return;
    
    setIsPreviewLoading(true);
    try {
      const response = await fetch('/api/admin/email-templates/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateId: form.getValues('id'),
          htmlContent: watchHtmlContent,
          subject: watchSubject,
          testData: {
            // Add any test data specific to the trigger type
            triggerType: watchTriggerType,
            receivers: watchReceivers,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate preview');
      }

      const data = await response.json();
      if (data.success) {
        setPreviewContent(data.preview);
      }
    } catch (error) {
      console.error('Error generating preview:', error);
      toast.error('Kunde inte generera förhandsvisning');
    } finally {
      setIsPreviewLoading(false);
    }
  }, [watchHtmlContent, watchSubject, watchTriggerType, watchReceivers, form]);

  // Insert a variable token into the HTML content (append at the end)
  const insertVariable = useCallback((token: string) => {
    const current = form.getValues('htmlContent') || '';
    const space = current && !current.endsWith(' ') ? ' ' : '';
    form.setValue('htmlContent', `${current}${space}${token}`, { shouldDirty: true });
    toast.success('Variabel insatt');
  }, [form]);

  // Update trigger info when trigger type changes
  useEffect(() => {
    if (watchTriggerType) {
      const triggerInfo = getTriggerById(watchTriggerType as any);
      setSelectedTriggerInfo(triggerInfo || null);
      
      // Auto-populate default receivers if form is new
      if (triggerInfo && !form.getValues('id')) {
        form.setValue('receivers', triggerInfo.defaultReceivers);
      }
    }
  }, [watchTriggerType]);

  // Fetch TinyMCE API key from settings
  const fetchTinymceApiKey = useCallback(async () => {
    setIsApiKeyLoading(true);
    try {
      const response = await fetch('/api/admin/settings');
      if (response.ok) {
        const data = await response.json();
        const apiKey = data.settings?.tinymce_api_key || 'ctrftbh9mzgkawsuuql8861wbce1ubk5ptt4q775x8l4m4k6';
        console.log('Fetched TinyMCE API key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'none');
        setTinymceApiKey(apiKey);
      } else {
        console.error('Failed to fetch settings:', response.status);
      }
    } catch (error) {
      console.error('Error fetching TinyMCE API key:', error);
      // Use default API key as fallback
      setTinymceApiKey('ctrftbh9mzgkawsuuql8861wbce1ubk5ptt4q775x8l4m4k6');
    } finally {
      setIsApiKeyLoading(false);
    }
  }, []);

  // Load templates on component mount or when trigger type changes
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const response = await fetch('/api/admin/email-templates');
        if (!response.ok) {
          throw new Error('Failed to load templates');
        }
        const data = await response.json();
        setTemplates(data.templates);
      } catch (error) {
        console.error('Error loading templates:', error);
        toast.error('Kunde inte ladda mallar');
      } finally {
        setIsLoading(false);
      }
    };

    loadTemplates();
    fetchTinymceApiKey();
  }, [fetchTinymceApiKey]);

  // Update preview when form values change and we're on the preview tab
  useEffect(() => {
    if (activeTab === 'preview' && watchHtmlContent && watchSubject) {
      const debounceTimer = setTimeout(() => {
        handlePreview();
      }, 500);
      return () => clearTimeout(debounceTimer);
    }
  }, [activeTab, watchHtmlContent, watchSubject, handlePreview]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === 'preview' && !previewContent) {
      handlePreview();
    }
  };

  // Handle reset to standard templates
  const handleReset = useCallback(async () => {
    const response = await fetch('/api/admin/email-templates/seed-reminders', { 
      method: 'POST' 
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Kunde inte återställa mallar');
    }
    
    // Reload templates after reset
    const templatesResponse = await fetch('/api/admin/email-templates');
    let templatesData: any | undefined;
    if (templatesResponse.ok) {
      templatesData = await templatesResponse.json();
      setTemplates(templatesData.templates);
    }
    
    // Clear current form and reload if template was selected
    if (selectedTemplate && templatesData?.templates) {
      const updatedTemplate = templatesData.templates.find((t: any) => t.id === selectedTemplate);
      if (updatedTemplate) {
        // Load the updated template
        const templateResponse = await fetch(`/api/admin/email-templates/${selectedTemplate}`);
        if (templateResponse.ok) {
          const templateData = await templateResponse.json();
          form.reset(templateData);
          // Refresh preview if we're on preview tab
          if (activeTab === 'preview') {
            setTimeout(() => handlePreview(), 100);
          }
        }
      }
    }
  }, [selectedTemplate, activeTab, handlePreview, form]);

  // Handle template copying
  const handleCopyTemplate = useCallback(async () => {
    const currentValues = form.getValues();
    if (!currentValues.subject || !currentValues.htmlContent) {
      toast.error('Ingen mall att kopiera');
      return;
    }

    // Create copy with modified name
    const copyName = `${currentValues.subject} (kopia)`;
    
    form.reset({
      id: undefined, // Clear ID to create new template
      triggerType: '', // Clear trigger type for selection
      subject: copyName,
      htmlContent: currentValues.htmlContent,
      isActive: true,
      receivers: currentValues.receivers,
    });

    setSelectedTemplate('');
    toast.success('Mall kopierad - välj ny trigger och spara');
  }, [form]);

  // Handle trigger selection from popup
  const handleTriggerSelect = (trigger: TriggerDefinition) => {
    form.setValue('triggerType', trigger.id);
    form.setValue('receivers', trigger.defaultReceivers);
    setSelectedTriggerInfo(trigger);
    setShowTriggerPopup(false);
    toast.success(`Trigger vald: ${trigger.name}`);
  };

  // Handle form submission
  const onSubmit = useCallback(async (data: TemplateFormValues) => {
    setIsSaving(true);
    try {
      const method = data.id ? 'PUT' : 'POST';
      const url = data.id 
        ? `/api/admin/email-templates/${data.id}`
        : '/api/admin/email-templates';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Kunde inte spara mallen');
      
      const result = await response.json();
      toast.success('Mall sparad');
      
      // Update templates list without causing re-renders
      setTemplates(prev => {
        if (data.id) {
          return prev.map(t => t.id === data.id ? result : t);
        } else {
          return [...prev, result];
        }
      });
      
      // Update selected template and form
      if (!data.id) {
        setSelectedTemplate(result.id);
        form.reset(result);
      }
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Kunde inte spara mallen');
    } finally {
      setIsSaving(false);
    }
  }, [form]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-white text-gray-900 p-4 sm:p-6 rounded-lg">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">E-postmallar</h2>
        <Button onClick={() => form.reset()}>
          Ny mall
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Template list */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-gray-900 font-bold">Mallar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {templates.length === 0 ? (
                <p className="text-sm text-gray-700">Inga mallar hittades</p>
              ) : (
                templates.map((template) => (
                  <div
                    key={template.id}
                    className={`p-3 rounded-md cursor-pointer hover:bg-accent ${
                      selectedTemplate === template.id ? 'bg-accent' : ''
                    }`}
                    onClick={() => {
                      form.reset(template);
                      setSelectedTemplate(template.id);
                    }}
                  >
                    <div className="font-medium">
                      {TRIGGER_TYPES.find(t => t.value === template.triggerType)?.label || template.triggerType}
                    </div>
                    <div className="text-xs text-gray-700 truncate">
                      {template.subject}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Template editor */}
        <div className="lg:col-span-3 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-gray-900 font-bold">{form.watch('id') ? 'Redigera mall' : 'Skapa ny mall'}</CardTitle>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCopyTemplate}
                    disabled={!watchSubject || !watchHtmlContent}
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Kopiera mall
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowTriggerPopup(true)}
                  >
                    <Zap className="h-4 w-4 mr-1" />
                    Visa triggers
                  </Button>
                </div>
              </div>
            </CardHeader>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="space-y-4">
                <input type="hidden" {...form.register('id')} />
                
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Label className="text-gray-900 font-semibold">Utlösare</Label>
                    {selectedTriggerInfo && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button type="button" variant="ghost" size="sm">
                              <Info className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-md p-4 bg-white text-gray-900 border shadow-lg z-[70]">
                            <div className="space-y-2">
                              <p><strong>{selectedTriggerInfo.name}</strong></p>
                              <p className="text-sm">{selectedTriggerInfo.description}</p>
                              <p className="text-xs"><strong>Kategori:</strong> {selectedTriggerInfo.category}</p>
                              <p className="text-xs"><strong>Utlöses:</strong> {selectedTriggerInfo.whenTriggered}</p>
                              <p className="text-xs"><strong>Flödesposition:</strong> {selectedTriggerInfo.flowPosition}</p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                  <Select
                    value={form.watch('triggerType')}
                    onValueChange={(value) => form.setValue('triggerType', value)}
                    disabled={!!form.watch('id')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Välj en utlösare" />
                    </SelectTrigger>
                    <SelectContent className="z-[60] bg-white">
                      {TRIGGER_TYPES.map((trigger) => (
                        <SelectItem key={trigger.value} value={trigger.value}>
                          <div className="flex flex-col">
                            <span>{trigger.label}</span>
                            <span className="text-xs text-muted-foreground">{trigger.category}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedTriggerInfo && (
                    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <p className="text-sm text-blue-900 font-semibold mb-2">
                        Tillgängliga variabler för denna trigger:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {selectedTriggerInfo.availableVariables.map(variable => (
                          <button
                            key={variable}
                            type="button"
                            onClick={() => insertVariable(variable)}
                            className="text-sm font-mono bg-blue-100 text-blue-900 px-2.5 py-1 rounded-md border border-blue-300 cursor-pointer hover:bg-blue-200 transition"
                            aria-label={`Infoga variabel ${variable}`}
                          >
                            {variable}
                          </button>
                        ))}
                      </div>
                      <p className="text-sm text-blue-900 font-semibold mt-3 mb-2">
                        Allmänna variabler:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {COMMON_VARIABLES.map(variable => (
                          <button
                            key={variable}
                            type="button"
                            onClick={() => insertVariable(variable)}
                            className="text-sm font-mono bg-blue-100 text-blue-900 px-2.5 py-1 rounded-md border border-blue-300 cursor-pointer hover:bg-blue-200 transition"
                            aria-label={`Infoga variabel ${variable}`}
                          >
                            {variable}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={form.watch('isActive')}
                    onCheckedChange={(checked) => form.setValue('isActive', checked)}
                  />
                  <Label htmlFor="isActive" className="text-gray-900 font-semibold">Aktiv</Label>
                </div>

                <div>
                  <Label className="text-gray-900 font-semibold">Mottagare</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {RECEIVER_TYPES.map((receiver) => (
                      <div key={receiver.value} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`receiver-${receiver.value}`}
                          value={receiver.value}
                          checked={form.watch('receivers')?.includes(receiver.value) || false}
                          onChange={(e) => {
                            const currentReceivers = form.getValues('receivers') || [];
                            if (e.target.checked) {
                              form.setValue('receivers', [...currentReceivers, receiver.value]);
                            } else {
                              form.setValue(
                                'receivers',
                                currentReceivers.filter(r => r !== receiver.value)
                              );
                            }
                          }}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <Label htmlFor={`receiver-${receiver.value}`} className="text-gray-900">
                          {receiver.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-gray-900 font-semibold">Ämne</Label>
                  <Input
                    placeholder="Ämne för e-postmeddelandet"
                    className="text-gray-900 placeholder-gray-500"
                    {...form.register('subject')}
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center">
                    <Label className="text-gray-900 font-semibold">Innehåll</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button type="button" variant="ghost" size="sm">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            Variabler
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-md p-4 bg-white text-gray-900 border shadow-lg z-[70]">
                          <div className="space-y-2">
                            <p>Använd dessa variabler i din mall:</p>
                            <pre className="bg-gray-100 p-2 rounded text-xs">
                              {'{{user.firstName}} - Användarens förnamn\n'}
                              {'{{user.lastName}} - Användarens efternamn\n'}
                              {'{{user.email}} - Användarens e-post\n'}
                              {'{{booking.id}} - Boknings-ID\n'}
                              {'{{booking.scheduledDate}} - Bokningsdatum\n'}
                              {'{{schoolName}} - Skolans namn'}
                            </pre>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Textarea
                    className="min-h-[280px] mt-2 font-mono text-sm text-gray-900 placeholder-gray-500"
                    placeholder="Skriv ditt e-postinnehåll här..."
                    {...form.register('htmlContent')}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sparar...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Spara mall
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>

      <Tabs 
        value={activeTab} 
        onValueChange={handleTabChange}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2 max-w-md mx-4 mb-4">
          <TabsTrigger value="edit" className="flex items-center gap-2 text-gray-900 font-semibold">
            <Pencil className="h-4 w-4" />
            Redigera
          </TabsTrigger>
          <TabsTrigger 
            value="preview" 
            className="flex items-center gap-2 text-gray-900 font-semibold"
            disabled={!watchHtmlContent || !watchSubject}
          >
            <Eye className="h-4 w-4" />
            Förhandsgranska
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="edit" className="space-y-6">
          {/* Template editor */}
          <div className="lg:col-span-3 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-gray-900 font-bold">{form.watch('id') ? 'Redigera mall' : 'Skapa ny mall'}</CardTitle>
              </CardHeader>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardContent className="space-y-4">
                  <input type="hidden" {...form.register('id')} />
                  
                  <div>
                    <Label className="text-gray-900 font-semibold">Utlösare</Label>
                    <Select
                      value={form.watch('triggerType')}
                      onValueChange={(value) => form.setValue('triggerType', value)}
                      disabled={!!form.watch('id')}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Välj en utlösare" />
                      </SelectTrigger>
                      <SelectContent className="z-[60] bg-white">
                        {TRIGGER_TYPES.map((trigger) => (
                          <SelectItem key={trigger.value} value={trigger.value}>
                            {trigger.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isActive"
                      checked={form.watch('isActive')}
                      onCheckedChange={(checked) => form.setValue('isActive', checked)}
                    />
                    <Label htmlFor="isActive" className="text-gray-900 font-semibold">Aktiv</Label>
                  </div>

                  <div>
                    <Label className="text-gray-900 font-semibold">Mottagare</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {RECEIVER_TYPES.map((receiver) => (
                        <div key={receiver.value} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`receiver-${receiver.value}`}
                            value={receiver.value}
                            checked={form.watch('receivers')?.includes(receiver.value) || false}
                            onChange={(e) => {
                              const currentReceivers = form.getValues('receivers') || [];
                              if (e.target.checked) {
                                form.setValue('receivers', [...currentReceivers, receiver.value]);
                              } else {
                                form.setValue(
                                  'receivers',
                                  currentReceivers.filter(r => r !== receiver.value)
                                );
                              }
                            }}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <Label htmlFor={`receiver-${receiver.value}`} className="text-gray-900">
                            {receiver.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-gray-900 font-semibold">Ämne</Label>
                    <Input
                      placeholder="Ämne för e-postmeddelandet"
                      className="text-gray-900 placeholder-gray-500"
                      {...form.register('subject')}
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center">
                      <Label className="text-gray-900 font-semibold">Innehåll</Label>
                      <div className="flex items-center gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button type="button" variant="ghost" size="sm">
                              <AlertCircle className="h-4 w-4 mr-1" />
                              Variabler
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-md p-4 bg-white text-gray-900 border shadow-lg z-[70]">
                            <div className="space-y-2">
                              <p>Använd dessa variabler i din mall:</p>
                              <pre className="bg-gray-100 p-2 rounded text-xs">
                                {'{{user.firstName}} - Användarens förnamn\n'}
                                {'{{user.lastName}} - Användarens efternamn\n'}
                                {'{{user.email}} - Användarens e-post\n'}
                                {'{{booking.id}} - Boknings-ID\n'}
                                {'{{booking.scheduledDate}} - Bokningsdatum\n'}
                                {'{{schoolName}} - Skolans namn'}
                              </pre>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            // Insert a variable at cursor position
                            const editor = (window as any).tinymce?.activeEditor;
                            if (editor) {
                              const selectedText = editor.selection.getContent();
                              if (selectedText) {
                                editor.selection.setContent(`{{${selectedText}}}`);
                              } else {
                                editor.insertContent('{{variable}}');
                              }
                            }
                          }}
                        >
                          <Zap className="h-4 w-4 mr-1" />
                          Infoga variabel
                        </Button>
                    </div>
                    </div>
                    <div className="mt-2">
                      {isApiKeyLoading ? (
                        <div className="flex items-center justify-center h-96 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600"></div>
                            <span className="text-sm text-gray-600 dark:text-gray-400">Laddar TinyMCE...</span>
                          </div>
                        </div>
                      ) : (
                        <Editor
                          key={tinymceApiKey || 'no-api-key'}
                          apiKey={tinymceApiKey}
                          value={form.watch('htmlContent')}
                          onEditorChange={(content) => form.setValue('htmlContent', content)}
                          init={{
                            api_key: tinymceApiKey || undefined,
                          height: 500,
                          menubar: true,
                          plugins: [
                            'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                            'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                            'insertdatetime', 'media', 'table', 'help', 'wordcount', 'codesample',
                            'emoticons', 'template', 'pagebreak', 'nonbreaking', 'visualchars',
                            'quickbars', 'directionality', 'paste'
                          ],
                          toolbar: 'undo redo | blocks | ' +
                            'bold italic forecolor backcolor | alignleft aligncenter ' +
                            'alignright alignjustify | bullist numlist outdent indent | ' +
                            'removeformat | help | image media link | code | preview | fullscreen | ' +
                            'table | emoticons | codesample | template | pagebreak | ' +
                            'insertdatetime | searchreplace | visualblocks | ' +
                            'variables',
                          content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
                          images_upload_handler: async (blobInfo: any) => {
                            try {
                              const formData = new FormData();
                              formData.append('file', blobInfo.blob(), blobInfo.filename());

                              const response = await fetch('/api/admin/email-templates/upload-image', {
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
                          },
                          language: 'sv_SE',
                          skin: 'oxide-dark',
                          branding: false,
                          promotion: false,

                          // Content editing restrictions for email templates
                          valid_elements: 'p[style],br,span[style],strong,b,em,i,u,strike,s,blockquote[style],ul,ol,li[style],h1[style],h2[style],h3[style],h4[style],h5[style],h6[style],a[href|target|title|style],img[src|alt|title|width|height|style],table[style],thead,tbody,tfoot,tr[style],th[style],td[style],caption[style],div[style|class],hr[style]',
                          invalid_elements: 'script,style,meta,link,base,title,noscript,object,embed,applet,param,iframe,frame,frameset,noframes,area,map,form,input,button,select,textarea,fieldset,legend,label,optgroup,option,datalist,keygen,output,progress,meter,details,summary,command,menu,menuitem,dialog,video,audio,source,track,canvas,svg,math,template,slot',

                          // Protect template variables and important email elements
                          protect: [
                            /<\?[\s\S]*?\?>/g,  // PHP code
                            /<script[\s\S]*?<\/script>/gi,  // Script tags
                            /<style[\s\S]*?<\/style>/gi,  // Style tags
                            /<!--[\s\S]*?-->/g,  // HTML comments (but allow some)
                            /<meta[\s\S]*?\/?>/gi,  // Meta tags
                            /<link[\s\S]*?\/?>/gi,  // Link tags
                            /<base[\s\S]*?\/?>/gi,  // Base tags
                          ],

                          // Allow template variables but protect them from editing
                          extended_valid_elements: 'span[class|style],div[class|style],hr[style],code[style],pre[style]',

                          // Valid children for email structure
                          valid_children: '+body[p|div|h1|h2|h3|h4|h5|h6|ul|ol|blockquote|table|hr],+div[p|div|h1|h2|h3|h4|h5|h6|ul|ol|blockquote|table|hr]',

                          // Additional security for email templates
                          allow_conditional_comments: false,
                          allow_html_in_named_anchor: false,
                          convert_fonts_to_spans: true,
                          convert_urls: false,
                          custom_elements: false,
                          doctype: '<!DOCTYPE html>',
                          encoding: 'utf-8',

                          // Force content to be cleaned and validated
                          fix_list_elements: true,
                          fix_table_elements: true,
                          forced_root_block: 'p',
                          forced_root_block_attrs: { 'class': 'email-paragraph' },
                          remove_trailing_brs: true,
                          verify_html: true,
                          paste_data_images: true,
                          paste_as_text: false,
                          paste_word_valid_elements: "b,strong,i,em,h1,h2,h3,h4,h5,h6,p,ol,ul,li,a[href],span,color,font-size,font-color,font-family,mark,table,tr,td,th,tbody,thead,tfoot",
                          paste_retain_style_properties: "all",
                          paste_merge_formats: true,
                          paste_auto_cleanup_on_paste: true,
                          paste_remove_styles: false,
                          paste_remove_styles_if_webkit: false,
                          paste_strip_class_attributes: "none",
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
                          codesample_global_prismjs: true,
                          codesample_languages: [
                            { text: 'HTML/XML', value: 'markup' },
                            { text: 'JavaScript', value: 'javascript' },
                            { text: 'CSS', value: 'css' },
                            { text: 'PHP', value: 'php' },
                            { text: 'Ruby', value: 'ruby' },
                            { text: 'Python', value: 'python' },
                            { text: 'Java', value: 'java' },
                            { text: 'C', value: 'c' },
                            { text: 'C#', value: 'csharp' },
                            { text: 'C++', value: 'cpp' }
                          ],
                          // Custom setup for email templates
                          setup: function(editor: any) {
                            // Protect template variables from accidental editing
                            editor.on('BeforeSetContent', function(e: any) {
                              if (e.content) {
                                // Wrap template variables in a protective span to make them non-editable
                                e.content = e.content.replace(
                                  /\{\{([^}]+)\}\}/g,
                                  '<span class="template-variable" contenteditable="false" style="background: #e3f2fd; border: 1px solid #2196f3; border-radius: 4px; padding: 2px 6px; font-family: monospace; color: #1976d2; font-weight: bold; cursor: pointer;" title="Template variable - click to edit with Variables button">{{$1}}</span>'
                                );
                              }
                            });

                            // Restore template variables when getting content
                            editor.on('GetContent', function(e: any) {
                              if (e.content) {
                                e.content = e.content.replace(
                                  /<span class="template-variable"[^>]*>\{\{([^}]+)\}\}<\/span>/g,
                                  '{{$1}}'
                                );
                              }
                            });
                            editor.ui.registry.addButton('variables', {
                              text: 'Variabler',
                              tooltip: 'Infoga variabler',
                              icon: 'code',
                              onAction: function() {
                                const selectedText = editor.selection.getContent();
                                if (selectedText) {
                                  editor.selection.setContent(`{{${selectedText}}}`);
                                } else {
                                  editor.insertContent('{{variable}}');
                                }
                              }
                            });
                          },
                          // Email-specific templates
                          templates: [
                            {
                              title: 'Standard e-postmall',
                              description: 'Enkel e-postmall med grundläggande struktur',
                              content: '<h1>{{schoolName}}</h1><p>Hej {{user.firstName}},</p><p>Vi hoppas att detta meddelande når dig väl.</p><p>Med vänliga hälsningar,<br>{{schoolName}}</p><hr><p>{{schoolPhone}}<br>{{schoolEmail}}</p>'
                            },
                            {
                              title: 'Bokningsbekräftelse',
                              description: 'Mall för bokningsbekräftelser',
                              content: '<h1>Bokningsbekräftelse</h1><p>Hej {{user.firstName}},</p><p>Din bokning har bekräftats:</p><p><strong>Bokningsnummer:</strong> {{booking.id}}</p><p><strong>Datum:</strong> {{booking.scheduledDate}}</p><p><strong>Tid:</strong> {{booking.startTime}} - {{booking.endTime}}</p><p>Vi ser fram emot att träffa dig!</p><p>Med vänliga hälsningar,<br>{{schoolName}}</p>'
                            },
                            {
                              title: 'Påminnelse',
                              description: 'Mall för påminnelse-meddelanden',
                              content: '<h1>Påminnelse</h1><p>Hej {{user.firstName}},</p><p>Detta är en påminnelse om din kommande bokning:</p><p><strong>Datum:</strong> {{booking.scheduledDate}}</p><p><strong>Tid:</strong> {{booking.startTime}} - {{booking.endTime}}</p><p><strong>Bokningsnummer:</strong> {{booking.id}}</p><p>Med vänliga hälsningar,<br>{{schoolName}}</p>'
                            }
                          ],
                          // Email-specific styling with template variable protection
                          content_css: `
                            body {
                              font-family: Arial, sans-serif;
                              font-size: 14px;
                              line-height: 1.6;
                              color: #333;
                              margin: 0;
                              padding: 20px;
                            }

                            .dark body {
                              background-color: #1a1a1a;
                              color: #e0e0e0;
                            }

                            .email-header {
                              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                              color: white;
                              padding: 30px;
                              text-align: center;
                              border-radius: 10px;
                              margin-bottom: 20px;
                            }

                            .email-content {
                              background: #f9f9f9;
                              padding: 25px;
                              border-radius: 8px;
                              margin: 20px 0;
                            }

                            .email-footer {
                              text-align: center;
                              padding: 20px;
                              background: #f5f5f5;
                              font-size: 12px;
                              color: #666;
                              border-radius: 5px;
                            }

                            /* Template variable styling */
                            .template-variable {
                              background: #e3f2fd !important;
                              border: 1px solid #2196f3 !important;
                              border-radius: 4px !important;
                              padding: 2px 6px !important;
                              font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace !important;
                              color: #1976d2 !important;
                              font-weight: bold !important;
                              cursor: pointer !important;
                              user-select: all !important;
                              display: inline-block !important;
                              margin: 0 2px !important;
                            }

                            .template-variable:hover {
                              background: #bbdefb !important;
                              border-color: #1976d2 !important;
                            }

                            .dark .template-variable {
                              background: #1a237e !important;
                              border-color: #64b5f6 !important;
                              color: #64b5f6 !important;
                            }

                            .dark .template-variable:hover {
                              background: #283593 !important;
                              border-color: #42a5f5 !important;
                            }

                            /* Legacy variable class for compatibility */
                            .variable {
                              background: #e3f2fd;
                              border: 1px solid #2196f3;
                              border-radius: 3px;
                              padding: 2px 4px;
                              font-family: monospace;
                              color: #1976d2;
                            }

                            .dark .variable {
                              background: #1a237e;
                              border-color: #64b5f6;
                              color: #64b5f6;
                            }

                            /* Email paragraph styling */
                            .email-paragraph {
                              margin: 0 0 1rem 0;
                            }
                          `,
                          // Context menu for variables
                          contextmenu: 'variables',
                          // Quickbars for variables
                          quickbars_insert_toolbar: 'variables',
                          quickbars_selection_toolbar: 'bold italic | forecolor backcolor | variables'
                        }}
                        />
                      )}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sparar...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Spara mall
                      </>
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </div>
        </TabsContent>

        {/* Preview Tab Content */}
        <TabsContent value="preview" className="p-4">
          <SimpleEmailPreview 
            previewContent={previewContent}
            isLoading={isPreviewLoading}
            onRefresh={handlePreview}
            onReset={handleReset}
            showResetButton={true}
          />
        </TabsContent>
      </Tabs>

      {/* Trigger Flow Popup */}
      <TriggerFlowPopup
        open={showTriggerPopup}
        onClose={() => setShowTriggerPopup(false)}
        onSelectTrigger={handleTriggerSelect}
      />
    </div>
  );
}
