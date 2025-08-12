"use client";
import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ModerateClient() {
  const params = useSearchParams();
  const token = params.get('token') || '';
  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState<any>(null);
  const [suggested, setSuggested] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!token) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/swish/email-action?token=${encodeURIComponent(token)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Ogiltig länk');
        setItem(data.item);
        setSuggested(data.suggestedDecision || null);
      } catch (e: any) {
        toast.error(e.message || 'Fel');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  const act = async (decision: 'confirm' | 'deny' | 'remind') => {
    const t = toast.loading('Skickar...');
    try {
      const res = await fetch('/api/admin/swish/email-action', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, decision }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Misslyckades');
      toast.success('Klart', { id: t });
    } catch (e: any) {
      toast.error(e.message || 'Fel', { id: t });
    }
  };

  if (!token) {
    return <div className="min-h-screen flex items-center justify-center text-white">Saknar token</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <div className="mx-auto max-w-xl px-4 py-10">
        <h1 className="text-2xl font-extrabold mb-4">Swish-betalning</h1>
        {loading ? (
          <div className="flex items-center justify-center min-h-[200px]">Laddar...</div>
        ) : !item ? (
          <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 p-4">Kunde inte läsa betalningen.</div>
        ) : (
          <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-5 space-y-4">
            <div>
              <div className="text-sm text-slate-300">Typ</div>
              <div className="font-semibold">{item.type}</div>
            </div>
            <div>
              <div className="text-sm text-slate-300">Namn</div>
              <div className="font-semibold">{item.name || '-'}</div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-slate-300">E-post</div>
                <div className="font-semibold">{item.email || '-'}</div>
              </div>
              <div>
                <div className="text-sm text-slate-300">Telefon</div>
                <div className="font-semibold">{item.phone || '-'}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-slate-300">Belopp</div>
                <div className="font-semibold">{item.amount} kr</div>
              </div>
              <div>
                <div className="text-sm text-slate-300">Status</div>
                <div className="font-semibold">{item.status}</div>
              </div>
            </div>

            <div className="pt-2 border-t border-white/10 flex flex-wrap gap-2">
              <Button onClick={() => act('confirm')} className="bg-emerald-600 hover:bg-emerald-500"><CheckCircle2 className="w-4 h-4 mr-1"/> Bekräfta</Button>
              <Button variant="outline" onClick={() => act('remind')} className="border-white/20 text-white"><Mail className="w-4 h-4 mr-1"/> Påminn</Button>
              <Button variant="destructive" onClick={() => act('deny')}><XCircle className="w-4 h-4 mr-1"/> Neka</Button>
            </div>

            {suggested && (
              <div className="text-xs text-slate-300">Föreslagen åtgärd: {suggested}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


