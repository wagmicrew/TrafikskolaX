'use client';

'use client';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Loader2, Save, Mail, AlertCircle, Eye, Pencil, Copy, Info, Zap } from 'lucide-react';
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
  }, [watchTriggerType, form]);

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
  }, []);

  // Update preview when form values change and we're on the preview tab
  useEffect(() => {
    if (activeTab === 'preview' && watchHtmlContent && watchSubject) {
      const debounceTimer = setTimeout(() => {
        handlePreview();
      }, 500);
      return () => clearTimeout(debounceTimer);
    }
  }, [watchHtmlContent, watchSubject, watchTriggerType, watchReceivers, activeTab]);

  const handlePreview = async () => {
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
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === 'preview' && !previewContent) {
      handlePreview();
    }
  };

  // Handle reset to standard templates
  const handleReset = async () => {
    const response = await fetch('/api/admin/email-templates/seed-reminders', { 
      method: 'POST' 
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Kunde inte återställa mallar');
    }
    
    // Reload templates after reset
    const templatesResponse = await fetch('/api/admin/email-templates');
    if (templatesResponse.ok) {
      const templatesData = await templatesResponse.json();
      setTemplates(templatesData.templates);
    }
    
    // Clear current form and reload if template was selected
    if (selectedTemplate) {
      const updatedTemplate = templatesData.templates.find((t: any) => t.id === selectedTemplate);
      if (updatedTemplate) {
        // Load the updated template
        const templateResponse = await fetch(`/api/admin/email-templates/${selectedTemplate}`);
        if (templateResponse.ok) {
          const templateData = await templateResponse.json();
          form.reset(templateData);
          // Refresh preview if we're on preview tab
          if (activeTab === 'preview') {
            setTimeout(handlePreview, 100);
          }
        }
      }
    }
  };

  // Handle template copying
  const handleCopyTemplate = async () => {
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
  };

  // Handle trigger selection from popup
  const handleTriggerSelect = (trigger: TriggerDefinition) => {
    form.setValue('triggerType', trigger.id);
    form.setValue('receivers', trigger.defaultReceivers);
    setSelectedTriggerInfo(trigger);
    setShowTriggerPopup(false);
    toast.success(`Trigger vald: ${trigger.name}`);
  };

  // Handle form submission
  const onSubmit = async (data: TemplateFormValues) => {
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
      
      // Update templates list
      if (data.id) {
        setTemplates(templates.map(t => t.id === data.id ? result : t));
      } else {
        setTemplates([...templates, result]);
        setSelectedTemplate(result.id);
        form.reset(result);
      }
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Kunde inte spara mallen');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">E-postmallar</h2>
        <Button onClick={() => form.reset()}>
          Ny mall
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Template list */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Mallar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {templates.length === 0 ? (
                <p className="text-sm text-muted-foreground">Inga mallar hittades</p>
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
                    <div className="text-xs text-muted-foreground truncate">
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
                <CardTitle>{form.watch('id') ? 'Redigera mall' : 'Skapa ny mall'}</CardTitle>
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
                    <Label>Utlösare</Label>
                    {selectedTriggerInfo && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button type="button" variant="ghost" size="sm">
                              <Info className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-md p-4">
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
                    <SelectContent>
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
                      <p className="text-sm text-blue-800 mb-2">
                        <strong>Tillgängliga variabler för denna trigger:</strong>
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {selectedTriggerInfo.availableVariables.map(variable => (
                          <span key={variable} className="text-xs font-mono bg-blue-100 px-2 py-1 rounded">
                            {variable}
                          </span>
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
                  <Label htmlFor="isActive">Aktiv</Label>
                </div>

                <div>
                  <Label>Mottagare</Label>
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
                        <Label htmlFor={`receiver-${receiver.value}`}>
                          {receiver.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Ämne</Label>
                  <Input
                    placeholder="Ämne för e-postmeddelandet"
                    {...form.register('subject')}
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center">
                    <Label>Innehåll</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button type="button" variant="ghost" size="sm">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            Variabler
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-md p-4">
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
                    className="min-h-[200px] mt-2 font-mono text-sm"
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
          <TabsTrigger value="edit" className="flex items-center gap-2">
            <Pencil className="h-4 w-4" />
            Redigera
          </TabsTrigger>
          <TabsTrigger 
            value="preview" 
            className="flex items-center gap-2"
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
                <CardTitle>{form.watch('id') ? 'Redigera mall' : 'Skapa ny mall'}</CardTitle>
              </CardHeader>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardContent className="space-y-4">
                  <input type="hidden" {...form.register('id')} />
                  
                  <div>
                    <Label>Utlösare</Label>
                    <Select
                      value={form.watch('triggerType')}
                      onValueChange={(value) => form.setValue('triggerType', value)}
                      disabled={!!form.watch('id')}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Välj en utlösare" />
                      </SelectTrigger>
                      <SelectContent>
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
                    <Label htmlFor="isActive">Aktiv</Label>
                  </div>

                  <div>
                    <Label>Mottagare</Label>
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
                          <Label htmlFor={`receiver-${receiver.value}`}>
                            {receiver.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>Ämne</Label>
                    <Input
                      placeholder="Ämne för e-postmeddelandet"
                      {...form.register('subject')}
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center">
                      <Label>Innehåll</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button type="button" variant="ghost" size="sm">
                              <AlertCircle className="h-4 w-4 mr-1" />
                              Variabler
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-md p-4">
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
                      className="min-h-[200px] mt-2 font-mono text-sm"
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
