"use client";
import React, { useEffect, useState } from 'react';
import { Loader2, CheckCircle2, Mail, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

type SwishPaymentItem = {
  id: string;
  type: 'handledar' | 'booking' | 'order';
  name: string;
  email?: string;
  phone?: string;
  amount: number;
  status: 'unpaid' | 'pending' | 'paid' | 'failed';
  createdAt: string;
};

export default function SwishPaymentsPage() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<SwishPaymentItem[]>([]);
  const [reminding, setReminding] = useState(false);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/payments/swish/list');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Kunde inte hämta Swish-betalningar');
      setItems(data.items || []);
    } catch (e: any) {
      toast.error(e.message || 'Fel vid hämtning');
    } finally {
      setLoading(false);
    }
  };

  const confirmPaid = async (id: string, type: string) => {
    const t = toast.loading('Bekräftar betalning...');
    try {
      const res = await fetch('/api/admin/payments/swish/confirm', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, type }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Misslyckades att bekräfta');
      toast.success('Markerad som betald', { id: t });
      fetchItems();
    } catch (e: any) {
      toast.error(e.message || 'Fel', { id: t });
    }
  };

  const remind = async (id?: string, type?: string) => {
    const t = toast.loading(id ? 'Skickar påminnelse...' : 'Skickar påminnelse till alla...');
    try {
      setReminding(true);
      const res = await fetch('/api/admin/payments/swish/remind', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, type }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Misslyckades att påminna');
      toast.success('Påminnelse skickad', { id: t });
    } catch (e: any) {
      toast.error(e.message || 'Fel', { id: t });
    } finally {
      setReminding(false);
    }
  };

  const decline = async (id: string, type: string) => {
    if (!confirm('Är du säker? Detta kan avboka/arkivera posten.')) return;
    const t = toast.loading('Nekar betalning...');
    try {
      const res = await fetch('/api/admin/payments/swish/decline', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, type }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Misslyckades att neka');
      toast.success('Markerad som nekad', { id: t });
      fetchItems();
    } catch (e: any) {
      toast.error(e.message || 'Fel', { id: t });
    }
  };

  return (
    <div className="mx-auto px-4 py-8 max-w-7xl text-white">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Swish-betalningar</h1>
          <p className="text-slate-300 mt-1">Hantera obetalda och väntande betalningar</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => remind()} disabled={reminding} className="border-white/20 text-white">Påminn alla obetalda</Button>
          <Button onClick={fetchItems} className="bg-white/10 hover:bg-white/20 border border-white/20">Uppdatera</Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[320px]"><Loader2 className="w-6 h-6 animate-spin" /></div>
      ) : (
        <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl">
          <div className="grid grid-cols-12 text-xs uppercase tracking-wide text-slate-300 border-b border-white/10 px-4 py-2">
            <div className="col-span-3">Namn</div>
            <div className="col-span-2">Typ</div>
            <div className="col-span-2">Belopp</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-3 text-right">Åtgärder</div>
          </div>
          {items.length === 0 ? (
            <div className="px-4 py-8 text-center text-slate-300">Inga obetalda/väntande</div>
          ) : items.map(item => (
            <div key={`${item.type}-${item.id}`} className="grid grid-cols-12 items-center px-4 py-3 border-b border-white/10">
              <div className="col-span-3">
                <div className="font-semibold">{item.name}</div>
                <div className="text-xs text-slate-300">{item.email || item.phone || '-'}</div>
              </div>
              <div className="col-span-2">{item.type}</div>
              <div className="col-span-2">{item.amount} kr</div>
              <div className="col-span-2">
                {item.status === 'paid' ? (
                  <span className="inline-flex items-center gap-1 text-emerald-300"><CheckCircle2 className="w-4 h-4"/> Betald</span>
                ) : item.status === 'failed' ? (
                  <span className="inline-flex items-center gap-1 text-rose-300"><AlertTriangle className="w-4 h-4"/> Misslyckad</span>
                ) : (
                  <span className="text-amber-300">{item.status}</span>
                )}
              </div>
              <div className="col-span-3 flex justify-end gap-2">
                <Button size="sm" onClick={() => confirmPaid(item.id, item.type)} className="bg-emerald-600 hover:bg-emerald-500">Bekräfta</Button>
                <Button size="sm" variant="outline" onClick={() => remind(item.id, item.type)} className="border-white/20 text-white"><Mail className="w-4 h-4 mr-1"/> Påminn</Button>
                <Button size="sm" variant="destructive" onClick={() => decline(item.id, item.type)}>Neka</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


