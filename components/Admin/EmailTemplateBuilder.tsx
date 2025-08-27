import { useState, useEffect, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';
import {
  Loader2, Save, Mail, AlertCircle, Eye, Pencil, Copy, Info, Zap,
  FileText, CheckCircle, Edit3, Code, Send, Settings, Users,
  Tag, Bell, Trash2, Plus, Search, Filter, Grid, List,
  Menu, X, ChevronLeft, ChevronRight
} from 'lucide-react';
import { OrbSpinner } from '@/components/ui/orb-loader';
import { FlowbiteWysiwygEditor, FlowbiteWysiwygEditorRef } from '@/components/ui/simple-rich-editor';

import { TRIGGER_DEFINITIONS, getTriggerById, type TriggerDefinition } from '@/lib/email/trigger-definitions';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';



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
  '{{user.phone}}',
  '{{booking.id}}',
  '{{booking.date}}',
  '{{booking.time}}',
  '{{booking.price}}',
  '{{lesson.name}}',
  '{{school.name}}',
  '{{school.email}}',
  '{{school.phone}}'
];

const RECEIVER_TYPES = [
  { value: 'student', label: 'Elev' },
  { value: 'teacher', label: 'Lärare' },
  { value: 'admin', label: 'Administratör' },
  { value: 'supervisor', label: 'Handledare' },
  { value: 'school', label: 'Skola' },
  { value: 'specific_user', label: 'Specifik användare' },
];

export default function EmailTemplateBuilder() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [templates, setTemplates] = useState<Array<{ id: string; triggerType: string; subject: string; isActive: boolean }>>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const editorRef = useRef<FlowbiteWysiwygEditorRef>(null);

  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      triggerType: '',
      subject: '',
      htmlContent: '',
      isActive: true,
      receivers: ['student']
    }
  });

  // Load templates on component mount
  useEffect(() => {
    loadTemplates();
  }, []);

  // Filter templates based on search and category
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.triggerType.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || TRIGGER_DEFINITIONS.find(t => t.id === template.triggerType)?.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const loadTemplates = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/email-templates');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      } else {
        toast.error('Kunde inte ladda mallar');
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Kunde inte ladda mallar');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle template selection and load into editor
  const handleTemplateSelect = useCallback(async (template: any) => {
    setSelectedTemplate(template.id);
    try {
      const response = await fetch(`/api/admin/email-templates/${template.id}`);
      if (response.ok) {
        const templateData = await response.json();
        form.reset({
          id: templateData.id,
          triggerType: templateData.triggerType,
          subject: templateData.subject,
          htmlContent: templateData.htmlContent,
          isActive: templateData.isActive,
          receivers: templateData.receivers || ['student']
        });
        toast.success(`Mall "${template.subject}" öppnad i redigeraren`);
      }
    } catch (error) {
      console.error('Error loading template:', error);
      toast.error('Kunde inte ladda mallen');
    }
  }, [form]);

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

      // Update templates list
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

  const insertVariable = (variable: string) => {
    if (editorRef.current) {
      editorRef.current.insertText(variable);
    }
  };

  const createNewTemplate = () => {
    form.reset({
      triggerType: '',
      subject: '',
      htmlContent: '',
      isActive: true,
      receivers: ['student']
    });
    setSelectedTemplate('');
    toast.success('Ny mall skapad - välj en utlösare och börja skriva');
  };

  const duplicateTemplate = async (template: any) => {
    try {
      const response = await fetch(`/api/admin/email-templates/${template.id}`);
      if (response.ok) {
        const templateData = await response.json();
        const duplicatedData = {
          ...templateData,
          id: undefined,
          subject: `${templateData.subject} (Kopia)`,
        };
        delete duplicatedData.id;

        const saveResponse = await fetch('/api/admin/email-templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(duplicatedData),
        });

        if (saveResponse.ok) {
          const newTemplate = await saveResponse.json();
          setTemplates(prev => [...prev, newTemplate]);
          toast.success('Mall duplicerad');
        }
      }
    } catch (error) {
      console.error('Error duplicating template:', error);
      toast.error('Kunde inte duplicera mallen');
    }
  };

  const deleteTemplate = async (templateId: string) => {
    if (!confirm('Är du säker på att du vill ta bort denna mall?')) return;

    try {
      const response = await fetch(`/api/admin/email-templates/${templateId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setTemplates(prev => prev.filter(t => t.id !== templateId));
        if (selectedTemplate === templateId) {
          setSelectedTemplate('');
          form.reset();
        }
        toast.success('Mall borttagen');
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Kunde inte ta bort mallen');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <OrbSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="w-full px-4 md:px-6 py-6 md:py-12">
        {/* Header */}
        <div className="text-center mb-8 md:mb-12">
          <div className="inline-flex items-center gap-4 mb-6">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-xl border border-blue-300">
              <Mail className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent tracking-tight">
              E-postmallar
            </h1>
          </div>
          <p className="text-xl md:text-2xl text-gray-600 font-medium leading-relaxed max-w-3xl mx-auto">
            Skapa och redigera professionella e-postmallar med visuell editor och Flowbite-design
          </p>
        </div>

        {/* Controls Bar */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8 p-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/50 dark:border-slate-700/50">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Sök mallar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 rounded-xl border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-48 h-12 rounded-xl">
                <SelectValue placeholder="Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alla kategorier</SelectItem>
                <SelectItem value="booking">Bokning</SelectItem>
                <SelectItem value="payment">Betalning</SelectItem>
                <SelectItem value="notification">Notifikation</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* View Controls */}
          <div className="flex items-center gap-2">
            <div className="flex bg-slate-100 dark:bg-slate-700 rounded-xl p-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-lg"
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-lg"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
            <Button
              onClick={createNewTemplate}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <Plus className="w-5 h-5 mr-2" />
              Ny mall
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          {/* Templates Sidebar */}
          <Card className="xl:col-span-4 shadow-2xl border-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-2xl">
            <CardHeader className="pb-4 border-b border-slate-200 dark:border-slate-700">
              <CardTitle className="flex items-center justify-between text-xl font-semibold text-slate-800 dark:text-slate-100">
                <div className="flex items-center gap-3">
                  <FileText className="w-6 h-6 text-blue-600" />
                  E-postmallar
                </div>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {filteredTemplates.length}
                </Badge>
              </CardTitle>
              <CardDescription className="text-base text-slate-600 dark:text-slate-300">
                Klicka på en mall för att öppna den i redigeraren
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {filteredTemplates.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-lg text-slate-500 font-medium mb-2">
                      {searchQuery ? 'Inga mallar hittades' : 'Inga mallar än'}
                    </p>
                    <p className="text-sm text-slate-400 mb-4">
                      {searchQuery ? 'Försök med andra sökord' : 'Skapa din första mall för att komma igång'}
                    </p>
                    {!searchQuery && (
                      <Button onClick={createNewTemplate} variant="outline">
                        <Plus className="w-4 h-4 mr-2" />
                        Skapa första mallen
                      </Button>
                    )}
                  </div>
                ) : (
                  filteredTemplates.map((template) => (
                    <div
                      key={template.id}
                      className={`group relative p-4 rounded-2xl cursor-pointer transition-all duration-300 border-2 transform hover:scale-102 ${
                        selectedTemplate === template.id
                          ? 'ring-4 ring-blue-400/50 border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50 shadow-xl'
                          : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 bg-white dark:bg-slate-800 hover:shadow-xl'
                      }`}
                      onClick={() => handleTemplateSelect(template)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <p className="font-semibold text-slate-800 dark:text-slate-100 mb-1 line-clamp-2">
                            {template.subject}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide font-medium">
                            {TRIGGER_DEFINITIONS.find(t => t.id === template.triggerType)?.name || template.triggerType}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              duplicateTemplate(template);
                            }}
                            className="h-8 w-8 p-0"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteTemplate(template.id);
                            }}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <Badge
                          variant={template.isActive ? "default" : "secondary"}
                          className={template.isActive ? "bg-green-100 text-green-800" : ""}
                        >
                          {template.isActive ? 'Aktiv' : 'Inaktiv'}
                        </Badge>
                        {selectedTemplate === template.id && (
                          <CheckCircle className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Template Editor */}
          <Card className="xl:col-span-8 shadow-2xl border-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-2xl">
            <CardHeader className="pb-4 border-b border-slate-200 dark:border-slate-700">
              <CardTitle className="flex items-center gap-3 text-2xl font-bold text-slate-800 dark:text-slate-100">
                <Edit3 className="w-8 h-8 text-blue-600" />
                {selectedTemplate ? 'Redigera mall' : 'Skapa ny mall'}
              </CardTitle>
              <CardDescription className="text-base text-slate-600 dark:text-slate-300 mt-2">
                Konfigurera e-postmallens inställningar och skapa innehåll med den visuella redigeraren
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {/* Basic Settings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="triggerType" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Utlösare *
                    </Label>
                    <Select
                      value={form.watch('triggerType')}
                      onValueChange={(value) => form.setValue('triggerType', value)}
                    >
                      <SelectTrigger className="h-12 rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800">
                        <SelectValue placeholder="Välj en utlösare" />
                      </SelectTrigger>
                      <SelectContent>
                        {TRIGGER_TYPES.map((trigger) => (
                          <SelectItem key={trigger.value} value={trigger.value}>
                            <div className="flex flex-col">
                              <span>{trigger.label}</span>
                              <span className="text-xs text-muted-foreground">{trigger.description}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.triggerType && (
                      <p className="text-sm text-red-600 font-medium">
                        {form.formState.errors.triggerType.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Ämne *
                    </Label>
                    <Input
                      id="subject"
                      {...form.register('subject')}
                      placeholder="E-postens ämne"
                      className="h-12 rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500"
                    />
                    {form.formState.errors.subject && (
                      <p className="text-sm text-red-600 font-medium">
                        {form.formState.errors.subject.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Recipients */}
                <div className="space-y-4">
                  <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Mottagare *
                  </Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {RECEIVER_TYPES.map((type) => (
                      <label
                        key={type.value}
                        className="flex items-center space-x-3 p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-blue-600 cursor-pointer transition-all duration-200"
                      >
                        <input
                          type="checkbox"
                          {...form.register('receivers')}
                          value={type.value}
                          className="w-4 h-4 text-blue-600 rounded border-slate-300 dark:border-slate-600 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{type.label}</span>
                      </label>
                    ))}
                  </div>
                  {form.formState.errors.receivers && (
                    <p className="text-sm text-red-600 font-medium">
                      {form.formState.errors.receivers.message}
                    </p>
                  )}
                </div>

                {/* Variables Helper */}
                <div className="space-y-4">
                  <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Tillgängliga variabler
                  </Label>
                  <div className="flex flex-wrap gap-3 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-800">
                    {COMMON_VARIABLES.map((variable) => (
                      <button
                        key={variable}
                        type="button"
                        onClick={() => insertVariable(variable)}
                        className="px-4 py-2 text-sm bg-blue-100 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-200 hover:border-blue-300 font-mono transition-all duration-200 shadow-sm"
                      >
                        {variable}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Klicka på en variabel för att infoga den i innehållet
                  </p>
                </div>

                {/* Status */}
                <div className="flex items-center justify-between p-6 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                  <div className="flex items-center space-x-3">
                    <Switch
                      checked={form.watch('isActive')}
                      onCheckedChange={(checked) => form.setValue('isActive', checked)}
                      className="data-[state=checked]:bg-blue-600"
                    />
                    <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Aktiv mall
                    </Label>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {form.watch('isActive') ? 'Mallen är aktiv' : 'Mallen är inaktiv'}
                  </div>
                </div>

                {/* Content Editor */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-50 border border-blue-200">
                      <Code className="w-5 h-5 text-blue-600" />
                    </div>
                    <Label className="text-lg font-semibold text-slate-700 dark:text-slate-300">
                      Innehåll *
                    </Label>
                  </div>
                  <div className="border-2 border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-2xl bg-white">
                    <FlowbiteWysiwygEditor
                      ref={editorRef}
                      value={form.watch('htmlContent')}
                      onChange={(value: string) => form.setValue('htmlContent', value)}
                      placeholder="Skriv e-postinnehållet här..."
                      height={600}
                      className="min-h-[600px]"
                    />
                  </div>
                  {form.formState.errors.htmlContent && (
                    <p className="text-sm text-red-600 font-medium">
                      {form.formState.errors.htmlContent.message}
                    </p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-4 pt-6 border-t border-slate-200 dark:border-slate-700">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setSelectedTemplate('');
                      form.reset();
                    }}
                    className="px-8 py-3 rounded-lg"
                  >
                    Rensa
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSaving}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    {isSaving ? (
                      <>
                        <OrbSpinner size="sm" className="mr-2" />
                        Sparar...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5 mr-2" />
                        Spara mall
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}