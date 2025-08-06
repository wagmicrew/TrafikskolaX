interface BookingConfirmationTemplateProps {
  recipientName: string;
  bookingDetails: {
    lessonType: string;
    date: string;
    time: string;
    duration: number;
    price: string;
    teacherName?: string;
    carDetails?: string;
  };
  schoolDetails: {
    name: string;
    contactEmail: string;
    contactName?: string;
    phone?: string;
  };
  bookingId: string;
  paymentStatus: string;
}

export function createBookingConfirmationTemplate({
  recipientName,
  bookingDetails,
  schoolDetails,
  bookingId,
  paymentStatus
}: BookingConfirmationTemplateProps) {
  const isPaid = paymentStatus === 'paid';
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Bokningsbekräftelse - ${schoolDetails.name}</title>
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
        .details {
          margin: 20px 0;
          padding: 15px;
          background-color: #ffffff;
          border-radius: 4px;
          border-left: 4px solid #0062cc;
        }
        .payment-status {
          display: inline-block;
          padding: 5px 10px;
          border-radius: 4px;
          font-weight: bold;
          color: white;
          margin-top: 10px;
        }
        .paid {
          background-color: #28a745;
        }
        .pending {
          background-color: #ffc107;
          color: #212529;
        }
        .footer {
          margin-top: 20px;
          font-size: 12px;
          text-align: center;
          color: #666;
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
        table {
          width: 100%;
          border-collapse: collapse;
        }
        td {
          padding: 8px;
          border-bottom: 1px solid #eee;
        }
        td:first-child {
          font-weight: bold;
          width: 40%;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Bokningsbekräftelse</h1>
      </div>
      <div class="content">
        <p>Hej ${recipientName},</p>
        
        <p>Vi bekräftar härmed din bokning hos ${schoolDetails.name}.</p>
        
        <div class="details">
          <h2>Bokningsdetaljer</h2>
          <table>
            <tr>
              <td>Boknings-ID:</td>
              <td>${bookingId}</td>
            </tr>
            <tr>
              <td>Lektionstyp:</td>
              <td>${bookingDetails.lessonType}</td>
            </tr>
            <tr>
              <td>Datum:</td>
              <td>${bookingDetails.date}</td>
            </tr>
            <tr>
              <td>Tid:</td>
              <td>${bookingDetails.time}</td>
            </tr>
            <tr>
              <td>Längd:</td>
              <td>${bookingDetails.duration} minuter</td>
            </tr>
            ${bookingDetails.teacherName ? `
            <tr>
              <td>Lärare:</td>
              <td>${bookingDetails.teacherName}</td>
            </tr>
            ` : ''}
            ${bookingDetails.carDetails ? `
            <tr>
              <td>Bil:</td>
              <td>${bookingDetails.carDetails}</td>
            </tr>
            ` : ''}
            <tr>
              <td>Pris:</td>
              <td>${bookingDetails.price} kr</td>
            </tr>
            <tr>
              <td>Betalningsstatus:</td>
              <td>
                <span class="payment-status ${isPaid ? 'paid' : 'pending'}">
                  ${isPaid ? 'Betald' : 'Ej betald'}
                </span>
              </td>
            </tr>
          </table>
        </div>
        
        ${!isPaid ? `
        <p>
          <strong>Notera:</strong> Din bokning är ännu inte betald. För att säkerställa din plats, vänligen slutför betalningen snarast.
        </p>
        ` : ''}

        <p>
          Om du har några frågor angående din bokning, vänligen kontakta oss på:
          <br />
          E-post: ${schoolDetails.contactEmail}
          ${schoolDetails.phone ? `<br />Telefon: ${schoolDetails.phone}` : ''}
        </p>
        
        <p>Vi ser fram emot att träffa dig!</p>
        
        <p>Med vänliga hälsningar,<br>
        ${schoolDetails.contactName || schoolDetails.name}</p>
      </div>
      <div class="footer">
        <p>Detta är en automatiserad bokningsbekräftelse från ${schoolDetails.name}.</p>
      </div>
    </body>
    </html>
  `;

  const textContent = `
Bokningsbekräftelse - ${schoolDetails.name}

Hej ${recipientName},

Vi bekräftar härmed din bokning hos ${schoolDetails.name}.

BOKNINGSDETALJER
----------------
Boknings-ID: ${bookingId}
Lektionstyp: ${bookingDetails.lessonType}
Datum: ${bookingDetails.date}
Tid: ${bookingDetails.time}
Längd: ${bookingDetails.duration} minuter
${bookingDetails.teacherName ? `Lärare: ${bookingDetails.teacherName}\n` : ''}${bookingDetails.carDetails ? `Bil: ${bookingDetails.carDetails}\n` : ''}Pris: ${bookingDetails.price} kr
Betalningsstatus: ${isPaid ? 'Betald' : 'Ej betald'}

${!isPaid ? `Notera: Din bokning är ännu inte betald. För att säkerställa din plats, vänligen slutför betalningen snarast.\n` : ''}

Om du har några frågor angående din bokning, vänligen kontakta oss på:
E-post: ${schoolDetails.contactEmail}
${schoolDetails.phone ? `Telefon: ${schoolDetails.phone}\n` : ''}

Vi ser fram emot att träffa dig!

Med vänliga hälsningar,
${schoolDetails.contactName || schoolDetails.name}

Detta är en automatiserad bokningsbekräftelse från ${schoolDetails.name}.
  `;

  return { htmlContent, textContent };
}
