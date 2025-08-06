'use client';

import { EmailTemplateBuilder } from '@/components/Admin/EmailTemplateBuilder';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export type EmailTriggerType = 
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
  | 'new_password';

export type EmailReceiverType = 'student' | 'teacher' | 'admin' | 'specific_user';

export interface EmailTemplate {
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
  teacher_feedback_reminder: 'Feedbackpåminnelse för lärare',
  new_password: 'Nytt lösenord'
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
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">E-postmallar</h1>
          <p className="text-muted-foreground">
            Hantera e-postmallar för automatiska meddelanden och notifikationer
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>E-postmallshanterare</CardTitle>
            <CardDescription>
              Skapa och redigera e-postmallar för olika händelser i systemet.
              Mallarna används för att skicka automatiska meddelanden till användare.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EmailTemplateBuilder />
          </CardContent>
        </Card>
        
        <div className="mt-8 space-y-4">
          <h2 className="text-lg font-medium">Vanliga frågor</h2>
          <div className="space-y-2">
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium">Hur lägger jag till en ny e-postmall?</h3>
              <p className="text-sm text-muted-foreground">
                Använd formuläret ovan för att skapa en ny mall. Välj en lämplig utlösare och fyll i ämne och innehåll.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium">Vilka variabler kan jag använda i mallarna?</h3>
              <p className="text-sm text-muted-foreground">
                Klicka på "Visa tillgängliga variabler" i redigeringsläget för att se en lista över tillgängliga variabler.
                Dessa inkluderar användarinformation, bokningsdetaljer och mer.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
