-- Update the booking payment reminder template with a branded, informative design
UPDATE email_templates
SET subject = 'Påminnelse: Slutför din bokningsbetalning ({{booking.shortId}})',
    html_content = (
      '<div style="max-width:680px;margin:0 auto;background:#0b1220;color:#fff;border-radius:16px;overflow:hidden;font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;">
         <div style="background:linear-gradient(180deg,#ef4444 0%,#991b1b 100%);padding:20px 24px;">
           <h1 style="margin:0;font-size:20px;line-height:1.2;">Slutför din betalning</h1>
           <p style="margin:6px 0 0;opacity:.9;">Bokning <strong>{{booking.shortId}}</strong></p>
         </div>
         <div style="padding:20px 24px;background:#0b1220;">
           <p>Hej {{user.firstName}}!</p>
           <p>Vi saknar din betalning för din kommande bokning. Använd knappen nedan för att öppna betalningssidan.</p>
           <div style="margin:16px 0;text-align:center;">
             <a href="{{links.bookingPaymentUrl}}" style="display:inline-block;background:#ef4444;color:#fff;padding:12px 18px;border-radius:10px;text-decoration:none;font-weight:700;">Öppna betalningssida</a>
           </div>
           <div style="margin:18px 0;padding:12px 14px;border:1px solid rgba(255,255,255,.12);border-radius:12px;background:rgba(255,255,255,.04);">
             <div style="display:flex;gap:16px;flex-wrap:wrap;">
               <div style="min-width:180px;">
                 <div style="opacity:.7;font-size:12px;">Datum</div>
                 <div style="font-weight:600;">{{booking.scheduledDate}}</div>
               </div>
               <div style="min-width:180px;">
                 <div style="opacity:.7;font-size:12px;">Tid</div>
                 <div style="font-weight:600;">{{booking.startTime}}–{{booking.endTime}}</div>
               </div>
               <div style="min-width:180px;">
                 <div style="opacity:.7;font-size:12px;">Belopp</div>
                 <div style="font-weight:600;">{{booking.totalPrice}} kr</div>
               </div>
             </div>
           </div>
           <p style="opacity:.9;">Om du redan har betalat kan du bortse från detta meddelande.</p>
           <p style="opacity:.9;">Vänliga hälsningar,<br/>Din Trafikskola Hässleholm</p>
         </div>
       </div>'
    ),
    updated_at = NOW()
WHERE trigger_type = 'booking_payment_reminder';


