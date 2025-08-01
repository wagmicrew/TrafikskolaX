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
  Plus
} from 'lucide-react';
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
  | 'teacher_feedback_reminder';

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

const triggerTypeLabels: Record<EmailTriggerType, string> = {
  user_login: 'Användarinloggning',
  forgot_password: 'Glömt lösenord',
  new_user: 'Ny användare',
  new_booking: 'Ny bokning',
  moved_booking: 'Flyttad bokning',
  cancelled_booking: 'Avbokad bokning',
  booking_reminder: 'Bokningspåminnelse',
  credits_reminder: 'Kreditpåminnelse',
  payment_reminder: 'Betalningspåminnelse',
  payment_confirmation_request: 'Betalningsbekräftelse begäran',
  payment_confirmed: 'Betalning bekräftad',
  payment_declined: 'Betalning avvisad',
  feedback_received: 'Feedback mottagen',
  teacher_daily_bookings: 'Dagliga bokningar för lärare',
  teacher_feedback_reminder: 'Feedbackpåminnelse för lärare'
};

const receiverTypeLabels: Record<EmailReceiverType, string> = {
  student: 'Student',
  teacher: 'Lärare',
  admin: 'Admin',
  specific_user: 'Specifik användare'
};

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
  payment_reminder: {
    subject: 'Betalningspåminnelse - {{booking.lessonTypeName}}',
    htmlContent: `
      <h1>Betalningspåminnelse</h1>
      <p>Hej {{user.firstName}},</p>
      <p>Vi vill påminna dig om att betala för din bokning:</p>
      <ul>
        <li>Datum: {{booking.scheduledDate}}</li>
        <li>Tid: {{booking.startTime}} - {{booking.endTime}}</li>
        <li>Belopp: {{booking.totalPrice}} kr</li>
      </ul>
      <p>Swish-nummer: {{swishNumber}}</p>
      <p>Meddelande: {{booking.swishUUID}}</p>
      <p><a href="{{appUrl}}/dashboard/student/bookings/{{booking.id}}">Betala nu</a></p>
      <p>Med vänliga hälsningar,<br>{{schoolName}}</p>
    `,
    receivers: ['student']
  },
  payment_confirmation_request: {
    subject: 'Betalningsbekräftelse från {{user.fullName}}',
    htmlContent: `
      <h1>Ny betalningsbekräftelse</h1>
      <p>Student {{user.fullName}} ({{user.email}}) har bekräftat betalning för bokning {{booking.id}}.</p>
      <p>Bokningsdetaljer:</p>
      <ul>
        <li>Datum: {{booking.scheduledDate}}</li>
        <li>Tid: {{booking.startTime}} - {{booking.endTime}}</li>
        <li>Belopp: {{booking.totalPrice}} kr</li>
      </ul>
      <p>Vänligen verifiera betalningen i Swish och uppdatera bokningsstatus.</p>
      <p><a href="{{appUrl}}/dashboard/admin/bookings/{{booking.id}}">Öppna bokning</a></p>
    `,
    receivers: ['admin']
  },
  payment_confirmed: {
    subject: 'Betalning bekräftad - {{booking.lessonTypeName}}',
    htmlContent: `
      <h1>Din betalning är bekräftad!</h1>
      <p>Hej {{user.firstName}},</p>
      <p>Vi har mottagit din betalning för:</p>
      <ul>
        <li>Datum: {{booking.scheduledDate}}</li>
        <li>Tid: {{booking.startTime}} - {{booking.endTime}}</li>
        <li>Belopp: {{booking.totalPrice}} kr</li>
      </ul>
      <p>Din bokning är nu helt bekräftad. Vi ser fram emot att träffa dig!</p>
      <p><a href="{{appUrl}}/dashboard/student/bookings/{{booking.id}}">Se din bokning</a></p>
      <p>Med vänliga hälsningar,<br>{{schoolName}}</p>
    `,
    receivers: ['student']
  },
  payment_declined: {
    subject: 'Betalning kunde inte verifieras - {{booking.lessonTypeName}}',
    htmlContent: `
      <h1>Betalningsproblem</h1>
      <p>Hej {{user.firstName}},</p>
      <p>Vi kunde tyvärr inte verifiera din betalning för bokningen:</p>
      <ul>
        <li>Datum: {{booking.scheduledDate}}</li>
        <li>Tid: {{booking.startTime}} - {{booking.endTime}}</li>
        <li>Belopp: {{booking.totalPrice}} kr</li>
      </ul>
      <p>Vänligen kontrollera att betalningen har gjorts korrekt eller kontakta oss på telefon.</p>
      <p>Du kan också prova en annan betalningsmetod.</p>
      <p><a href="{{appUrl}}/dashboard/student/bookings/{{booking.id}}">Se din bokning</a></p>
      <p>Med vänliga hälsningar,<br>{{schoolName}}</p>
    `,
    receivers: ['student']
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
      <p>Med vänliga hälsningar,<br>{{schoolName}}</p>
    `,
    receivers: ['teacher', 'admin']
  }
};

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [editedTemplate, setEditedTemplate] = useState<EmailTemplate | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/admin/email-templates');
      if (!response.ok) throw new Error('Failed to fetch templates');
      
      const data = await response.json();
      setTemplates(data.templates);
      
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
      const defaultTemplate = defaultTemplates[trigger];
      if (!defaultTemplate) continue;

      try {
        await fetch('/api/admin/email-templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            triggerType: trigger,
            ...defaultTemplate
          })
        });
      } catch (error) {
        console.error(`Error creating template for ${trigger}:`, error);
      }
    }
    
    // Refresh templates
    await fetchTemplates();
  };

  const handleTemplateSelect = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setEditedTemplate({ ...template });
    setShowPreview(false);
  };

  const handleSave = async () => {
    if (!editedTemplate) return;

    setIsSaving(true);
    const loadingToast = toast.loading('Sparar mall...');

    try {
      const response = await fetch('/api/admin/email-templates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedTemplate)
      });

      if (!response.ok) throw new Error('Failed to save template');

      toast.success('Mall sparad framgångsrikt!', { id: loadingToast });
      await fetchTemplates();
      
      // Update selected template
      setSelectedTemplate(editedTemplate);
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Kunde inte spara mall', { id: loadingToast });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReceiverToggle = (receiver: EmailReceiverType) => {
    if (!editedTemplate) return;

    const updatedReceivers = editedTemplate.receivers.includes(receiver)
      ? editedTemplate.receivers.filter(r => r !== receiver)
      : [...editedTemplate.receivers, receiver];

    setEditedTemplate({
      ...editedTemplate,
      receivers: updatedReceivers
    });
  };

  const togglePreview = () => {
    setShowPreview(!showPreview);
  };

  const getPreviewHtml = () => {
    if (!editedTemplate) return '';

    // Replace variables with sample data
    let preview = editedTemplate.htmlContent;
    preview = preview.replace(/\{\{user\.firstName\}\}/g, 'Johan');
    preview = preview.replace(/\{\{user\.lastName\}\}/g, 'Andersson');
    preview = preview.replace(/\{\{user\.fullName\}\}/g, 'Johan Andersson');
    preview = preview.replace(/\{\{user\.email\}\}/g, 'johan@example.com');
    preview = preview.replace(/\{\{booking\.scheduledDate\}\}/g, '2024-03-15');
    preview = preview.replace(/\{\{booking\.startTime\}\}/g, '14:00');
    preview = preview.replace(/\{\{booking\.endTime\}\}/g, '15:00');
    preview = preview.replace(/\{\{booking\.lessonTypeName\}\}/g, 'B-körkort 45 min');
    preview = preview.replace(/\{\{booking\.totalPrice\}\}/g, '695');
    preview = preview.replace(/\{\{booking\.id\}\}/g, '123456');
    preview = preview.replace(/\{\{appUrl\}\}/g, window.location.origin);
    preview = preview.replace(/\{\{schoolName\}\}/g, 'Din Trafikskola HLM');
    preview = preview.replace(/\{\{currentYear\}\}/g, new Date().getFullYear().toString());

return `
      <div style="background-color: black; color: red; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto;">
          <img src="https://dintrafikskolahlm.se/logo.png" alt="Logo" style="display: block; width: 150px; margin: 0 auto 20px;" />
          ${preview}
        </div>
      </div>
    `;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Laddar e-postmallar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white shadow-lg rounded-xl overflow-hidden">
          <div className="p-6 border-b">
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              <Mail className="w-8 h-8 text-blue-600" />
              E-postmallar
            </h1>
            <p className="text-gray-600 mt-2">Hantera e-postmallar för automatiska utskick</p>
          </div>

          <div className="flex h-[calc(100vh-200px)]">
            {/* Template List */}
            <div className="w-1/3 border-r bg-gray-50 overflow-y-auto">
              <div className="p-4">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Mallar</h2>
                <div className="space-y-2">
                  {templates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => handleTemplateSelect(template)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedTemplate?.id === template.id
                          ? 'bg-blue-100 border-blue-500 border'
                          : 'bg-white hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">
                          {triggerTypeLabels[template.triggerType]}
                        </span>
                        {template.isActive ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                      <div className="flex gap-2 mt-1">
                        {template.receivers.map(receiver => (
                          <span 
                            key={receiver}
                            className="text-xs bg-gray-200 px-2 py-1 rounded"
                          >
                            {receiverTypeLabels[receiver]}
                          </span>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Template Editor */}
            <div className="flex-1 overflow-y-auto">
              {editedTemplate ? (
                <div className="p-6">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">
                      {triggerTypeLabels[editedTemplate.triggerType]}
                    </h2>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={editedTemplate.isActive}
                          onChange={(e) => setEditedTemplate({
                            ...editedTemplate,
                            isActive: e.target.checked
                          })}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm font-medium">Aktiv</span>
                      </label>
                      <button
                        onClick={togglePreview}
                        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
                      >
                        {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        {showPreview ? 'Dölj förhandsgranskning' : 'Förhandsgranskning'}
                      </button>
                    </div>
                  </div>

                  {/* Receivers */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mottagare
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(receiverTypeLabels).map(([type, label]) => (
                        <button
                          key={type}
                          onClick={() => handleReceiverToggle(type as EmailReceiverType)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            editedTemplate.receivers.includes(type as EmailReceiverType)
                              ? 'bg-blue-100 text-blue-700 border border-blue-300'
                              : 'bg-gray-100 text-gray-600 border border-gray-300'
                          }`}
                        >
                          <Users className="w-4 h-4 inline mr-1" />
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Subject */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ämnesrad
                    </label>
                    <input
                      type="text"
                      value={editedTemplate.subject}
                      onChange={(e) => setEditedTemplate({
                        ...editedTemplate,
                        subject: e.target.value
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* HTML Content */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      HTML-innehåll
                    </label>
                    {showPreview ? (
                      <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                        <div dangerouslySetInnerHTML={{ __html: getPreviewHtml() }} />
                      </div>
                    ) : (
                      <textarea
                        value={editedTemplate.htmlContent}
                        onChange={(e) => setEditedTemplate({
                          ...editedTemplate,
                          htmlContent: e.target.value
                        })}
                        rows={15}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                      />
                    )}
                  </div>

                  {/* Variables Help */}
                  <div className="mb-6 bg-blue-50 p-4 rounded-lg">
                    <h3 className="text-sm font-semibold text-blue-800 mb-2">Tillgängliga variabler:</h3>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <code className="bg-white px-2 py-1 rounded">{'{{user.firstName}}'}</code>
                      <code className="bg-white px-2 py-1 rounded">{'{{user.lastName}}'}</code>
                      <code className="bg-white px-2 py-1 rounded">{'{{user.fullName}}'}</code>
                      <code className="bg-white px-2 py-1 rounded">{'{{user.email}}'}</code>
                      <code className="bg-white px-2 py-1 rounded">{'{{booking.scheduledDate}}'}</code>
                      <code className="bg-white px-2 py-1 rounded">{'{{booking.startTime}}'}</code>
                      <code className="bg-white px-2 py-1 rounded">{'{{booking.endTime}}'}</code>
                      <code className="bg-white px-2 py-1 rounded">{'{{booking.lessonTypeName}}'}</code>
                      <code className="bg-white px-2 py-1 rounded">{'{{booking.totalPrice}}'}</code>
                      <code className="bg-white px-2 py-1 rounded">{'{{booking.id}}'}</code>
                      <code className="bg-white px-2 py-1 rounded">{'{{appUrl}}'}</code>
                      <code className="bg-white px-2 py-1 rounded">{'{{schoolName}}'}</code>
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end gap-4">
                    <button
                      onClick={() => {
                        setEditedTemplate({ ...selectedTemplate! });
                      }}
                      className="px-6 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Återställ
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                        isSaving
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      <Save className="w-4 h-4" />
                      {isSaving ? 'Sparar...' : 'Spara ändringar'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <Mail className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p>Välj en mall för att redigera</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
