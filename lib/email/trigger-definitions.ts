import { EmailTriggerType, EmailReceiverType } from './enhanced-email-service';

export interface TriggerDefinition {
  id: EmailTriggerType;
  name: string;
  description: string;
  category: 'authentication' | 'booking' | 'payment' | 'handledar' | 'admin' | 'system';
  flowPosition: string;
  triggerLocation: string;
  defaultReceivers: EmailReceiverType[];
  availableVariables: string[];
  whenTriggered: string;
}

export const TRIGGER_DEFINITIONS: TriggerDefinition[] = [
  // Authentication Flow
  {
    id: 'user_login',
    name: 'Användarinloggning',
    description: 'Skickas när en användare loggar in i systemet',
    category: 'authentication',
    flowPosition: 'Vid inloggning',
    triggerLocation: '/api/auth/login',
    defaultReceivers: ['student'],
    availableVariables: ['{{user.firstName}}', '{{user.lastName}}', '{{user.email}}', '{{currentDate}}', '{{currentTime}}'],
    whenTriggered: 'När användaren loggar in framgångsrikt'
  },
  {
    id: 'forgot_password',
    name: 'Glömt lösenord',
    description: 'Skickas när användaren begär lösenordsåterställning',
    category: 'authentication',
    flowPosition: 'Vid lösenordsåterställning',
    triggerLocation: '/api/auth/forgot/start',
    defaultReceivers: ['student'],
    availableVariables: ['{{user.firstName}}', '{{user.lastName}}', '{{user.email}}', '{{customData.resetToken}}', '{{appUrl}}'],
    whenTriggered: 'När användaren begär lösenordsåterställning'
  },
  {
    id: 'new_user',
    name: 'Ny användare registrerad',
    description: 'Välkomstmail när ny användare registreras',
    category: 'authentication',
    flowPosition: 'Vid registrering',
    triggerLocation: '/api/auth/register',
    defaultReceivers: ['student'],
    availableVariables: ['{{user.firstName}}', '{{user.lastName}}', '{{user.email}}', '{{user.customerNumber}}', '{{appUrl}}', '{{schoolName}}', '{{schoolPhone}}', '{{schoolEmail}}'],
    whenTriggered: 'Direkt efter framgångsrik registrering'
  },
  {
    id: 'new_password',
    name: 'Nytt lösenord',
    description: 'Skickas när ett nytt lösenord har satts',
    category: 'authentication',
    flowPosition: 'Efter lösenordsuppdatering',
    triggerLocation: '/api/auth/forgot/reset',
    defaultReceivers: ['student'],
    availableVariables: ['{{user.firstName}}', '{{user.lastName}}', '{{user.email}}', '{{customData.password}}'],
    whenTriggered: 'När lösenordet har uppdaterats framgångsrikt'
  },

  // Regular Booking Flow
  {
    id: 'new_booking',
    name: 'Ny bokning',
    description: 'Skickas när en ny körlektion bokas',
    category: 'booking',
    flowPosition: 'Vid ny bokning',
    triggerLocation: '/api/booking/create',
    defaultReceivers: ['student', 'teacher'],
    availableVariables: ['{{user.firstName}}', '{{user.lastName}}', '{{booking.scheduledDate}}', '{{booking.startTime}}', '{{booking.endTime}}', '{{booking.lessonTypeName}}', '{{teacher.fullName}}', '{{booking.totalPrice}}'],
    whenTriggered: 'Direkt efter att bokningen skapats'
  },
  {
    id: 'booking_confirmed',
    name: 'Bokning bekräftad',
    description: 'Skickas när en bokning bekräftas av admin/lärare',
    category: 'booking',
    flowPosition: 'Vid bokningsbekräftelse',
    triggerLocation: '/api/admin/booking/confirmation',
    defaultReceivers: ['student'],
    availableVariables: ['{{user.firstName}}', '{{user.lastName}}', '{{booking.scheduledDate}}', '{{booking.startTime}}', '{{booking.endTime}}', '{{booking.lessonTypeName}}', '{{teacher.fullName}}'],
    whenTriggered: 'När admin/lärare bekräftar bokningen'
  },
  {
    id: 'moved_booking',
    name: 'Bokning flyttad',
    description: 'Skickas när en bokning flyttas till ny tid',
    category: 'booking',
    flowPosition: 'Vid bokningsförflyttning',
    triggerLocation: '/api/admin/bookings/[id]/move',
    defaultReceivers: ['student'],
    availableVariables: ['{{user.firstName}}', '{{user.lastName}}', '{{booking.scheduledDate}}', '{{booking.startTime}}', '{{booking.endTime}}', '{{booking.lessonTypeName}}', '{{teacher.fullName}}'],
    whenTriggered: 'När en bokning flyttas till ny tid'
  },
  {
    id: 'cancelled_booking',
    name: 'Bokning avbokad',
    description: 'Skickas när en bokning avbokas',
    category: 'booking',
    flowPosition: 'Vid avbokning',
    triggerLocation: '/api/admin/bookings/[id]/cancel',
    defaultReceivers: ['student'],
    availableVariables: ['{{user.firstName}}', '{{user.lastName}}', '{{booking.scheduledDate}}', '{{booking.startTime}}', '{{booking.endTime}}', '{{booking.lessonTypeName}}', '{{teacher.fullName}}'],
    whenTriggered: 'När en bokning avbokas'
  },
  {
    id: 'booking_reminder',
    name: 'Bokningspåminnelse',
    description: 'Påminnelse som skickas före körlektion',
    category: 'booking',
    flowPosition: 'Automatisk påminnelse',
    triggerLocation: 'Cron job - Email service',
    defaultReceivers: ['student'],
    availableVariables: ['{{user.firstName}}', '{{user.lastName}}', '{{booking.scheduledDate}}', '{{booking.startTime}}', '{{booking.endTime}}', '{{booking.lessonTypeName}}', '{{teacher.fullName}}'],
    whenTriggered: '24 timmar före bokad lektion'
  },

  // Handledar Booking Flow
  {
    id: 'handledar_student_confirmation',
    name: 'Handledar elev-bekräftelse',
    description: 'Bekräftelse till eleven när handledarutbildning bokas',
    category: 'handledar',
    flowPosition: 'Vid handledar-bokning (elev)',
    triggerLocation: '/api/admin/handledar-sessions/[id]/add-booking',
    defaultReceivers: ['student'],
    availableVariables: ['{{user.firstName}}', '{{user.lastName}}', '{{booking.scheduledDate}}', '{{booking.startTime}}', '{{booking.endTime}}', '{{booking.title}}', '{{booking.supervisorName}}', '{{booking.price}}'],
    whenTriggered: 'När eleven bokas till handledarutbildning'
  },
  {
    id: 'handledar_supervisor_confirmation',
    name: 'Handledar handledare-bekräftelse',
    description: 'Bekräftelse till handledaren när handledarutbildning bokas',
    category: 'handledar',
    flowPosition: 'Vid handledar-bokning (handledare)',
    triggerLocation: '/api/admin/handledar-sessions/[id]/add-booking',
    defaultReceivers: ['supervisor'],
    availableVariables: ['{{booking.supervisorName}}', '{{booking.scheduledDate}}', '{{booking.startTime}}', '{{booking.endTime}}', '{{booking.title}}', '{{user.firstName}}', '{{user.lastName}}', '{{booking.price}}'],
    whenTriggered: 'När handledare bokas till handledarutbildning'
  },
  {
    id: 'handledar_supervisor_payment_request',
    name: 'Handledar betalningsbegäran',
    description: 'Betalningsbegäran till handledaren för handledarutbildning',
    category: 'handledar',
    flowPosition: 'Vid handledar-bokning (betalning)',
    triggerLocation: '/api/admin/handledar-sessions/[id]/add-booking',
    defaultReceivers: ['supervisor'],
    availableVariables: ['{{booking.supervisorName}}', '{{booking.scheduledDate}}', '{{booking.startTime}}', '{{booking.endTime}}', '{{booking.title}}', '{{booking.price}}', '{{payment.swishNumber}}', '{{payment.landingUrl}}'],
    whenTriggered: 'När betalning begärs för handledarutbildning'
  },
  {
    id: 'handledar_booking_confirmed',
    name: 'Handledar bokning bekräftad',
    description: 'Skickas när handledarutbildning bekräftas',
    category: 'handledar',
    flowPosition: 'Vid handledar-bekräftelse',
    triggerLocation: '/api/admin/handledar-bookings/[id]/confirm',
    defaultReceivers: ['student', 'supervisor'],
    availableVariables: ['{{booking.supervisorName}}', '{{user.firstName}}', '{{user.lastName}}', '{{booking.scheduledDate}}', '{{booking.startTime}}', '{{booking.endTime}}', '{{booking.title}}'],
    whenTriggered: 'När handledarutbildning bekräftas av admin'
  },
  {
    id: 'handledar_booking_moved',
    name: 'Handledar bokning flyttad',
    description: 'Skickas när handledarutbildning flyttas',
    category: 'handledar',
    flowPosition: 'Vid handledar-förflyttning',
    triggerLocation: '/api/admin/handledar-bookings/[id]',
    defaultReceivers: ['supervisor'],
    availableVariables: ['{{booking.supervisorName}}', '{{booking.scheduledDate}}', '{{booking.startTime}}', '{{booking.endTime}}', '{{booking.title}}'],
    whenTriggered: 'När handledarutbildning flyttas till ny tid'
  },
  {
    id: 'handledar_booking_cancelled',
    name: 'Handledar bokning avbokad',
    description: 'Skickas när handledarutbildning avbokas',
    category: 'handledar',
    flowPosition: 'Vid handledar-avbokning',
    triggerLocation: '/api/admin/handledar-bookings/[id]',
    defaultReceivers: ['supervisor'],
    availableVariables: ['{{booking.supervisorName}}', '{{booking.scheduledDate}}', '{{booking.startTime}}', '{{booking.endTime}}', '{{booking.title}}'],
    whenTriggered: 'När handledarutbildning avbokas'
  },
  {
    id: 'handledar_payment_reminder',
    name: 'Handledar betalningspåminnelse',
    description: 'Påminnelse om betalning för handledarutbildning',
    category: 'handledar',
    flowPosition: 'Betalningspåminnelse',
    triggerLocation: 'Cron job eller manuell påminnelse',
    defaultReceivers: ['supervisor'],
    availableVariables: ['{{booking.supervisorName}}', '{{booking.scheduledDate}}', '{{booking.startTime}}', '{{booking.endTime}}', '{{booking.title}}', '{{booking.price}}', '{{payment.landingUrl}}'],
    whenTriggered: 'När betalning är försenad för handledarutbildning'
  },

  // Payment Flow
  {
    id: 'payment_reminder',
    name: 'Betalningspåminnelse',
    description: 'Påminnelse om obetald bokning',
    category: 'payment',
    flowPosition: 'Betalningspåminnelse',
    triggerLocation: 'Cron job eller manuell påminnelse',
    defaultReceivers: ['student'],
    availableVariables: ['{{user.firstName}}', '{{user.lastName}}', '{{booking.scheduledDate}}', '{{booking.startTime}}', '{{booking.totalPrice}}', '{{payment.dueDate}}'],
    whenTriggered: 'När betalning är försenad'
  },
  {
    id: 'payment_confirmed',
    name: 'Betalning bekräftad',
    description: 'Bekräftelse att betalning mottagits',
    category: 'payment',
    flowPosition: 'Efter betalning',
    triggerLocation: '/api/payments/qliro/webhook, /api/admin/payment/confirmation',
    defaultReceivers: ['student'],
    availableVariables: ['{{user.firstName}}', '{{user.lastName}}', '{{payment.amount}}', '{{payment.method}}', '{{payment.reference}}', '{{booking.scheduledDate}}'],
    whenTriggered: 'När betalning konfirmeras'
  },
  {
    id: 'payment_declined',
    name: 'Betalning avvisad',
    description: 'Meddelande när betalning misslyckas',
    category: 'payment',
    flowPosition: 'Efter misslyckad betalning',
    triggerLocation: '/api/payments/qliro/webhook',
    defaultReceivers: ['student'],
    availableVariables: ['{{user.firstName}}', '{{user.lastName}}', '{{payment.amount}}', '{{payment.method}}', '{{booking.scheduledDate}}'],
    whenTriggered: 'När betalning avvisas'
  },
  {
    id: 'swish_payment_verification',
    name: 'Swish betalningsverifiering',
    description: 'Begäran om verifiering av Swish-betalning',
    category: 'payment',
    flowPosition: 'Efter Swish-betalning',
    triggerLocation: '/api/admin/swish/email-action',
    defaultReceivers: ['student'],
    availableVariables: ['{{user.firstName}}', '{{user.lastName}}', '{{payment.amount}}', '{{payment.swishReference}}', '{{booking.scheduledDate}}'],
    whenTriggered: 'När Swish-betalning behöver verifieras'
  },

  // Teacher & Admin Flow
  {
    id: 'teacher_daily_bookings',
    name: 'Lärares dagliga bokningar',
    description: 'Daglig sammanfattning av bokningar för lärare',
    category: 'admin',
    flowPosition: 'Daglig rapport',
    triggerLocation: 'Cron job - Email service',
    defaultReceivers: ['teacher'],
    availableVariables: ['{{teacher.firstName}}', '{{teacher.lastName}}', '{{currentDate}}', '{{bookingsList}}', '{{totalBookings}}'],
    whenTriggered: 'Varje morgon kl 07:00'
  },
  {
    id: 'teacher_feedback_reminder',
    name: 'Lärare feedback-påminnelse',
    description: 'Påminnelse till lärare att lämna feedback',
    category: 'admin',
    flowPosition: 'Efter genomförd lektion',
    triggerLocation: 'Cron job - Efter lektion',
    defaultReceivers: ['teacher'],
    availableVariables: ['{{teacher.firstName}}', '{{teacher.lastName}}', '{{user.firstName}}', '{{user.lastName}}', '{{booking.scheduledDate}}', '{{booking.lessonTypeName}}'],
    whenTriggered: 'Efter genomförd lektion utan feedback'
  },
  {
    id: 'credits_reminder',
    name: 'Kreditpåminnelse',
    description: 'Påminnelse när krediter håller på att ta slut',
    category: 'system',
    flowPosition: 'När krediter är låga',
    triggerLocation: 'Cron job - Credit check',
    defaultReceivers: ['student'],
    availableVariables: ['{{user.firstName}}', '{{user.lastName}}', '{{credits.remaining}}', '{{credits.lessonType}}'],
    whenTriggered: 'När krediter < 2 för en lektionstyp'
  },

  // System & Other
  {
    id: 'feedback_received',
    name: 'Feedback mottagen',
    description: 'Bekräftelse att feedback mottagits',
    category: 'system',
    flowPosition: 'Efter feedback',
    triggerLocation: '/api/feedback/submit',
    defaultReceivers: ['student'],
    availableVariables: ['{{user.firstName}}', '{{user.lastName}}', '{{feedback.date}}', '{{teacher.fullName}}'],
    whenTriggered: 'När feedback lämnas av lärare'
  }
];

export function getTriggersByCategory(category: string): TriggerDefinition[] {
  return TRIGGER_DEFINITIONS.filter(trigger => trigger.category === category);
}

export function getTriggerById(id: EmailTriggerType): TriggerDefinition | undefined {
  return TRIGGER_DEFINITIONS.find(trigger => trigger.id === id);
}

export function getAllTriggerCategories(): string[] {
  return [...new Set(TRIGGER_DEFINITIONS.map(trigger => trigger.category))];
}
