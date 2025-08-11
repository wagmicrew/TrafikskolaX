'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  | 'booking_confirmed'
  | 'credits_reminder'
  | 'payment_reminder'
  | 'payment_confirmation_request'
  | 'payment_confirmed'
  | 'payment_declined'
  | 'feedback_received'
  | 'teacher_daily_bookings'
  | 'teacher_feedback_reminder'
  | 'new_password'
  ;

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
  booking_confirmed: {
    subject: 'Bokning bekräftad - {{booking.lessonTypeName}}',
    htmlContent: `
      <h1>Din bokning är bekräftad!</h1>
      <p>Hej {{user.firstName}},</p>
      <p>Vi har bekräftat din bokning:</p>
      <ul>
        <li>Datum: {{booking.scheduledDate}}</li>
        <li>Tid: {{booking.startTime}} - {{booking.endTime}}</li>
        <li>Typ: {{booking.lessonTypeName}}</li>
      </ul>
      <p>Vi ses på kursen!</p>
      <p><a href="{{appUrl}}/dashboard/student/bokningar/{{booking.id}}">Se din bokning</a></p>
      <p>Med vänliga hälsningar,<br>{{schoolName}}</p>
    `,
    receivers: ['student']
  },
  // Supervisor email when handledar is booked (sent to supervisor and student)
  handledar_booking_confirmed: {
    subject: 'Handledarutbildning bekräftad - {{booking.scheduledDate}}',
    htmlContent: `
      <h1>Bekräftelse: Handledarutbildning</h1>
      <p>Hej {{user.firstName}},</p>
      <p>En handledarutbildning har bokats.</p>
      <ul>
        <li>Datum: {{booking.scheduledDate}}</li>
        <li>Tid: {{booking.startTime}} - {{booking.endTime}}</li>
        <li>Typ: {{booking.lessonTypeName}}</li>
      </ul>
      <p>Denna bekräftelse skickas även till handledaren.</p>
      <p>Med vänliga hälsningar,<br>{{schoolName}}</p>
    `,
    receivers: ['student']
  },
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
      <p><a href="{{appUrl}}/dashboard/student/bokningar/{{booking.id}}">Se din bokning</a></p>
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
      <p><a href="{{appUrl}}/dashboard/student/bokningar/{{booking.id}}">Se din bokning</a></p>
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
  const [useWysiwyg, setUseWysiwyg] = useState(true);
  const wysiwygRef = useRef<HTMLDivElement | null>(null);
  const htmlTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const appUrl = (typeof window !== 'undefined' && window.location?.origin) || (process.env.NEXT_PUBLIC_APP_URL || 'https://dintrafikskolahlm.se');

  // Quick page selector for links
  const quickPages = [
    { label: 'Startsida', path: '/' },
    { label: 'Logga in', path: '/inloggning' },
    { label: 'Boka körning', path: '/boka-korning' },
    { label: 'Paketbutik', path: '/packages-store' },
    { label: 'Student dashboard', path: '/dashboard/student' },
    { label: 'Admin dashboard', path: '/dashboard/admin' },
    { label: 'Min profil', path: '/dashboard/user/profile' },
    { label: 'Bokning (din)', path: '/dashboard/student/bokningar/{{booking.id}}' },
  ];

  // Inline link popover state
  const [linkPopover, setLinkPopover] = useState<{
    visible: boolean;
    x: number;
    y: number;
    url: string;
    isExisting: boolean;
  }>({ visible: false, x: 0, y: 0, url: '', isExisting: false });
  const selectedRangeRef = useRef<Range | null>(null);
  const editingAnchorRef = useRef<HTMLAnchorElement | null>(null);

  // Button dialog state
  const [showButtonDialog, setShowButtonDialog] = useState(false);
  const [buttonDraft, setButtonDraft] = useState({
    label: 'Öppna',
    href: appUrl + '/',
    color: 'red', // red | sky | gray | green
    size: 'md', // sm | md | lg
    align: 'left' as 'left' | 'center' | 'right',
    variant: 'filled' as 'filled' | 'outline',
    shadow: false as boolean,
  });
  const editingButtonRef = useRef<HTMLAnchorElement | null>(null);

  // Parameter picker state
  const [showParamDialog, setShowParamDialog] = useState(false);
  const [paramSearch, setParamSearch] = useState('');
  type VarItem = { token: string; description: string; category: 'system'|'user'|'booking'|'teacher'|'custom' };
  const VAR_DOCS: Record<string, { description: string; category: VarItem['category'] }> = {
    // System
    '{{appUrl}}': { description: 'Appens bas-URL', category: 'system' },
    '{{schoolName}}': { description: 'Skolans namn', category: 'system' },
    '{{currentYear}}': { description: 'Nuvarande årtal', category: 'system' },
    // User
    '{{user.firstName}}': { description: 'Användarens förnamn', category: 'user' },
    '{{user.lastName}}': { description: 'Användarens efternamn', category: 'user' },
    '{{user.fullName}}': { description: 'Användarens fullständiga namn', category: 'user' },
    '{{user.email}}': { description: 'Användarens e-post', category: 'user' },
    // Booking
    '{{booking.id}}': { description: 'Boknings-ID', category: 'booking' },
    '{{booking.scheduledDate}}': { description: 'Bokningsdatum', category: 'booking' },
    '{{booking.startTime}}': { description: 'Starttid', category: 'booking' },
    '{{booking.endTime}}': { description: 'Sluttid', category: 'booking' },
    '{{booking.lessonTypeName}}': { description: 'Lektionstypens namn', category: 'booking' },
    '{{booking.totalPrice}}': { description: 'Totalt pris', category: 'booking' },
    '{{booking.swishUUID}}': { description: 'Swish-referens (om finns)', category: 'booking' },
    // Teacher
    '{{teacher.firstName}}': { description: 'Lärarens förnamn', category: 'teacher' },
    '{{teacher.lastName}}': { description: 'Lärarens efternamn', category: 'teacher' },
    '{{teacher.fullName}}': { description: 'Lärarens fullständiga namn', category: 'teacher' },
    // Custom for some triggers
    '{{bookingsList}}': { description: 'Formatterad lista över dagens bokningar (HTML)', category: 'custom' },
  };

  const TRIGGER_TO_CATEGORIES: Record<EmailTriggerType, Array<VarItem['category']>> = {
    user_login: ['system', 'user'],
    forgot_password: ['system', 'user'],
    new_user: ['system', 'user'],
    new_booking: ['system', 'user', 'booking'],
    moved_booking: ['system', 'user', 'booking'],
    cancelled_booking: ['system', 'user', 'booking'],
    booking_reminder: ['system', 'user', 'booking'],
    credits_reminder: ['system', 'user'],
    payment_reminder: ['system', 'user', 'booking'],
    payment_confirmation_request: ['system', 'user', 'booking'],
    payment_confirmed: ['system', 'user', 'booking'],
    payment_declined: ['system', 'user', 'booking'],
    feedback_received: ['system', 'user', 'booking', 'teacher'],
    teacher_daily_bookings: ['system', 'teacher', 'custom'],
    teacher_feedback_reminder: ['system', 'teacher', 'booking'],
    new_password: ['system', 'user'],
    
  } as Record<EmailTriggerType, Array<VarItem['category']>>;

  const availableVarItems: VarItem[] = (() => {
    if (!selectedTemplate) return [];
    const cats = TRIGGER_TO_CATEGORIES[selectedTemplate.triggerType] || ['system', 'user'];
    const items: VarItem[] = Object.entries(VAR_DOCS)
      .filter(([token, meta]) => cats.includes(meta.category))
      .map(([token, meta]) => ({ token, description: meta.description, category: meta.category }));
    // Ensure system vars always present
    Object.entries(VAR_DOCS).forEach(([token, meta]) => {
      if (meta.category === 'system' && !items.find(i => i.token === token)) {
        items.push({ token, description: meta.description, category: meta.category });
      }
    });
    // Search filter
    const q = paramSearch.trim().toLowerCase();
    return q ? items.filter(i => i.token.toLowerCase().includes(q) || i.description.toLowerCase().includes(q)) : items;
  })();

  const insertToken = (token: string) => {
    if (useWysiwyg) {
      insertHtml(token);
    } else if (htmlTextareaRef.current) {
      const textarea = htmlTextareaRef.current;
      const start = textarea.selectionStart || 0;
      const end = textarea.selectionEnd || 0;
      const value = textarea.value || '';
      const next = value.slice(0, start) + token + value.slice(end);
      handleTemplateChange('htmlContent', next);
      // Restore caret after inserted token
      requestAnimationFrame(() => {
        textarea.focus();
        const pos = start + token.length;
        textarea.setSelectionRange(pos, pos);
      });
    }
    setShowParamDialog(false);
  };

  const buildWrappedPreviewHtml = (subject: string, innerHtml: string) => {
    const replaced = (innerHtml || '')
      .replace(/\{\{schoolName\}\}/g, schoolname)
      .replace(/\{\{schoolPhone\}\}/g, schoolPhone)
      .replace(/\{\{appUrl\}\}/g, appUrl)
      .replace(/\{\{currentYear\}\}/g, new Date().getFullYear().toString());

    return `<!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject || 'E-postförhandsvisning'}</title>
        <style>
          body { margin:0; padding:0; background-color:#f5f5f5; font-family: Arial, sans-serif; }
          .container { max-width:600px; margin:0 auto; background:#ffffff; border-radius:10px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 24px 16px; text-align:center; }
          .header .brand { color:#ffffff; text-shadow:0 2px 4px rgba(0,0,0,0.2); font-weight:bold; font-size:18px; }
          .content { padding: 32px 24px; color:#374151; line-height:1.6; font-size:16px; }
          .title { color:#dc2626; font-size:22px; margin:0 0 16px 0; text-align:center; border-bottom:2px solid #fee2e2; padding-bottom:8px; }
          .footer { padding: 16px; background:#fafafa; color:#6b7280; font-size:12px; text-align:center; border-top:1px solid #e5e7eb; }
          a.button { display:inline-block; background:#dc2626; color:#fff; padding:10px 18px; border-radius:6px; text-decoration:none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="brand">${schoolname}</div>
          </div>
          <div class="content">
            <h2 class="title">${subject || ''}</h2>
            <div>${replaced}</div>
          </div>
          <div class="footer">
            <div>E-post: info@dintrafikskolahlm.se | Telefon: ${schoolPhone}</div>
            <div>© ${new Date().getFullYear()} ${schoolname}</div>
          </div>
        </div>
      </body>
    </html>`;
  };

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
      
      // Create missing templates in background to avoid blocking initial load
      const existingTriggers = data.templates.map((t: EmailTemplate) => t.triggerType);
      const missingTriggers = Object.keys(defaultTemplates).filter(
        trigger => !existingTriggers.includes(trigger)
      );
      if (missingTriggers.length > 0) {
        // Fire and forget, then silently refresh after completion
        createMissingTemplates(missingTriggers as EmailTriggerType[]) // no await
          .then(() => fetchTemplates())
          .catch(() => {/* ignore */});
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

  const exec = (command: string, value?: string) => {
    if (!wysiwygRef.current) return;
    // Preserve current selection so formatting happens at caret
    saveSelection();
    wysiwygRef.current.focus();
    try {
      document.execCommand(command, false, value);
      handleTemplateChange('htmlContent', wysiwygRef.current.innerHTML);
    } catch {}
  };

  const insertLink = () => {
    if (!wysiwygRef.current) return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    if (range.collapsed) {
      toast.error('Markera texten som ska bli en länk');
      return;
    }
    selectedRangeRef.current = range.cloneRange();
    const rect = range.getBoundingClientRect();
    // If inside an existing link, open for edit
    let node: Node | null = sel.anchorNode;
    let foundAnchor: HTMLAnchorElement | null = null;
    while (node && node !== wysiwygRef.current) {
      if ((node as HTMLElement).tagName === 'A') { foundAnchor = node as HTMLAnchorElement; break; }
      node = node.parentNode;
    }
    if (foundAnchor) {
      editingAnchorRef.current = foundAnchor;
      setLinkPopover({
        visible: true,
        x: rect.left + window.scrollX,
        y: rect.bottom + window.scrollY + 6,
        url: foundAnchor.getAttribute('href') || '',
        isExisting: true,
      });
    } else {
      setLinkPopover({
        visible: true,
        x: rect.left + window.scrollX,
        y: rect.bottom + window.scrollY + 6,
        url: '',
        isExisting: false,
      });
    }
  };

  const setBlock = (tag: 'H1'|'H2'|'P') => {
    document.execCommand('formatBlock', false, tag);
    if (wysiwygRef.current) handleTemplateChange('htmlContent', wysiwygRef.current.innerHTML);
  };

  // Selection helpers to ensure inserts happen at caret
  const isNodeInsideEditor = (node: Node | null) => {
    if (!node || !wysiwygRef.current) return false;
    return node === wysiwygRef.current || wysiwygRef.current.contains(node as Node);
  };

  const saveSelection = () => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    if (!isNodeInsideEditor(range.startContainer) || !isNodeInsideEditor(range.endContainer)) return;
    selectedRangeRef.current = range.cloneRange();
  };

  const restoreSelection = () => {
    if (!wysiwygRef.current || !selectedRangeRef.current) return false;
    const sel = window.getSelection();
    if (!sel) return false;
    sel.removeAllRanges();
    sel.addRange(selectedRangeRef.current);
    return true;
  };

  const insertHtml = (html: string) => {
    const editor = wysiwygRef.current;
    if (!editor) return;
    editor.focus();
    // Try to restore last known selection inside editor
    restoreSelection();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    // Ensure range is inside editor
    if (!isNodeInsideEditor(range.startContainer) || !isNodeInsideEditor(range.endContainer)) {
      // Place caret at end if not inside
      const endRange = document.createRange();
      endRange.selectNodeContents(editor);
      endRange.collapse(false);
      sel.removeAllRanges();
      sel.addRange(endRange);
    }
    const activeRange = sel.getRangeAt(0);
    // Replace selection with HTML fragment
    activeRange.deleteContents();
    const temp = document.createElement('div');
    temp.innerHTML = html;
    const frag = document.createDocumentFragment();
    let lastNode: Node | null = null;
    while (temp.firstChild) {
      lastNode = frag.appendChild(temp.firstChild);
    }
    const firstNode = frag.firstChild;
    activeRange.insertNode(frag);
    // Move caret after inserted content
    if (lastNode) {
      const newRange = document.createRange();
      newRange.setStartAfter(lastNode);
      newRange.collapse(true);
      sel.removeAllRanges();
      sel.addRange(newRange);
      // Save new selection state
      selectedRangeRef.current = newRange.cloneRange();
    }
    handleTemplateChange('htmlContent', editor.innerHTML);
  };

  const insertButton = () => {
    // Save current selection to restore on insert
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      selectedRangeRef.current = sel.getRangeAt(0).cloneRange();
    }
    // Open styled dialog instead of prompt
    setButtonDraft(prev => ({ ...prev, label: 'Visa mer', href: appUrl + '/', color: 'red', size: 'md', align: 'left', variant: 'filled', shadow: false }));
    editingButtonRef.current = null;
    setShowButtonDialog(true);
  };

  const insertSpacer = (px: number) => {
    insertHtml(`<div style="height:${px}px; line-height:${px}px; font-size:0;"></div>`);
  };

  const insertTable = () => {
    // Save selection before prompts (prompts may blur the editor)
    saveSelection();
    const rows = Math.max(1, Math.min(6, parseInt(prompt('Antal rader', '2') || '2', 10)));
    const cols = Math.max(1, Math.min(6, parseInt(prompt('Antal kolumner', '2') || '2', 10)));
    let table = `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%; border-collapse:collapse;">
      <tbody>`;
    for (let r = 0; r < rows; r++) {
      table += '<tr>';
      for (let c = 0; c < cols; c++) {
        table += `<td style="padding:8px; border:1px solid #eee;">Cell</td>`;
      }
      table += '</tr>';
    }
    table += '</tbody></table>';
    insertHtml(table);
  };

  const makeResponsive = () => {
    if (!wysiwygRef.current) return;
    const cur = wysiwygRef.current.innerHTML || '';
    if (cur.includes('data-editor-responsive')) return;
    const style = `<style data-editor-responsive>img{max-width:100%!important;height:auto!important}table{width:100%!important}</style>`;
    wysiwygRef.current.innerHTML = style + cur;
    handleTemplateChange('htmlContent', wysiwygRef.current.innerHTML);
  };

  // Drag & drop support and visible handles for buttons and tables
  const draggingRef = useRef<HTMLElement | null>(null);
  const lastDownRef = useRef<{ x: number; y: number } | null>(null);

  const injectEditorStyles = () => {
    if (typeof document === 'undefined') return;
    if (document.getElementById('editor-dnd-style')) return;
    const styleEl = document.createElement('style');
    styleEl.id = 'editor-dnd-style';
    styleEl.textContent = `
      /* Visible drag handle (top-right) for editor elements only */
      [data-editor-button], .editor-content table { position: relative; }
      [data-editor-button]::after, .editor-content table::after {
        content: '↕↔'; /* arrows */
        position: absolute;
        top: -8px;
        right: -8px;
        font-size: 10px;
        line-height: 1;
        background: rgba(15,23,42,0.9);
        color: #e2e8f0;
        border: 1px solid rgba(255,255,255,0.25);
        border-radius: 6px;
        padding: 2px 4px;
        pointer-events: none; /* purely visual; drag starts from element */
        z-index: 2;
      }
    `;
    document.head.appendChild(styleEl);
  };

  const enhanceDraggables = () => {
    const editor = wysiwygRef.current;
    if (!editor) return;
    injectEditorStyles();
    // Attach editor-level listeners once
    if (!(editor as any)._dragEnhanced) {
      editor.addEventListener('dragover', (e) => {
        e.preventDefault();
        if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
      });
      editor.addEventListener('drop', (e) => {
        e.preventDefault();
        const targetEditor = wysiwygRef.current;
        if (!targetEditor || !draggingRef.current) return;
        const sel = window.getSelection();
        let range: Range | null = null;
        // @ts-ignore
        if (document.caretRangeFromPoint) {
          // @ts-ignore
          range = document.caretRangeFromPoint(e.clientX, e.clientY);
        } else if ((document as any).caretPositionFromPoint) {
          const pos = (document as any).caretPositionFromPoint(e.clientX, e.clientY);
          if (pos) {
            range = document.createRange();
            range.setStart(pos.offsetNode, pos.offset);
            range.collapse(true);
          }
        }
        if (!range) {
          range = document.createRange();
          range.selectNodeContents(targetEditor);
          range.collapse(false);
        }
        if (sel) { sel.removeAllRanges(); sel.addRange(range); }
        const node = draggingRef.current;
        try {
          range.insertNode(node);
        } catch {}
        draggingRef.current = null;
        handleTemplateChange('htmlContent', targetEditor.innerHTML);
        saveSelection();
      });
      (editor as any)._dragEnhanced = true;
    }
    const makeDraggable = (el: HTMLElement) => {
      if ((el as any)._dragBound) return;
      (el as any)._dragBound = true;
      // Always set draggable; gate drag start via handle hit test
      el.setAttribute('draggable', 'true');
      el.addEventListener('mousedown', (e) => {
        lastDownRef.current = { x: e.clientX, y: e.clientY };
      });
      el.addEventListener('dragstart', (e) => {
        const rect = el.getBoundingClientRect();
        const pt = (e instanceof DragEvent && e.clientX && e.clientY)
          ? { x: e.clientX, y: e.clientY }
          : (lastDownRef.current || { x: rect.right, y: rect.top });
        const withinHandle = pt.x >= rect.right - 24 && pt.x <= rect.right && pt.y >= rect.top && pt.y <= rect.top + 24;
        if (!withinHandle) {
          e.preventDefault();
          return;
        }
        draggingRef.current = el;
        if (e.dataTransfer) {
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('text/plain', 'move');
        }
      });
      el.addEventListener('dragend', () => {
        draggingRef.current = null;
      });
    };
    editor.querySelectorAll('a[data-editor-button], table').forEach((n) => makeDraggable(n as HTMLElement));
  };

  useEffect(() => { enhanceDraggables(); }, [editedTemplate?.htmlContent]);

  // Editor click handler for editing links and buttons
  const onEditorClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (!target) return;
    if (target.tagName === 'A') {
      e.preventDefault();
      e.stopPropagation();
      const anchor = target as HTMLAnchorElement;
      if (anchor.dataset.editorButton === '1') {
        // Open button dialog for edit
        editingButtonRef.current = anchor;
        // Guess style
        const style = anchor.getAttribute('style') || '';
        const draft = { ...buttonDraft };
        draft.label = anchor.textContent || draft.label;
        draft.href = anchor.getAttribute('href') || draft.href;
        draft.color = style.includes('#0ea5e9') ? 'sky' : style.includes('#22c55e') ? 'green' : style.includes('#6b7280') ? 'gray' : 'red';
        draft.size = style.includes('padding:8px') ? 'sm' : style.includes('padding:14px') ? 'lg' : 'md';
        // Align: check parent text-align
        const parent = anchor.parentElement;
        draft.align = (parent && getComputedStyle(parent).textAlign as any) || 'left';
        // Variant & shadow from dataset if present
        const ds = (anchor as HTMLAnchorElement).dataset;
        if (ds.editorButtonVariant === 'outline') draft.variant = 'outline'; else draft.variant = 'filled';
        draft.shadow = ds.editorButtonShadow === '1' || style.includes('box-shadow');
        setButtonDraft(draft);
        setShowButtonDialog(true);
      } else {
        // Link popover
        const rect = anchor.getBoundingClientRect();
        editingAnchorRef.current = anchor;
        setLinkPopover({
          visible: true,
          x: rect.left + window.scrollX,
          y: rect.bottom + window.scrollY + 6,
          url: anchor.getAttribute('href') || '',
          isExisting: true,
        });
      }
    }
  };

  const resolveUrl = (input: string) => {
    if (!input) return '';
    if (input.startsWith('http://') || input.startsWith('https://') || input.startsWith('mailto:')) return input;
    // If starts with '/', treat as app relative
    if (input.startsWith('/')) return appUrl + input;
    return input;
  };

  const saveLinkPopover = () => {
    if (!wysiwygRef.current) return;
    const href = resolveUrl(linkPopover.url.trim());
    if (!href) { toast.error('Ange en länk-URL'); return; }
    if (linkPopover.isExisting && editingAnchorRef.current) {
      editingAnchorRef.current.setAttribute('href', href);
      handleTemplateChange('htmlContent', wysiwygRef.current.innerHTML);
    } else if (selectedRangeRef.current) {
      // Restore selection
      const sel = window.getSelection();
      if (sel) { sel.removeAllRanges(); sel.addRange(selectedRangeRef.current); }
      exec('createLink', href);
    }
    setLinkPopover({ ...linkPopover, visible: false });
    editingAnchorRef.current = null;
    selectedRangeRef.current = null;
  };

  const unlink = () => {
    if (!wysiwygRef.current) return;
    if (editingAnchorRef.current) {
      const a = editingAnchorRef.current;
      const text = a.textContent || '';
      a.replaceWith(document.createTextNode(text));
      handleTemplateChange('htmlContent', wysiwygRef.current.innerHTML);
    } else {
      exec('unlink');
    }
    setLinkPopover({ ...linkPopover, visible: false });
    editingAnchorRef.current = null;
    selectedRangeRef.current = null;
  };

  const buildButtonHtml = (draft: typeof buttonDraft) => {
    const colorMap: Record<string, string> = {
      red: '#dc2626',
      sky: '#0ea5e9',
      gray: '#6b7280',
      green: '#22c55e',
    };
    const pad = draft.size === 'sm' ? '8px 14px' : draft.size === 'lg' ? '14px 22px' : '10px 18px';
    const colorHex = colorMap[draft.color];
    const rgbaMap: Record<string, string> = {
      '#dc2626': '220,38,38',
      '#0ea5e9': '14,165,233',
      '#6b7280': '107,114,128',
      '#22c55e': '34,197,94',
    };
    const shadow = draft.shadow ? `box-shadow:0 6px 14px rgba(${rgbaMap[colorHex]},0.35);` : '';
    const styleFilled = `display:inline-block;background:${colorHex};color:#fff;padding:${pad};border-radius:6px;text-decoration:none;font-weight:bold;${shadow}`;
    const styleOutline = `display:inline-block;background:transparent;color:${colorHex};padding:${pad};border-radius:6px;text-decoration:none;font-weight:bold;border:2px solid ${colorHex};${shadow}`;
    const style = draft.variant === 'outline' ? styleOutline : styleFilled;
    const btn = `<a data-editor-button="1" data-editor-button-variant="${draft.variant}" data-editor-button-shadow="${draft.shadow ? '1' : '0'}" href="${resolveUrl(draft.href)}" style="${style}">${draft.label}</a>`;
    if (draft.align === 'left') return btn;
    return `<div style="text-align:${draft.align};">${btn}</div>`;
  };

  const saveButtonDialog = () => {
    if (!wysiwygRef.current) return;
    if (editingButtonRef.current) {
      const anchor = editingButtonRef.current;
      anchor.setAttribute('href', resolveUrl(buttonDraft.href));
      anchor.textContent = buttonDraft.label;
      // Update style and data attrs
      const colorMap: Record<string, string> = { red: '#dc2626', sky: '#0ea5e9', gray: '#6b7280', green: '#22c55e' };
      const rgbaMap: Record<string, string> = { '#dc2626': '220,38,38', '#0ea5e9': '14,165,233', '#6b7280': '107,114,128', '#22c55e': '34,197,94' };
      const pad = buttonDraft.size === 'sm' ? '8px 14px' : buttonDraft.size === 'lg' ? '14px 22px' : '10px 18px';
      const hex = colorMap[buttonDraft.color];
      const shadow = buttonDraft.shadow ? `box-shadow:0 6px 14px rgba(${rgbaMap[hex]},0.35);` : '';
      const styleFilled = `display:inline-block;background:${hex};color:#fff;padding:${pad};border-radius:6px;text-decoration:none;font-weight:bold;${shadow}`;
      const styleOutline = `display:inline-block;background:transparent;color:${hex};padding:${pad};border-radius:6px;text-decoration:none;font-weight:bold;border:2px solid ${hex};${shadow}`;
      anchor.setAttribute('style', buttonDraft.variant === 'outline' ? styleOutline : styleFilled);
      anchor.dataset.editorButtonVariant = buttonDraft.variant;
      anchor.dataset.editorButtonShadow = buttonDraft.shadow ? '1' : '0';
      // Align by adjusting parent if simple wrapper
      const parent = anchor.parentElement;
      if (parent && (parent.tagName === 'DIV')) {
        parent.style.textAlign = buttonDraft.align;
      }
      handleTemplateChange('htmlContent', wysiwygRef.current.innerHTML);
    } else {
      // Ensure editor focused and selection restored before inserting
      wysiwygRef.current.focus();
      if (selectedRangeRef.current) {
        const sel = window.getSelection();
        if (sel) { sel.removeAllRanges(); sel.addRange(selectedRangeRef.current); }
      }
      insertHtml(buildButtonHtml(buttonDraft));
    }
    setShowButtonDialog(false);
    editingButtonRef.current = null;
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <Mail className="w-7 h-7 text-sky-400" /> E-postmallar
            </h1>
            <p className="text-slate-300 mt-1">Hantera och redigera e-postmallar för olika händelser</p>
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

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-white font-medium">Innehåll</label>
                        <div className="flex items-center gap-2 text-sm">
                          <span className={`px-2 py-1 rounded ${useWysiwyg ? 'bg-sky-500/20 text-sky-200 border border-sky-400/30' : 'bg-white/10 text-white border border-white/20'}`}>WYSIWYG</span>
                          <button type="button" onClick={() => setUseWysiwyg(!useWysiwyg)} className="px-2 py-1 rounded bg-white/10 border border-white/20 text-white hover:bg-white/20">Växla</button>
                        </div>
                      </div>

                      {useWysiwyg ? (
                        <div className="rounded-xl bg-white/5 border border-white/20">
                          <div className="flex flex-wrap gap-2 p-2 border-b border-white/10">
                            <button onClick={() => exec('bold')} className="px-2 py-1 rounded bg-white/10 text-white hover:bg-white/20">B</button>
                            <button onClick={() => exec('italic')} className="px-2 py-1 rounded bg-white/10 text-white hover:bg-white/20"><em>I</em></button>
                            <button onClick={() => exec('underline')} className="px-2 py-1 rounded bg-white/10 text-white hover:bg-white/20"><u>U</u></button>
                            <div className="w-px h-6 bg-white/10" />
                            <button onClick={() => setBlock('H1')} className="px-2 py-1 rounded bg-white/10 text-white hover:bg-white/20">H1</button>
                            <button onClick={() => setBlock('H2')} className="px-2 py-1 rounded bg-white/10 text-white hover:bg-white/20">H2</button>
                            <button onClick={() => setBlock('P')} className="px-2 py-1 rounded bg-white/10 text-white hover:bg-white/20">P</button>
                            <div className="w-px h-6 bg-white/10" />
                            <button onMouseDown={(e)=>{e.preventDefault(); saveSelection();}} onClick={() => exec('insertUnorderedList')} className="px-2 py-1 rounded bg-white/10 text-white hover:bg-white/20">• Lista</button>
                            <button onMouseDown={(e)=>{e.preventDefault(); saveSelection();}} onClick={() => exec('insertOrderedList')} className="px-2 py-1 rounded bg-white/10 text-white hover:bg-white/20">1. Lista</button>
                            <button onMouseDown={(e)=>{e.preventDefault(); saveSelection();}} onClick={insertLink} className="px-2 py-1 rounded bg-white/10 text-white hover:bg-white/20">Länk</button>
                            <button onMouseDown={(e)=>{e.preventDefault(); saveSelection();}} onClick={() => setShowParamDialog(true)} className="px-2 py-1 rounded bg-white/10 text-white hover:bg-white/20">Parametrar</button>
                            <div className="w-px h-6 bg-white/10" />
                            <button onMouseDown={(e)=>{e.preventDefault(); saveSelection();}} onClick={() => exec('justifyLeft')} className="px-2 py-1 rounded bg-white/10 text-white hover:bg-white/20">Vänster</button>
                            <button onMouseDown={(e)=>{e.preventDefault(); saveSelection();}} onClick={() => exec('justifyCenter')} className="px-2 py-1 rounded bg-white/10 text-white hover:bg-white/20">Mitten</button>
                            <button onMouseDown={(e)=>{e.preventDefault(); saveSelection();}} onClick={() => exec('justifyRight')} className="px-2 py-1 rounded bg-white/10 text-white hover:bg-white/20">Höger</button>
                            <div className="w-px h-6 bg-white/10" />
                            <button onMouseDown={(e)=>{e.preventDefault(); saveSelection();}} onClick={insertButton} className="px-2 py-1 rounded bg-white/10 text-white hover:bg-white/20">Knapp</button>
                            <button onMouseDown={(e)=>{e.preventDefault(); saveSelection();}} onClick={() => insertSpacer(8)} className="px-2 py-1 rounded bg-white/10 text-white hover:bg-white/20">Mellanrum S</button>
                            <button onMouseDown={(e)=>{e.preventDefault(); saveSelection();}} onClick={() => insertSpacer(16)} className="px-2 py-1 rounded bg-white/10 text-white hover:bg-white/20">Mellanrum M</button>
                            <button onMouseDown={(e)=>{e.preventDefault(); saveSelection();}} onClick={() => insertSpacer(24)} className="px-2 py-1 rounded bg-white/10 text-white hover:bg-white/20">Mellanrum L</button>
                            <button onMouseDown={(e)=>{e.preventDefault(); saveSelection();}} onClick={insertTable} className="px-2 py-1 rounded bg-white/10 text-white hover:bg-white/20">Tabell</button>
                            <button onClick={makeResponsive} className="px-2 py-1 rounded bg-white/10 text-white hover:bg-white/20">Responsiv</button>
                          </div>
                          <div
                            ref={wysiwygRef}
                            className="min-h-[320px] p-4 text-white outline-none editor-content"
                            contentEditable
                            suppressContentEditableWarning
                            onInput={(e) => { handleTemplateChange('htmlContent', (e.target as HTMLDivElement).innerHTML); saveSelection(); enhanceDraggables(); }}
         onKeyUp={() => saveSelection()}
         onMouseUp={() => saveSelection()}
         onClick={(e) => { onEditorClick(e); saveSelection(); }}
                            dangerouslySetInnerHTML={{ __html: editedTemplate?.htmlContent || '' }}
                          />
                        </div>
                      ) : (
                        <textarea
                          ref={htmlTextareaRef}
                          value={editedTemplate?.htmlContent || ''}
                          onChange={(e) => handleTemplateChange('htmlContent', e.target.value)}
                          placeholder="HTML-innehåll..."
                          className="w-full h-80 px-4 py-2 bg-white/5 border border-white/20 text-white rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 resize-none placeholder:text-white/50 font-mono text-sm"
                        />
                      )}
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
                  <div className="rounded-lg border border-white/10 overflow-hidden bg-black/20">
                    <iframe
                      title="email-preview"
                      className="w-full h-[700px] bg-white"
                      srcDoc={buildWrappedPreviewHtml(editedTemplate?.subject || '', editedTemplate?.htmlContent || '')}
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

      {/* Parameter Picker Dialog */}
      {showParamDialog && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl w-full max-w-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Infoga parameter</h3>
                <button onClick={() => setShowParamDialog(false)} className="text-white/70 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <div className="mb-4">
                <input
                  value={paramSearch}
                  onChange={(e) => setParamSearch(e.target.value)}
                  placeholder="Sök efter parameter..."
                  className="w-full px-4 py-2 bg-white/5 border border-white/20 text-white rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 placeholder:text-white/50"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[420px] overflow-auto pr-1">
                {availableVarItems.map((item) => (
                  <button
                    key={item.token}
                    onClick={() => insertToken(item.token)}
                    className="text-left p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                  >
                    <div className="text-white font-mono text-sm">{item.token}</div>
                    <div className="text-slate-300 text-xs mt-1">{item.description}</div>
                  </button>
                ))}
                {availableVarItems.length === 0 && (
                  <div className="text-slate-300">Inga parametrar matchar din sökning.</div>
                )}
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowParamDialog(false)} className="px-4 py-2 text-white border border-white/20 hover:bg-white/10 rounded-lg">Stäng</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Link Popover */}
      {linkPopover.visible && (
        <div
          className="absolute z-[95]"
          style={{ left: linkPopover.x, top: linkPopover.y }}
        >
          <div className="bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl rounded-xl p-3 w-[340px]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white text-sm font-semibold">Länk</span>
              <button onClick={() => setLinkPopover({ ...linkPopover, visible: false })} className="text-white/70 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-2">
              <input
                value={linkPopover.url}
                onChange={(e) => setLinkPopover({ ...linkPopover, url: e.target.value })}
                placeholder="https:// eller /sida"
                className="w-full px-3 py-2 bg-white/5 border border-white/20 text-white rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 placeholder:text-white/50"
              />
              <div className="flex items-center gap-2">
                <select
                  onChange={(e) => setLinkPopover({ ...linkPopover, url: e.target.value })}
                  className="flex-1 px-3 py-2 bg-white/5 border border-white/20 text-white rounded-lg focus:ring-2 focus:ring-sky-500"
                  defaultValue=""
                >
                  <option value="" className="bg-gray-900">Snabbval...</option>
                  {quickPages.map((p) => (
                    <option key={p.path} value={p.path} className="bg-gray-900">{p.label}</option>
                  ))}
                </select>
                <button onClick={unlink} className="px-3 py-2 text-white/90 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg">Avlänka</button>
                <button onClick={saveLinkPopover} className="inline-flex items-center gap-1 px-3 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg"><Save className="w-4 h-4" /> Spara</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Button Dialog (Glass style) */}
      {showButtonDialog && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Plus className="w-6 h-6 text-sky-400" />
                  <h3 className="text-lg font-semibold text-white">{editingButtonRef.current ? 'Redigera knapp' : 'Ny knapp'}</h3>
                </div>
                <button onClick={() => setShowButtonDialog(false)} className="text-white/70 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-white text-sm mb-1">Text</label>
                  <input value={buttonDraft.label} onChange={(e) => setButtonDraft({ ...buttonDraft, label: e.target.value })} className="w-full px-3 py-2 bg-white/5 border border-white/20 text-white rounded-lg focus:ring-2 focus:ring-sky-500" />
                </div>
                <div>
                  <label className="block text-white text-sm mb-1">Länk</label>
                  <input value={buttonDraft.href} onChange={(e) => setButtonDraft({ ...buttonDraft, href: e.target.value })} placeholder="https:// eller /sida" className="w-full px-3 py-2 bg-white/5 border border-white/20 text-white rounded-lg focus:ring-2 focus:ring-sky-500" />
                  <div className="mt-2">
                    <select
                      onChange={(e) => setButtonDraft({ ...buttonDraft, href: e.target.value })}
                      className="w-full px-3 py-2 bg-white/5 border border-white/20 text-white rounded-lg focus:ring-2 focus:ring-sky-500"
                      defaultValue=""
                    >
                      <option value="" className="bg-gray-900">Snabbval...</option>
                      {quickPages.map((p) => (
                        <option key={p.path} value={p.path} className="bg-gray-900">{p.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-white text-sm mb-1">Färg</label>
                    <select value={buttonDraft.color} onChange={(e) => setButtonDraft({ ...buttonDraft, color: e.target.value as any })} className="w-full px-3 py-2 bg-white/5 border border-white/20 text-white rounded-lg">
                      <option value="red" className="bg-gray-900">Röd</option>
                      <option value="sky" className="bg-gray-900">Blå</option>
                      <option value="green" className="bg-gray-900">Grön</option>
                      <option value="gray" className="bg-gray-900">Grå</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-white text-sm mb-1">Storlek</label>
                    <select value={buttonDraft.size} onChange={(e) => setButtonDraft({ ...buttonDraft, size: e.target.value as any })} className="w-full px-3 py-2 bg-white/5 border border-white/20 text-white rounded-lg">
                      <option value="sm" className="bg-gray-900">Liten</option>
                      <option value="md" className="bg-gray-900">Mellan</option>
                      <option value="lg" className="bg-gray-900">Stor</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-white text-sm mb-1">Placering</label>
                    <select value={buttonDraft.align} onChange={(e) => setButtonDraft({ ...buttonDraft, align: e.target.value as any })} className="w-full px-3 py-2 bg-white/5 border border-white/20 text-white rounded-lg">
                      <option value="left" className="bg-gray-900">Vänster</option>
                      <option value="center" className="bg-gray-900">Mitten</option>
                      <option value="right" className="bg-gray-900">Höger</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-white text-sm mb-1">Variant</label>
                    <select value={buttonDraft.variant} onChange={(e) => setButtonDraft({ ...buttonDraft, variant: e.target.value as any })} className="w-full px-3 py-2 bg-white/5 border border-white/20 text-white rounded-lg">
                      <option value="filled" className="bg-gray-900">Fylld</option>
                      <option value="outline" className="bg-gray-900">Outline</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <input id="shadow" type="checkbox" checked={buttonDraft.shadow} onChange={(e) => setButtonDraft({ ...buttonDraft, shadow: e.target.checked })} className="rounded border-white/20 bg-white/5" />
                    <label htmlFor="shadow" className="text-white text-sm">Skugga</label>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowButtonDialog(false)} className="px-4 py-2 text-white border border-white/20 hover:bg-white/10 rounded-lg">Avbryt</button>
                <button onClick={saveButtonDialog} className="inline-flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg"><Save className="w-4 h-4" /> Spara</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
