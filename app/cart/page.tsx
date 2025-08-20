import React from 'react';
import { notFound } from 'next/navigation';

// This page is a generic Qliro cart entry. It expects a query like ?type=booking|handledar|package&id=UUID
// It renders a small redirector or embed loader depending on type.

export const dynamic = 'force-dynamic';

export default async function CartPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[]>> }) {
  const resolvedSearchParams = await searchParams;
  const params = resolvedSearchParams || {};
  const type = (Array.isArray(params.type) ? params.type[0] : params.type) || '';
  const id = (Array.isArray(params.id) ? params.id[0] : params.id) || '';

  if (!type || !id) {
    return (
      <main className="mx-auto max-w-xl px-4 py-10 text-slate-100">
        <h1 className="text-2xl font-bold mb-2">Kundvagn</h1>
        <p className="text-slate-300">Felaktig länk. Saknar parametrar <code>type</code> och/eller <code>id</code>.</p>
      </main>
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';

  let paymentUrl = '';
  if (type === 'booking') paymentUrl = `${appUrl}/booking/payment/${id}`;
  else if (type === 'handledar') paymentUrl = `${appUrl}/handledar/payment/${id}`;
  else if (type === 'package') paymentUrl = `${appUrl}/packages-store?openPayment=${id}`;
  else notFound();

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold text-white mb-4">Kundvagn</h1>
      <div className="rounded-xl overflow-hidden border border-white/10">
        <iframe
          src={paymentUrl}
          className="w-full h-[80vh] bg-white"
          title="Betalningssida"
        />
      </div>
      <p className="mt-3 text-sm text-slate-400">Om du inte ser betalningen, <a className="text-sky-400 underline" href={paymentUrl}>öppna i ny flik</a>.</p>
    </main>
  );
}


