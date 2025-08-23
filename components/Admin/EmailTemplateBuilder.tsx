"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';
import { Loader2, Save, Mail, AlertCircle, Eye, Pencil, Copy, Info, Zap, Image, Upload } from 'lucide-react';
import dynamic from 'next/dynamic';
import { SimpleEmailPreview } from './SimpleEmailPreview';
import { TriggerFlowPopup } from './TriggerFlowPopup';
import { TRIGGER_DEFINITIONS, getTriggerById, type TriggerDefinition } from '@/lib/email/trigger-definitions';
import { createEmailTemplateConfig, type TinyMCEConfig } from '@/lib/tinymce-config';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const Editor = dynamic(() => import('@tinymce/tinymce-react').then(m => m.Editor), { ssr: false }) as any;

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

      <div className="text-center">
        <p>UTF-8 vänlig e-postmallredigerare</p>
        <p>Svenska tecken och specialtecken stöds</p>
      </div>
    </div>
  );
}