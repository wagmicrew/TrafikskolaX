"use client";
import React, { useMemo, useState } from 'react';
import SwishQR from '@/components/SwishQR';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Printer, CreditCard, MapPin, Calendar as CalendarIcon, Clock, CheckCircle2, MailCheck, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

type Booking = {
  id: string;
  price: string | number;
  paymentStatus?: string | null;
  paymentMethod?: string | null;
  supervisorName?: string | null;
  supervisorEmail?: string | null;
  supervisorPhone?: string | null;
};

type Session = {
  id: string;
  title: string;
  description?: string | null;
  date: string;
  startTime: string;
  endTime: string;
  pricePerParticipant: string | number;
};

export default function PaymentLandingClient({
  booking,
  session,
  settings,
  isPaid,
}: {
  booking: Booking;
  session: Session;
  settings: { schoolName: string; schoolPhone?: string; swishNumber?: string; schoolAddress?: string; mapsEmbedUrl?: string };
  isPaid: boolean;
}) {
  const [isGeneratingQliro, setIsGeneratingQliro] = useState(false);
  const [isNotifying, setIsNotifying] = useState(false);
  const [notified, setNotified] = useState(false);

  const amount = useMemo(() => Number(booking.price || session.pricePerParticipant || 0), [booking.price, session.pricePerParticipant]);
  const sessionDate = useMemo(() => format(new Date(session.date), 'EEEE d MMMM yyyy', { locale: sv }), [session.date]);

  const payWithQliro = async () => {
    try {
      setIsGeneratingQliro(true);
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const res = await fetch('/api/payments/qliro/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          reference: `handledar_${booking.id}`,
          description: `Handledarutbildning ${sessionDate}`,
          returnUrl: `${baseUrl}/handledar/payment/${booking.id}`,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.checkoutUrl) {
        throw new Error(data?.error || 'Kunde inte skapa Qliro-checkout');
      }
      window.location.href = data.checkoutUrl;
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setIsGeneratingQliro(false);
    }
  };
  const notifyPaid = async () => {
    try {
      setIsNotifying(true);
      const res = await fetch('/api/handledar/payments/notify-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: booking.id })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Kunde inte skicka betalningsbekräftelse');
      }
      toast.success('Tack! Skolan har meddelats.');
      setNotified(true);
    } catch (e: any) {
      toast.error(e.message || 'Ett fel inträffade');
    } finally {
      setIsNotifying(false);
    }
  };

  return (
    <div className="min-h-[100vh] bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <style>{`@media print {
        body { background: white !important; }
        .print\:hidden { display: none !important; }
        .print\:text-black { color: #000 !important; }
        .print\:bg-white { background: #fff !important; }
        .print\:border-black\/20 { border-color: rgba(0,0,0,0.2) !important; }
        .print\:shadow-none { box-shadow: none !important; }
        .print\:p-0 { padding: 0 !important; }
        .print\:m-0 { margin: 0 !important; }
        .print\:leading-tight { line-height: 1.2 !important; }
      }`}</style>
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold print:text-black">{settings.schoolName}</h1>
          <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-2 hover:bg-white/15 print:hidden">
            <Printer className="h-4 w-4" />
            Skriv ut
          </button>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-xl backdrop-blur print:bg-white print:border-black/20 print:shadow-none">
          <div className="mb-4 flex flex-col gap-1">
            <div className="text-lg font-semibold print:text-black">{session.title}</div>
            <div className="flex flex-wrap items-center gap-4 text-white/80 print:text-black">
              <div className="inline-flex items-center gap-2"><CalendarIcon className="h-4 w-4" />{sessionDate}</div>
              <div className="inline-flex items-center gap-2"><Clock className="h-4 w-4" />{session.startTime.slice(0,5)}–{session.endTime.slice(0,5)}</div>
            </div>
          </div>

          {settings.schoolAddress && (
            <div className="mb-4 flex items-center gap-2 text-white/80 print:text-black">
              <MapPin className="h-4 w-4" />
              <span>{settings.schoolAddress}</span>
            </div>
          )}

          {settings.mapsEmbedUrl && (
            <div className="mb-6 overflow-hidden rounded-xl border border-white/10 print:hidden">
              <iframe src={settings.mapsEmbedUrl} className="h-52 w-full" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
            </div>
          )}

          {!isPaid ? (
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="mb-2 text-sm font-semibold text-white/80">Betala med Swish</div>
                <div className="text-sm text-white/70">Belopp: <span className="font-semibold text-white">{amount} kr</span></div>
                {settings.swishNumber ? (
                  <div className="mt-3 flex items-center justify-center">
                    <SwishQR phoneNumber={settings.swishNumber} amount={amount.toString()} message={`Handledar ${booking.id.slice(0,8)}`} size={240} />
                  </div>
                ) : (
                  <div className="mt-3 text-sm text-amber-300">Swish-nummer saknas i inställningar.</div>
                )}
                <div className="mt-4 flex justify-center">
                  {notified ? (
                    <div className="text-sm text-white/80">Väntar på skolans bekräftelse</div>
                  ) : (
                    <button onClick={notifyPaid} disabled={isNotifying} className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 border border-white/20 hover:bg-white/20 disabled:opacity-50">
                      {isNotifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <MailCheck className="h-4 w-4" />} {isNotifying ? 'Skickar...' : 'Jag har betalat'}
                    </button>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="mb-2 text-sm font-semibold text-white/80">Betala med Qliro</div>
                <p className="text-sm text-white/70">Betala med faktura eller delbetalning via Qliro.</p>
                <button onClick={payWithQliro} disabled={isGeneratingQliro} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 font-semibold hover:bg-emerald-500 disabled:opacity-50">
                  <CreditCard className="h-4 w-4" />
                  {isGeneratingQliro ? 'Öppnar Qliro…' : 'Öppna Qliro'}
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-green-200">
              <div className="inline-flex items-center gap-2 font-semibold"><CheckCircle2 className="h-5 w-5" />Betalning mottagen</div>
              <div className="mt-1 text-sm">Din plats är bekräftad. Vi ses på kursen!</div>
            </div>
          )}

          <div className="mt-4 text-sm text-white/70">Booking {booking.id.slice(0,7)}</div>

          {session.description && (
            <div className="prose prose-invert mt-6 max-w-none text-white/80">
              <div dangerouslySetInnerHTML={{ __html: session.description }} />
            </div>
          )}

          <div className="mt-6 text-sm text-white/70">
            {settings.schoolPhone && <div>Frågor? Ring {settings.schoolPhone}.</div>}
            {booking.supervisorEmail && <div>Bekräftelse skickad till {booking.supervisorEmail}.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}


