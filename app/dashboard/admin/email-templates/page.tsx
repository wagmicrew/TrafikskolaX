'use client';

import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Save, 
  Edit2, 
  Users, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Copy,
  Plus,
  Send,
  TestTube,
  Trash2,
  Download,
  Loader2,
  X,
  FileText
} from 'lucide-react';
import EditableTemplateName from '@/components/Admin/EditableTemplateName';
import toast from 'react-hot-toast';

type EmailTriggerType = 
  | 'user_login'
  | 'forgot_password'
  | 'new_user'
  | 'new_booking'
  | 'moved_booking'
  | 'cancelled_booking'
  | 'booking_reminder'
  | 'credits_reminder'
  | 'payment_reminder'
  | 'payment_confirmation_request'
  | 'payment_confirmed'
  | 'payment_declined'
  | 'feedback_received'
  | 'teacher_daily_bookings'
  | 'teacher_feedback_reminder'
  | 'new_password'
  | 'cancelled_booking';

type EmailReceiverType = 'student' | 'teacher' | 'admin' | 'specific_user';

interface EmailTemplate {
  id: string;
  triggerType: EmailTriggerType;
  subject: string;
  htmlContent: string;
  isActive: boolean;
  receivers: EmailReceiverType[];
  createdAt: string;
  updatedAt: string;
}

const defaultTemplates: Partial<Record<EmailTriggerType, { subject: string; htmlContent: string; receivers: EmailReceiverType[] }>> = {
  new_user: {
    subject: 'Välkommen till {{schoolName}}!',
    htmlContent: `
      <h1>Välkommen {{user.firstName}}!</h1>
      <p>Ditt konto har skapats framgångsrikt.</p>
      <p>Din e-postadress: {{user.email}}</p>
      <p>Du kan nu logga in och börja boka körlektioner.</p>
      <p><a href="{{appUrl}}/login">Logga in här</a></p>
      <p>Med vänliga hälsningar,<br>{{schoolName}}</p>
    `,
    receivers: ['student']
  },
  new_booking: {
    subject: 'Bokningsbekräftelse - {{booking.lessonTypeName}}',
    htmlContent: `
      <h1>Din bokning är bekräftad!</h1>
      <p>Hej {{user.firstName}},</p>
      <p>Din körlektion har bokats:</p>
      <ul>
        <li>Datum: {{booking.scheduledDate}}</li>
        <li>Tid: {{booking.startTime}} - {{booking.endTime}}</li>
        <li>Lektionstyp: {{booking.lessonTypeName}}</li>
        <li>Pris: {{booking.totalPrice}} kr</li>
      </ul>
      <p><a href="{{appUrl}}/dashboard/student/bookings/{{booking.id}}">Se din bokning</a></p>
      <p>Med vänliga hälsningar,<br>{{schoolName}}</p>
    `,
    receivers: ['student', 'admin']
  },
  cancelled_booking: {
    subject: 'Bokning avbokad - {{booking.lessonTypeName}}',
    htmlContent: `
      <h1>Din bokning har avbokats</h1>
      <p>Hej {{user.firstName}},</p>
      <p>Din följande bokning har avbokats:</p>
      <ul>
        <li>Datum: {{booking.scheduledDate}}</li>
        <li>Tid: {{booking.startTime}} - {{booking.endTime}}</li>
        <li>Lektionstyp: {{booking.lessonTypeName}}</li>
      </ul>
      <p>Om du har frågor, kontakta oss gärna.</p>
      <p><a href="{{appUrl}}/boka-korning">Boka ny tid</a></p>
      <p>Med vänliga hälsningar,<br>{{schoolName}}</p>
    `,
    receivers: ['student', 'admin']
  },
  booking_reminder: {
    subject: 'Påminnelse: Körlektion imorgon',
    htmlContent: `
      <h1>Påminnelse om din körlektion</h1>
      <p>Hej {{user.firstName}},</p>
      <p>Detta är en påminnelse om din körlektion imorgon:</p>
      <ul>
        <li>Datum: {{booking.scheduledDate}}</li>
        <li>Tid: {{booking.startTime}} - {{booking.endTime}}</li>
        <li>Lektionstyp: {{booking.lessonTypeName}}</li>
      </ul>
      <p>Vi ser fram emot att träffa dig!</p>
      <p><a href="{{appUrl}}/dashboard/student/bookings/{{booking.id}}">Se din bokning</a></p>
      <p>Med vänliga hälsningar,<br>{{schoolName}}</p>
    `,
    receivers: ['student']
  },
  teacher_daily_bookings: {
    subject: 'Dagens bokningar - {{currentDate}}',
    htmlContent: `
      <h1>Dina bokningar för idag</h1>
      <p>Hej {{teacher.firstName}},</p>
      <p>Här är dina bokningar för idag:</p>
      {{bookingsList}}
      <p><a href="{{appUrl}}/dashboard/teacher">Se alla bokningar</a></p>
      <p>Ha en bra dag!</p>
      <p>Med vänliga hälsningar,<br>{{schoolName}}</p>
    `,
    receivers: ['teacher']
  },
  feedback_received: {
    subject: 'Ny feedback mottagen',
    htmlContent: `
      <h1>Ny feedback från {{user.fullName}}</h1>
      <p>Du har fått ny feedback för bokningen:</p>
      <ul>
        <li>Datum: {{booking.scheduledDate}}</li>
        <li>Student: {{user.fullName}}</li>
      </ul>
      <p>{{feedbackText}}</p>
      <p><a href="{{appUrl}}/dashboard/admin/bookings/{{booking.id}}">Se feedback</a></p>
    `,
    receivers: ['teacher', 'admin']
  },
  new_password: {
    subject: 'Nytt lösenord - {{schoolName}}',
    htmlContent: `
      <h1>Ditt lösenord har uppdaterats</h1>
      <p>Hej {{user.firstName}},</p>
      <p>En administratör har genererat ett nytt lösenord för ditt konto.</p>
      <div style="background-color: #f8f9fa; padding: 16px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Ditt nya tillfälliga lösenord:</strong></p>
        <p style="font-family: monospace; font-size: 18px; font-weight: bold; color: #dc2626;">{{temporaryPassword}}</p>
      </div>
      <p><strong>Viktigt:</strong> Vänligen logga in och ändra ditt lösenord så snart som möjligt.</p>
      <p><a href="{{appUrl}}/login" style="display: inline-block; background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Logga in här</a></p>
      <p style="margin-top: 20px; color: #666666; font-size: 14px;">Om du inte begärde denna ändring, kontakta oss omedelbart.</p>
    `,
    receivers: ['student']
  }
};

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [editedTemplate, setEditedTemplate] = useState<EmailTemplate | null>(null);
  const [showEmailTest, setShowEmailTest] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [schoolname, setSchoolname] = useState('Din Trafikskola Hässleholm');
  const [schoolPhone, setSchoolPhone] = useState('08-XXX XX XX');

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/admin/email-templates');
      if (!response.ok) throw new Error('Failed to fetch templates');
      
      const data = await response.json();
      setTemplates(data.templates);
      setSchoolname(data.schoolname || 'Din Trafikskola Hässleholm');
      setSchoolPhone(data.schoolPhone || '08-XXX XX XX');
      
      // Create missing templates
      const existingTriggers = data.templates.map((t: EmailTemplate) => t.triggerType);
      const missingTriggers = Object.keys(defaultTemplates).filter(
        trigger => !existingTriggers.includes(trigger)
      );
      
      if (missingTriggers.length > 0) {
        await createMissingTemplates(missingTriggers as EmailTriggerType[]);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Kunde inte hämta e-postmallar');
    } finally {
      setIsLoading(false);
    }
  };

  const createMissingTemplates = async (triggers: EmailTriggerType[]) => {
    for (const trigger of triggers) {
      const template = defaultTemplates[trigger];
      if (template) {
        try {
          await fetch('/api/admin/email-templates', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              triggerType: trigger,
              subject: template.subject,
              htmlContent: template.htmlContent,
              receivers: template.receivers
            })
          });
        } catch (error) {
          console.error(`Error creating template for ${trigger}:`, error);
        }
      }
    }
    await fetchTemplates();
  };

  const handleTemplateSelect = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setEditedTemplate({ ...template });
    setShowPreview(false);
  };

  const handleTemplateChange = (field: keyof EmailTemplate, value: any) => {
    if (editedTemplate) {
      setEditedTemplate({ ...editedTemplate, [field]: value });
    }
  };

  const handleSave = async () => {
    if (!editedTemplate) return;

    setIsSaving(true);
    try {
      const response = await fetch('/api/admin/email-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          triggerType: editedTemplate.triggerType,
          subject: editedTemplate.subject,
          htmlContent: editedTemplate.htmlContent,
          receivers: editedTemplate.receivers
        })
      });

      if (response.ok) {
        toast.success('Mall sparad framgångsrikt');
        await fetchTemplates();
        setSelectedTemplate(editedTemplate);
      } else {
        toast.error('Fel vid sparande av mall');
      }
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Fel vid sparande av mall');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTemplateNameSave = async (templateId: string, newName: string) => {
    try {
      const response = await fetch('/api/admin/email-templates/update-name', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId, newName })
      });

      if (!response.ok) {
        throw new Error('Failed to update template name');
      }

      toast.success('Mallnamn uppdaterat');
      await fetchTemplates();
    } catch (error) {
      console.error('Error updating template name:', error);
      toast.error('Fel vid uppdatering av mallnamn');
      throw error;
    }
  };

  const handleTestEmail = async () => {
    if (!selectedTemplate || !testEmail) return;

    setIsSendingTest(true);
    try {
      const response = await fetch('/api/admin/email-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: selectedTemplate.id,
          testEmail
        })
      });

      if (response.ok) {
        toast.success('Testmail skickat');
        setShowEmailTest(false);
        setTestEmail('');
      } else {
        toast.error('Fel vid skickande av testmail');
      }
    } catch (error) {
      console.error('Error sending test email:', error);
      toast.error('Fel vid skickande av testmail');
    } finally {
      setIsSendingTest(false);
    }
  };

  const getTemplateDisplayName = (triggerType: EmailTriggerType): string => {
    const names: Record<EmailTriggerType, string> = {
      user_login: 'Inloggning',
      forgot_password: 'Glömt lösenord',
      new_user: 'Ny användare',
      new_booking: 'Ny bokning',
      moved_booking: 'Flyttad bokning',
      cancelled_booking: 'Avbokad bokning',
      booking_reminder: 'Bokningspåminnelse',
      credits_reminder: 'Kreditpåminnelse',
      payment_reminder: 'Betalningspåminnelse',
      payment_confirmation_request: 'Betalningsbekräftelse',
      payment_confirmed: 'Betalning bekräftad',
      payment_declined: 'Betalning nekad',
      feedback_received: 'Feedback mottagen',
      teacher_daily_bookings: 'Dagens bokningar (lärare)',
      teacher_feedback_reminder: 'Feedbackpåminnelse (lärare)',
      new_password: 'Nytt lösenord'
    };
    return names[triggerType] || triggerType;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-400 mx-auto"></div>
            <p className="text-white mt-4">Laddar e-postmallar...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="mb-6">
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-sky-600/20 to-purple-600/20 border-b border-white/10">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Mail className="w-6 h-6 text-sky-400" />
              E-postmallar
            </h1>
            <p className="text-gray-300 mt-1">Hantera och redigera e-postmallar för olika händelser</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Template List */}
        <div className="lg:col-span-1">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/10">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-sky-400" />
                Mallar
              </h2>
            </div>
            <div className="p-4 space-y-2">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                    selectedTemplate?.id === template.id
                      ? 'bg-sky-500/20 border border-sky-400/30'
                      : 'bg-white/5 hover:bg-white/10 border border-white/10'
                  }`}
                  onClick={() => handleTemplateSelect(template)}
                >
                  <EditableTemplateName
                    templateId={template.id}
                    currentName={getTemplateDisplayName(template.triggerType)}
                    onSave={handleTemplateNameSave}
                    className="text-white font-medium"
                  />
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      template.isActive 
                        ? 'bg-green-500/20 text-green-300 border border-green-400/30' 
                        : 'bg-red-500/20 text-red-300 border border-red-400/30'
                    }`}>
                      {template.isActive ? 'Aktiv' : 'Inaktiv'}
                    </span>
                    <span className="text-xs text-gray-300">
                      {template.receivers.join(', ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Template Editor */}
        <div className="lg:col-span-2">
          {selectedTemplate ? (
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-white/10">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Edit2 className="w-5 h-5 text-sky-400" />
                    Redigera: {getTemplateDisplayName(selectedTemplate.triggerType)}
                  </h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowPreview(!showPreview)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/20 rounded-lg transition-colors"
                    >
                      {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      {showPreview ? 'Dölj förhandsvisning' : 'Förhandsvisning'}
                    </button>
                    <button
                      onClick={() => setShowEmailTest(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/20 rounded-lg transition-colors"
                    >
                      <TestTube className="w-4 h-4" />
                      Testa
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                      {isSaving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      Spara
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {!showPreview ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-white font-medium mb-2">Ämne</label>
                      <input
                        value={editedTemplate?.subject || ''}
                        onChange={(e) => handleTemplateChange('subject', e.target.value)}
                        placeholder="E-postämne..."
                        className="w-full px-4 py-2 bg-white/5 border border-white/20 text-white rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 placeholder:text-white/50"
                      />
                    </div>

                    <div>
                      <label className="block text-white font-medium mb-2">HTML-innehåll</label>
                      <textarea
                        value={editedTemplate?.htmlContent || ''}
                        onChange={(e) => handleTemplateChange('htmlContent', e.target.value)}
                        placeholder="HTML-innehåll..."
                        className="w-full h-64 px-4 py-2 bg-white/5 border border-white/20 text-white rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 resize-none placeholder:text-white/50"
                      />
                    </div>

                    <div>
                      <label className="block text-white font-medium mb-2">Mottagare</label>
                      <div className="flex gap-4">
                        {['student', 'teacher', 'admin'].map((receiver) => (
                          <label key={receiver} className="flex items-center gap-2 text-white">
                            <input
                              type="checkbox"
                              checked={editedTemplate?.receivers.includes(receiver as EmailReceiverType)}
                              onChange={(e) => {
                                const currentReceivers = editedTemplate?.receivers || [];
                                const newReceivers = e.target.checked
                                  ? [...currentReceivers, receiver as EmailReceiverType]
                                  : currentReceivers.filter(r => r !== receiver);
                                handleTemplateChange('receivers', newReceivers);
                              }}
                              className="rounded border-white/20 text-sky-500 focus:ring-sky-500 bg-white/5"
                            />
                            <span className="capitalize">{receiver}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {editedTemplate?.subject}
                    </h3>
                    <div 
                      className="prose prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ __html: editedTemplate?.htmlContent || '' }}
                    />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl overflow-hidden">
              <div className="text-center py-12">
                <Mail className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-300 text-lg">Välj en mall för att börja redigera</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Test Email Modal with Glassmorphism */}
      {showEmailTest && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <TestTube className="w-6 h-6 text-sky-400" />
                  <h3 className="text-lg font-semibold text-white">Skicka testmail</h3>
                </div>
                <button
                  onClick={() => setShowEmailTest(false)}
                  className="text-white/70 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <p className="text-slate-300 mb-6">
                Skicka ett testmail för att se hur mallen ser ut
              </p>
              
              <div className="mb-6">
                <label className="block text-white font-medium mb-2">E-postadress</label>
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="test@example.com"
                  className="w-full px-4 py-2 bg-white/5 border border-white/20 text-white rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 placeholder:text-white/50"
                />
              </div>

              {/* Footer */}
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowEmailTest(false)}
                  className="px-4 py-2 text-white border border-white/20 hover:bg-white/10 rounded-lg transition-colors"
                >
                  Avbryt
                </button>
                <button
                  onClick={handleTestEmail}
                  disabled={isSendingTest || !testEmail}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {isSendingTest ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Skicka testmail
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
