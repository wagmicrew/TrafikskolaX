"use client";
import React, { useMemo, useState } from 'react';
import SwishQR from '@/components/SwishQR';
import { Printer, CreditCard, CheckCircle2, MailCheck, Calendar as CalendarIcon, Clock, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import QliroPopup from '@/components/payments/QliroPopup';

export default function BookingPaymentClient({ booking, settings }: { booking: any; settings: { swishNumber: string; schoolName: string; schoolPhone?: string } }) {
  const [isGeneratingQliro, setIsGeneratingQliro] = useState(false);
  const [isNotifying, setIsNotifying] = useState(false);
  const [notified, setNotified] = useState(false);
  const [qliroUrl, setQliroUrl] = useState<string | null>(null);
  const [showQliro, setShowQliro] = useState(false);
  const amount = useMemo(() => Number(booking.totalPrice || 0), [booking.totalPrice]);
  const isPaid = String(booking.paymentStatus || '').toLowerCase() === 'paid';

  const payWithQliro = async () => {
    try {
      setIsGeneratingQliro(true);
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const res = await fetch('/api/payments/qliro/create-order', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: booking.id })
      });
      const data = await res.json();
      if (!res.ok || !data?.checkoutUrl) throw new Error(data?.error || 'Kunde inte skapa Qliro-checkout');
      setQliroUrl(data.checkoutUrl);
      setShowQliro(true);
    } catch (e: any) { toast.error(e.message || 'Fel'); } finally { setIsGeneratingQliro(false); }
  };

  const notifyPaid = async () => {
    try {
      setIsNotifying(true);
      const res = await fetch('/api/booking/confirm', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bookingId: booking.id, sessionType: 'regular', paymentMethod: 'swish' }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Kunde inte meddela skolan');
      toast.success('Tack! Skolan har meddelats.');
      setNotified(true);
    } catch (e: any) { toast.error(e.message || 'Fel'); }
    finally { setIsNotifying(false); }
  };

  return (
    <div className="min-h-[100vh] bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">{settings.schoolName}</h1>
          <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-2 hover:bg-white/15 print:hidden">
            <Printer className="h-4 w-4" /> Skriv ut
          </button>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-xl backdrop-blur">
          <div className="mb-4 flex flex-wrap items-center gap-4 text-white/80">
            <div className="inline-flex items-center gap-2"><CalendarIcon className="h-4 w-4" />{String(booking.scheduledDate || '').slice(0,10)}</div>
            <div className="inline-flex items-center gap-2"><Clock className="h-4 w-4" />{String(booking.startTime||'').slice(0,5)}–{String(booking.endTime||'').slice(0,5)}</div>
          </div>
          {!isPaid ? (
            <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="mb-2 text-sm font-semibold text-white/80">Betala med Swish</div>
                <div className="text-sm text-white/70">Belopp: <span className="font-semibold text-white">{amount} kr</span></div>
                {settings.swishNumber ? (
                  <div className="mt-3 flex items-center justify-center">
                    <SwishQR phoneNumber={settings.swishNumber} amount={amount.toString()} message={`Bokning ${booking.id.slice(0,8)}`} size={240} />
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
                <button onClick={payWithQliro} disabled={isGeneratingQliro} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 font-semibold hover:bg-emerald-500 disabled:opacity-50"><CreditCard className="h-4 w-4" />{isGeneratingQliro ? 'Öppnar Qliro…' : 'Öppna Qliro'}</button>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-green-200">
              <div className="inline-flex items-center gap-2 font-semibold"><CheckCircle2 className="h-5 w-5" />Betalning mottagen</div>
              <div className="mt-1 text-sm">Tack för betalningen!</div>
            </div>
          )}
        </div>
      </div>
      <QliroPopup url={qliroUrl} open={showQliro} onClose={() => setShowQliro(false)} />
    </div>
  );
}


