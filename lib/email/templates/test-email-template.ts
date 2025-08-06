interface TestEmailTemplateProps {
  recipientName: string;
  schoolName: string;
  contactEmail: string;
  contactName: string;
}

export function createTestEmailTemplate({
  recipientName,
  schoolName,
  contactEmail,
  contactName
}: TestEmailTemplateProps) {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Test Email från ${schoolName}</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #0062cc, #0a2463);
          color: white;
          padding: 20px;
          border-radius: 8px 8px 0 0;
          text-align: center;
        }
        .content {
          background-color: #f9f9f9;
          padding: 20px;
          border-radius: 0 0 8px 8px;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        .footer {
          margin-top: 20px;
          font-size: 12px;
          text-align: center;
          color: #666;
        }
        h1 {
          margin: 0;
          font-size: 24px;
        }
        p {
          margin: 16px 0;
        }
        .button {
          display: inline-block;
          background: linear-gradient(135deg, #0062cc, #0a2463);
          color: white;
          text-decoration: none;
          padding: 10px 20px;
          border-radius: 4px;
          margin-top: 15px;
        }
        .highlight {
          color: #0062cc;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${schoolName}</h1>
      </div>
      <div class="content">
        <p>Hej ${recipientName},</p>
        
        <p>Detta är ett testmail för att verifiera att skolans kontakt-email fungerar korrekt.</p>
        
        <p>Kontaktperson: <span class="highlight">${contactName}</span><br>
        Kontakt e-post: <span class="highlight">${contactEmail}</span></p>
        
        <p>När denna funktionalitet är aktiverad kommer skolan att få notifikationer om:</p>
        <ul>
          <li>Nya bokningar</li>
          <li>Genomförda betalningar</li>
          <li>Avbokningar</li>
        </ul>
        
        <p>Detta meddelande bekräftar att e-postinställningarna fungerar korrekt.</p>
        
        <p>Med vänliga hälsningar,<br>
        ${schoolName}</p>
      </div>
      <div class="footer">
        <p>Detta är ett automatiserat meddelande, vänligen svara inte på detta email.</p>
      </div>
    </body>
    </html>
  `;

  const textContent = `
Hej ${recipientName},

Detta är ett testmail för att verifiera att skolans kontakt-email fungerar korrekt.

Kontaktperson: ${contactName}
Kontakt e-post: ${contactEmail}

När denna funktionalitet är aktiverad kommer skolan att få notifikationer om:
- Nya bokningar
- Genomförda betalningar
- Avbokningar

Detta meddelande bekräftar att e-postinställningarna fungerar korrekt.

Med vänliga hälsningar,
${schoolName}

Detta är ett automatiserat meddelande, vänligen svara inte på detta email.
  `;

  return { htmlContent, textContent };
}
