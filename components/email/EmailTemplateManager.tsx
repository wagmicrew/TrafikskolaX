'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { emailTriggerEnum } from '@/lib/db/schema/email-templates';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Card, 
  CardContent,
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { EmailEditor, EmailEditorRef } from './EmailEditorCore';
import { EmailTemplateSelect } from './EmailTemplateSelect';
import { EmailVariableSelector } from './EmailVariableSelector';
import { EmailPreview } from './EmailPreview';
import { EmailTemplate, EmailTriggerType, CreateTemplatePayload, UpdateTemplatePayload } from '@/lib/email/types';
import { Loader2, Save } from 'lucide-react';

// Form schema
const formSchema = z.object({
  id: z.string().optional(),
  triggerType: z.string(),
  subject: z.string().min(1, { message: 'Ämne krävs' }),
  htmlContent: z.string().min(1, { message: 'Innehåll krävs' }),
  isActive: z.boolean().default(true),
  receivers: z.array(z.string()).min(1, { message: 'Minst en mottagartyp krävs' }),
});

type FormValues = z.infer<typeof formSchema>;

export const EmailTemplateManager = () => {
  // State
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [schoolName, setSchoolName] = useState('Din Trafikskola');
  const [schoolPhone, setSchoolPhone] = useState('');
  const [activeTab, setActiveTab] = useState('edit');
  
  // Refs
  const editorRef = useRef<EmailEditorRef>(null);

  // Form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      triggerType: '',
      subject: '',
      htmlContent: '',
      isActive: true,
      receivers: ['student'],
    },
  });

  // Fetch templates on mount
  useEffect(() => {
    fetchTemplates();
  }, []);

  // Update form values when template changes
  useEffect(() => {
    if (selectedTemplate) {
      form.reset({
        id: selectedTemplate.id,
        triggerType: selectedTemplate.triggerType,
        subject: selectedTemplate.subject,
        htmlContent: selectedTemplate.htmlContent,
        isActive: selectedTemplate.isActive,
        receivers: selectedTemplate.receivers || ['student'],
      });

      // Ensure editor content is updated
      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.setContent(selectedTemplate.htmlContent);
        }
      }, 100);
    } else {
      form.reset({
        triggerType: '',
        subject: '',
        htmlContent: '',
        isActive: true,
        receivers: ['student'],
      });
      
      if (editorRef.current) {
        editorRef.current.setContent('');
      }
    }
  }, [selectedTemplate, form]);

  // Fetch templates from API
  const fetchTemplates = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/email-templates');
      const data = await response.json();
      
      if (data.error) {
        toast({
          title: 'Fel vid hämtning av mallar',
          description: data.error,
          variant: 'destructive',
        });
        return;
      }
      
      setTemplates(data.templates || []);
      setSchoolName(data.schoolname || 'Din Trafikskola');
      setSchoolPhone(data.schoolPhone || '');
    } catch (error) {
      toast({
        title: 'Fel vid hämtning av mallar',
        description: 'Ett fel uppstod vid hämtning av mallar',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form submission
  const onSubmit = async (values: FormValues) => {
    try {
      setIsSaving(true);

      // Ensure the HTML content is from the editor
      const htmlContent = editorRef.current?.getHTML() || values.htmlContent;
      
      let response;
      
      if (values.id) {
        // Update existing template
        const payload: UpdateTemplatePayload = {
          id: values.id,
          subject: values.subject,
          htmlContent,
          isActive: values.isActive,
          receivers: values.receivers,
        };
        
        response = await fetch(`/api/admin/email-templates/${values.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        // Create new template
        const payload: CreateTemplatePayload = {
          triggerType: values.triggerType as EmailTriggerType,
          subject: values.subject,
          htmlContent,
          receivers: values.receivers,
        };
        
        response = await fetch('/api/admin/email-templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const data = await response.json();
      
      if (data.error) {
        toast({
          title: 'Fel vid sparande',
          description: data.error,
          variant: 'destructive',
        });
        return;
      }
      
      // Refresh templates
      fetchTemplates();
      
      toast({
        title: 'Mall sparad',
        description: values.id ? 'Mallen har uppdaterats' : 'Ny mall har skapats',
      });
      
      // Select the newly created/updated template
      if (data.template) {
        setSelectedTemplate(data.template);
      }
    } catch (error) {
      toast({
        title: 'Fel vid sparande',
        description: 'Ett fel uppstod vid sparande av mall',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Create new template
  const handleCreateTemplate = () => {
    setSelectedTemplate(null);
    form.reset({
      triggerType: '',
      subject: '',
      htmlContent: '',
      isActive: true,
      receivers: ['student'],
    });
    
    if (editorRef.current) {
      editorRef.current.setContent('');
    }
    
    setActiveTab('edit');
  };

  // Duplicate template
  const handleDuplicateTemplate = (template: EmailTemplate) => {
    // Create a duplicate without ID
    form.reset({
      triggerType: '',  // Must be new for duplicates
      subject: `${template.subject} (kopia)`,
      htmlContent: template.htmlContent,
      isActive: template.isActive,
      receivers: template.receivers || ['student'],
    });
    
    setSelectedTemplate(null);
    
    if (editorRef.current) {
      editorRef.current.setContent(template.htmlContent);
    }
    
    setActiveTab('edit');
    
    toast({
      title: 'Mall duplicerad',
      description: 'Välj en ny trigger och spara för att skapa en kopia',
    });
  };

  // Delete template
  const handleDeleteTemplate = async (template: EmailTemplate) => {
    if (!confirm(`Är du säker på att du vill ta bort mallen "${template.subject}"?`)) {
      return;
    }
    
    try {
      setIsLoading(true);
      
      const response = await fetch(`/api/admin/email-templates/${template.id}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (data.error) {
        toast({
          title: 'Fel vid borttagning',
          description: data.error,
          variant: 'destructive',
        });
        return;
      }
      
      // Remove from local state
      setTemplates(templates.filter(t => t.id !== template.id));
      
      // Reset if the deleted template was selected
      if (selectedTemplate?.id === template.id) {
        setSelectedTemplate(null);
        form.reset({
          triggerType: '',
          subject: '',
          htmlContent: '',
          isActive: true,
          receivers: ['student'],
        });
        
        if (editorRef.current) {
          editorRef.current.setContent('');
        }
      }
      
      toast({
        title: 'Mall borttagen',
        description: 'Mallen har tagits bort',
      });
    } catch (error) {
      toast({
        title: 'Fel vid borttagning',
        description: 'Ett fel uppstod vid borttagning av mall',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Insert variable to editor
  const handleInsertVariable = (variable: string) => {
    if (editorRef.current) {
      editorRef.current.insertText(variable);
      editorRef.current.focus();
    }
  };

  // Get values for the form including editor content
  const getFormValues = () => {
    const values = form.getValues();
    return {
      ...values,
      htmlContent: editorRef.current?.getHTML() || values.htmlContent,
    };
  };

  return (
    <div className="container mx-auto p-4 space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Template Selector */}
        <div className="lg:col-span-1">
          <EmailTemplateSelect
            templates={templates}
            selectedTemplate={selectedTemplate}
            onTemplateSelect={setSelectedTemplate}
            onCreateTemplate={handleCreateTemplate}
            onDuplicateTemplate={handleDuplicateTemplate}
            onDeleteTemplate={handleDeleteTemplate}
            isLoading={isLoading}
          />
        </div>

        {/* Main Editor Area */}
        <div className="lg:col-span-3 space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="edit">Redigera</TabsTrigger>
              <TabsTrigger value="preview">Förhandsgranska</TabsTrigger>
            </TabsList>
            
            <TabsContent value="edit" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {selectedTemplate ? 'Redigera mall' : 'Skapa ny mall'}
                  </CardTitle>
                  <CardDescription>
                    {selectedTemplate
                      ? `Redigera mall: ${selectedTemplate.subject}`
                      : 'Skapa en ny e-postmall'
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="triggerType">Trigger Typ</Label>
                        <Select
                          disabled={!!selectedTemplate || isSaving}
                          value={form.watch('triggerType')}
                          onValueChange={(value) => form.setValue('triggerType', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Välj trigger typ" />
                          </SelectTrigger>
                          <SelectContent>
                            {emailTriggerEnum.enumValues.map((triggerType) => (
                              <SelectItem key={triggerType} value={triggerType}>
                                {triggerType}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {form.formState.errors.triggerType && (
                          <p className="text-xs text-red-500">
                            {form.formState.errors.triggerType.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="subject">Ämne</Label>
                        <Input
                          id="subject"
                          placeholder="Mail ämne"
                          disabled={isSaving}
                          {...form.register('subject')}
                        />
                        {form.formState.errors.subject && (
                          <p className="text-xs text-red-500">
                            {form.formState.errors.subject.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label htmlFor="content">Innehåll</Label>
                        <div className="flex items-center space-x-2">
                          <Label htmlFor="isActive" className="text-sm">Aktiv</Label>
                          <Switch
                            id="isActive"
                            checked={form.watch('isActive')}
                            onCheckedChange={(checked) => form.setValue('isActive', checked)}
                            disabled={isSaving}
                          />
                        </div>
                      </div>

                      <EmailEditor
                        ref={editorRef}
                        value={form.watch('htmlContent')}
                        onChange={(html) => form.setValue('htmlContent', html)}
                        className="min-h-[300px]"
                        height={400}
                      />
                      {form.formState.errors.htmlContent && (
                        <p className="text-xs text-red-500">
                          {form.formState.errors.htmlContent.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Mottagare</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {['student', 'teacher', 'admin', 'supervisor', 'school'].map((receiver) => (
                          <div key={receiver} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`receiver-${receiver}`}
                              checked={form.watch('receivers')?.includes(receiver)}
                              onChange={(e) => {
                                const currentReceivers = form.watch('receivers') || [];
                                if (e.target.checked) {
                                  form.setValue('receivers', [...currentReceivers, receiver]);
                                } else {
                                  form.setValue(
                                    'receivers',
                                    currentReceivers.filter((r) => r !== receiver)
                                  );
                                }
                              }}
                              className="h-4 w-4"
                              disabled={isSaving}
                            />
                            <Label htmlFor={`receiver-${receiver}`} className="text-sm capitalize">
                              {receiver}
                            </Label>
                          </div>
                        ))}
                      </div>
                      {form.formState.errors.receivers && (
                        <p className="text-xs text-red-500">
                          {form.formState.errors.receivers.message}
                        </p>
                      )}
                    </div>
                  </form>
                </CardContent>
                <CardFooter>
                  <Button
                    onClick={() => onSubmit(getFormValues())}
                    className="w-full"
                    disabled={isSaving}
                  >
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Save className="mr-2 h-4 w-4" />
                    {selectedTemplate ? 'Uppdatera mall' : 'Skapa mall'}
                  </Button>
                </CardFooter>
              </Card>

              <EmailVariableSelector
                triggerType={form.watch('triggerType') as EmailTriggerType}
                onInsertVariable={handleInsertVariable}
                className="w-full"
              />
            </TabsContent>
            
            <TabsContent value="preview">
              <EmailPreview
                subject={form.watch('subject')}
                htmlContent={editorRef.current?.getHTML() || form.watch('htmlContent')}
                schoolName={schoolName}
                className="w-full"
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};
