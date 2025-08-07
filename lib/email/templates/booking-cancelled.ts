export const bookingCancelledTemplate = {
  subject: 'Din bokning har avbokats',
  html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Bokning avbokad</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f5f5f5;
        }
        .container {
          background-color: #ffffff;
          border-radius: 10px;
          padding: 30px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #e3f2fd;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .logo {
          font-size: 24px;
          font-weight: bold;
          color: #1976d2;
          margin-bottom: 10px;
        }
        .title {
          color: #d32f2f;
          font-size: 20px;
          font-weight: bold;
          margin-bottom: 20px;
        }
        .booking-details {
          background-color: #f8f9fa;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
          border-left: 4px solid #1976d2;
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
          padding: 5px 0;
        }
        .detail-label {
          font-weight: bold;
          color: #555;
        }
        .detail-value {
          color: #333;
        }
        .credit-info {
          background-color: #e8f5e8;
          border-radius: 8px;
          padding: 15px;
          margin: 20px 0;
          border-left: 4px solid #4caf50;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e0e0e0;
          color: #666;
          font-size: 14px;
        }
        .contact-info {
          background-color: #f0f8ff;
          border-radius: 8px;
          padding: 15px;
          margin: 20px 0;
          text-align: center;
        }
        .btn {
          display: inline-block;
          padding: 12px 24px;
          background-color: #1976d2;
          color: white;
          text-decoration: none;
          border-radius: 6px;
          font-weight: bold;
          margin: 10px 5px;
        }
        .btn:hover {
          background-color: #1565c0;
        }
        .warning {
          background-color: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 6px;
          padding: 15px;
          margin: 20px 0;
          color: #856404;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">Din Trafikskola Hässleholm</div>
          <div class="title">🚫 Bokning avbokad</div>
        </div>

        <p>Hej {{userName}},</p>

        <p>Tyvärr har din bokning avbokats. Här är detaljerna:</p>

        <div class="booking-details">
          <div class="detail-row">
            <span class="detail-label">Lektionstyp:</span>
            <span class="detail-value">{{lessonType}}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Datum:</span>
            <span class="detail-value">{{scheduledDate}}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Tid:</span>
            <span class="detail-value">{{startTime}} - {{endTime}}</span>
          </div>
        </div>

        {{#if creditReimbursed}}
        <div class="credit-info">
          <h3>💰 Kredit återbetald</h3>
          <p>En kredit för denna lektionstyp har återbetalts till ditt konto. Du kan använda denna kredit för att boka en ny lektion.</p>
        </div>
        {{else}}
        <div class="warning">
          <h3>⚠️ Gästbokning</h3>
          <p>Eftersom detta var en gästbokning kan inga krediter återbetalas. Kontakta oss om du har frågor.</p>
        </div>
        {{/if}}

        <div class="contact-info">
          <h3>📞 Behöver du hjälp?</h3>
          <p>Om du har frågor eller vill boka en ny tid, kontakta oss:</p>
          <p><strong>Telefon:</strong> 040-123 45 67</p>
          <p><strong>E-post:</strong> info@dintrafikskolahlm.se</p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="https://dintrafikskolahlm.se" class="btn">Boka ny tid</a>
        </div>

        <div class="footer">
          <p>Med vänliga hälsningar,<br>
          <strong>Din Trafikskola Hässleholm</strong></p>
          <p>Detta är ett automatiskt meddelande. Svara inte på detta mail.</p>
        </div>
      </div>
    </body>
    </html>
  `,
  text: `
Din bokning har avbokats

Hej {{userName}},

Tyvärr har din bokning avbokats.

Bokningsdetaljer:
- Lektionstyp: {{lessonType}}
- Datum: {{scheduledDate}}
- Tid: {{startTime}} - {{endTime}}

{{#if creditReimbursed}}
Kredit återbetald: En kredit för denna lektionstyp har återbetalts till ditt konto.
{{else}}
Gästbokning: Inga krediter kan återbetalas för gästbokningar.
{{/if}}

Behöver du hjälp? Kontakta oss:
Telefon: 040-123 45 67
E-post: info@dintrafikskolahlm.se

Med vänliga hälsningar,
Din Trafikskola Hässleholm
  `
};
