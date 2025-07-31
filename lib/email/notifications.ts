import { sendEmail } from '@/lib/email/sendEmail';

type PasswordResetEmail = {
  email: string;
  resetLink: string;
};

type BookingReminderEmail = {
  email: string;
  sessionTitle: string;
  sessionDate: string;
  sessionTime: string;
};

type FeedbackRequestEmail = {
  email: string;
  feedbackLink: string;
  sessionTitle: string;
};

// Function to send a password reset email
export const sendPasswordResetEmail = async ({ email, resetLink }: PasswordResetEmail) => {
  const content = {
    title: 'Återställ ditt lösenord',
    body: `
      <p>Du har begärt att återställa ditt lösenord för ditt konto hos Din Trafikskola HLM.</p>
      <p>Klicka på knappen nedan för att återställa ditt lösenord:</p>
      <div style="text-align: center; margin: 20px 0;">
        <a href="${resetLink}" 
           style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
          🔑 Återställ lösenord
        </a>
      </div>
      <p><strong>Viktigt:</strong> Denna länk är giltig i 24 timmar.</p>
      <p>Om du inte begärde denna återställning kan du ignorera detta meddelande.</p>
    `
  };
  await sendEmail(email, 'Återställning av lösenord', content);
};

// Function to send a booking reminder email
export const sendBookingReminderEmail = async ({ email, sessionTitle, sessionDate, sessionTime }: BookingReminderEmail) => {
  const content = {
    title: 'Påminnelse om kommande bokning',
    body: `
      <p>Hej!</p>
      <p>Detta är en påminnelse om din kommande bokning:</p>
      <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
        <h3 style="color: #dc2626; margin-top: 0;">📅 ${sessionTitle}</h3>
        <p style="margin: 8px 0;"><strong>Datum:</strong> ${sessionDate}</p>
        <p style="margin: 8px 0;"><strong>Tid:</strong> ${sessionTime}</p>
      </div>
      <p><strong>Kom ihåg att:</strong></p>
      <ul>
        <li>Ta med ditt körkort (om du har)</li>
        <li>Var punktlig - vi startar i tid</li>
        <li>Ha med bekväma skor</li>
      </ul>
      <p>Vi ser fram emot att träffa dig!</p>
    `
  };
  await sendEmail(email, 'Bokningspåminnelse - Din Trafikskola HLM', content);
};

// Function to send a feedback request email
export const sendFeedbackRequestEmail = async ({ email, feedbackLink, sessionTitle }: FeedbackRequestEmail) => {
  const content = {
    title: 'Vi vill höra från dig! 🌟',
    body: `
      <p>Tack för att du deltog i <strong>${sessionTitle}</strong>!</p>
      <p>Din åsikt är mycket viktig för oss och hjälper oss att förbättra vår undervisning.</p>
      <div style="text-align: center; margin: 25px 0;">
        <a href="${feedbackLink}" 
           style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
          ⭐ Ge din feedback
        </a>
      </div>
      <p>Det tar bara några minuter och gör stor skillnad för oss!</p>
      <p><em>Tack på förhand för din tid.</em></p>
    `
  };
  await sendEmail(email, 'Vi uppskattar din feedback - Din Trafikskola HLM', content);
};

// Function to send a test email
export const sendTestEmail = async (email: string) => {
  const content = {
    title: '✅ Test Email från Din Trafikskola',
    body: `
      <p>Grattis! Detta är ett testmeddelande för att bekräfta att vårt e-postsystem fungerar korrekt.</p>
      <div style="background-color: #dcfce7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #16a34a;">
        <p style="margin: 0; color: #166534;"><strong>✅ E-postsystemet fungerar perfekt!</strong></p>
      </div>
      <p>Detta meddelande skickades: <strong>${new Date().toLocaleString('sv-SE')}</strong></p>
      <p>Alla e-postnotifieringar kommer nu att levereras korrekt till dina användare.</p>
    `
  };
  await sendEmail(email, '🧪 Test Email - E-postsystem OK', content);
};

