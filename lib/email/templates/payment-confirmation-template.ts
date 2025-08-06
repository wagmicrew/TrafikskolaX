interface PaymentConfirmationTemplateProps {
  recipientName: string;
  paymentDetails: {
    amount: string;
    date: string;
    method: string;
    reference?: string;
    orderId?: string;
  };
  purchaseDetails: {
    type: 'booking' | 'package' | 'handledar'; // Type of purchase
    itemName: string;  // Name of lesson, package, or handledar session
    itemDescription?: string;
    date?: string; // For bookings
    time?: string; // For bookings
  };
  schoolDetails: {
    name: string;
    contactEmail: string;
    contactName?: string;
    phone?: string;
  };
}

export function createPaymentConfirmationTemplate({
  recipientName,
  paymentDetails,
  purchaseDetails,
  schoolDetails
}: PaymentConfirmationTemplateProps) {
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Betalningsbekräftelse - ${schoolDetails.name}</title>
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
          border-left: 4px solid #28a745;
        }
        .payment-info {
          background-color: #e9f7ef;
          border-radius: 4px;
          padding: 15px;
          margin-bottom: 20px;
        }
        .footer {
          margin-top: 20px;
          font-size: 12px;
          text-align: center;
          color: #666;
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
        .receipt-id {
          font-size: 12px;
          color: #666;
          margin-top: 5px;
        }
        .success-checkmark {
          color: #28a745;
          font-size: 24px;
          margin-right: 10px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Betalningsbekräftelse</h1>
      </div>
      <div class="content">
        <div class="payment-info">
          <h2><span class="success-checkmark">✓</span> Betalning mottagen</h2>
          <p>Vi har tagit emot din betalning på <strong>${paymentDetails.amount} kr</strong>.</p>
          ${paymentDetails.orderId ? `<p class="receipt-id">Order-ID: ${paymentDetails.orderId}</p>` : ''}
        </div>
        
        <p>Hej ${recipientName},</p>
        
        <p>Tack för din betalning till ${schoolDetails.name}. Nedan hittar du detaljer om din betalning och köp.</p>
        
        <div class="details">
          <h2>Betalningsdetaljer</h2>
          <table>
            <tr>
              <td>Belopp:</td>
              <td>${paymentDetails.amount} kr</td>
            </tr>
            <tr>
              <td>Betaldatum:</td>
              <td>${paymentDetails.date}</td>
            </tr>
            <tr>
              <td>Betalmetod:</td>
              <td>${paymentDetails.method}</td>
            </tr>
            ${paymentDetails.reference ? `
            <tr>
              <td>Referens:</td>
              <td>${paymentDetails.reference}</td>
            </tr>
            ` : ''}
          </table>
        </div>
        
        <div class="details">
          <h2>${purchaseDetails.type === 'booking' ? 'Bokningsdetaljer' : 
                purchaseDetails.type === 'package' ? 'Paketdetaljer' : 
                'Handledarutbildningsdetaljer'}</h2>
          <table>
            <tr>
              <td>Namn:</td>
              <td>${purchaseDetails.itemName}</td>
            </tr>
            ${purchaseDetails.itemDescription ? `
            <tr>
              <td>Beskrivning:</td>
              <td>${purchaseDetails.itemDescription}</td>
            </tr>
            ` : ''}
            ${purchaseDetails.date ? `
            <tr>
              <td>Datum:</td>
              <td>${purchaseDetails.date}</td>
            </tr>
            ` : ''}
            ${purchaseDetails.time ? `
            <tr>
              <td>Tid:</td>
              <td>${purchaseDetails.time}</td>
            </tr>
            ` : ''}
          </table>
        </div>

        <p>
          Om du har några frågor angående din betalning, vänligen kontakta oss på:
          <br />
          E-post: ${schoolDetails.contactEmail}
          ${schoolDetails.phone ? `<br />Telefon: ${schoolDetails.phone}` : ''}
        </p>
        
        <p>Tack för att du valde ${schoolDetails.name}!</p>
        
        <p>Med vänliga hälsningar,<br>
        ${schoolDetails.contactName || schoolDetails.name}</p>
      </div>
      <div class="footer">
        <p>Detta är ett automatiskt genererat kvitto från ${schoolDetails.name}.</p>
        <p>Spara detta mail som bevis på din betalning.</p>
      </div>
    </body>
    </html>
  `;

  const textContent = `
Betalningsbekräftelse - ${schoolDetails.name}

BETALNING MOTTAGEN
Vi har tagit emot din betalning på ${paymentDetails.amount} kr.
${paymentDetails.orderId ? `Order-ID: ${paymentDetails.orderId}` : ''}

Hej ${recipientName},

Tack för din betalning till ${schoolDetails.name}. Nedan hittar du detaljer om din betalning och köp.

BETALNINGSDETALJER
-----------------
Belopp: ${paymentDetails.amount} kr
Betaldatum: ${paymentDetails.date}
Betalmetod: ${paymentDetails.method}
${paymentDetails.reference ? `Referens: ${paymentDetails.reference}\n` : ''}

${purchaseDetails.type === 'booking' ? 'BOKNINGSDETALJER' : 
  purchaseDetails.type === 'package' ? 'PAKETDETALJER' : 
  'HANDLEDARUTBILDNINGSDETALJER'}
-----------------
Namn: ${purchaseDetails.itemName}
${purchaseDetails.itemDescription ? `Beskrivning: ${purchaseDetails.itemDescription}\n` : ''}${purchaseDetails.date ? `Datum: ${purchaseDetails.date}\n` : ''}${purchaseDetails.time ? `Tid: ${purchaseDetails.time}\n` : ''}

Om du har några frågor angående din betalning, vänligen kontakta oss på:
E-post: ${schoolDetails.contactEmail}
${schoolDetails.phone ? `Telefon: ${schoolDetails.phone}\n` : ''}

Tack för att du valde ${schoolDetails.name}!

Med vänliga hälsningar,
${schoolDetails.contactName || schoolDetails.name}

Detta är ett automatiskt genererat kvitto från ${schoolDetails.name}.
Spara detta mail som bevis på din betalning.
  `;

  return { htmlContent, textContent };
}
