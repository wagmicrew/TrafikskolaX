"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import toast from 'react-hot-toast';
import { Loader2, Play, TestTube, RefreshCcw, Eye, Copy, Trash2, Database, ServerCog, Wrench, ShieldCheck, AlertTriangle } from 'lucide-react';

interface MigrationItem {
  id: string; // relPath
  dir: string;
  filename: string;
  relPath: string;
  size: number;
  mtime: number;
}

interface ListResponse { success: boolean; count: number; items: MigrationItem[] }

export default function DatabaseUpdatesClient() {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<MigrationItem[]>([]);
  const [filter, setFilter] = useState('');
  const [sort, setSort] = useState<'newest' | 'oldest' | 'alpha'>('newest');
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [running, setRunning] = useState(false);
  const [dryRun, setDryRun] = useState(true);
  const [logs, setLogs] = useState<string[]>([]);
  const [previewItem, setPreviewItem] = useState<MigrationItem | null>(null);
  const [previewText, setPreviewText] = useState<string>('');

  const selectedPaths = useMemo(() => Object.keys(selected).filter(k => selected[k]), [selected]);

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/migrate/list');
      const data: ListResponse = await res.json();
      if (!res.ok || !data.success) throw new Error(data as any);
      setItems(data.items);
      setSelected({});
    } catch (e: any) {
      toast.error('Misslyckades att läsa migreringar');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchList(); }, []);

  useEffect(() => {
    const loadPreview = async () => {
      if (!previewItem) return;
      try {
        setPreviewText('');
        const res = await fetch(`/api/admin/migrate/preview?path=${encodeURIComponent(previewItem.relPath)}`);
        const data = await res.json();
        if (res.ok && data?.success) setPreviewText(data.preview || '');
        else setPreviewText('Kunde inte läsa förhandsvisning');
      } catch {
        setPreviewText('Kunde inte läsa förhandsvisning');
      }
    };
    loadPreview();
  }, [previewItem]);

  const filtered = useMemo(() => {
    const f = filter.trim().toLowerCase();
    let arr = !f ? items : items.filter(i => (i.filename + ' ' + i.dir + ' ' + i.relPath).toLowerCase().includes(f));
    if (sort === 'alpha') arr = [...arr].sort((a,b) => a.filename.localeCompare(b.filename));
    if (sort === 'newest') arr = [...arr].sort((a,b) => b.mtime - a.mtime);
    if (sort === 'oldest') arr = [...arr].sort((a,b) => a.mtime - b.mtime);
    return arr;
  }, [items, filter, sort]);

  const allVisibleSelected = filtered.length > 0 && filtered.every(i => selected[i.relPath]);
  const someVisibleSelected = filtered.some(i => selected[i.relPath]) && !allVisibleSelected;

  const toggleSelectAllVisible = () => {
    const next = { ...selected };
    if (allVisibleSelected) {
      filtered.forEach(i => { delete next[i.relPath]; });
    } else {
      filtered.forEach(i => { next[i.relPath] = true; });
    }
    setSelected(next);
  };

  const runMigrations = async (confirmRealRun = false) => {
    if (selectedPaths.length === 0) {
      toast('Välj minst en migrering');
      return;
    }

    const doDry = dryRun && !confirmRealRun;
    if (!doDry) {
      const ok = window.confirm(`Köra ${selectedPaths.length} migration(er) mot databasen? Detta kan inte ångras.`);
      if (!ok) return;
    }

    setRunning(true);
    setLogs([]);
    const t = toast.loading(doDry ? 'Kör torrkörning...' : 'Kör migreringar...');
    try {
      const res = await fetch('/api/admin/migrate/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paths: selectedPaths, dryRun: doDry }),
      });
      const data = await res.json();
      if (!res.ok || !data) throw new Error(data?.error || 'Fel vid körning');
      const out: string[] = [];
      if (Array.isArray(data.logs)) out.push(...data.logs);
      if (Array.isArray(data.results)) {
        data.results.forEach((r: any) => {
          out.push(`${r.ok ? 'OK' : 'FEL'} - ${r.path}${r.error ? ' - ' + r.error : ''}`);
        });
      }
      setLogs(out);
      if (data.success) toast.success(doDry ? 'Torrkörning klar' : 'Migreringar klara', { id: t });
      else toast.error('Vissa migreringar misslyckades', { id: t });
    } catch (e: any) {
      toast.error(e.message || 'Okänt fel', { id: t });
    } finally {
      setRunning(false);
    }
  };

  const copyLogs = async () => {
    try {
      await navigator.clipboard.writeText(logs.join('\n'));
      toast.success('Logg kopierad till urklipp');
    } catch {
      toast.error('Kunde inte kopiera logg');
    }
  };

  const clearLogs = () => {
    setLogs([]);
    toast('Loggen rensad');
  };

  const appendLogs = (lines: string[]) => {
    const ts = new Date().toLocaleTimeString('sv-SE');
    setLogs(prev => [...prev, `# ${ts}`, ...lines]);
  };

  const callApi = async (url: string, options?: RequestInit, label?: string) => {
    const name = label || url;
    const t = toast.loading(`${name}...`);
    try {
      const res = await fetch(url, options);
      const data = await res.json().catch(() => ({}));
      const ok = res.ok && (data?.success !== false);
      const jsonPretty = JSON.stringify(data, null, 2);
      appendLogs([`${name}: ${ok ? 'OK' : 'FEL'}`, jsonPretty]);
      ok ? toast.success(`${name} klar`, { id: t }) : toast.error(`${name} fel`, { id: t });
    } catch (e: any) {
      appendLogs([`${name}: FEL`, String(e?.message || e)]);
      toast.error(`${name} fel`, { id: t });
    }
  };

  const handleDbStatus = async () => {
    await callApi('/api/admin/site-db-status', { method: 'GET' }, 'Databasstatus');
    await callApi('/api/admin/migrate/status', { method: 'GET' }, 'Migreringsstatus');
  };

  const handleSetupDb = async () => {
    await callApi('/api/admin/migrate', { method: 'POST' }, 'Setup DB (ORM)');
  };

  const handleInjectTestData = async () => {
    await callApi('/api/admin/migrate/test-data', { method: 'POST' }, 'Lägg till testdata');
  };

  const handleCleanupTestData = async () => {
    const ok = window.confirm('Ta bort testdata? Detta kan inte ångras.');
    if (!ok) return;
    await callApi('/api/admin/migrate/cleanup', { method: 'POST' }, 'Rensa testdata');
  };

  const handleFactoryReset = async () => {
    const ok = window.confirm('Fabriksåterställning: Truncerar centrala tabeller och återställer admin. Fortsätt?');
    if (!ok) return;
    await callApi('/api/admin/reset-site', { method: 'POST' }, 'Fabriksåterställning');
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column: Migrationer */}
        <div className="order-2 lg:order-1">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Migrationer ({filtered.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[48px]"></TableHead>
                      <TableHead>Fil</TableHead>
                      <TableHead>Katalog</TableHead>
                      <TableHead>Senast ändrad</TableHead>
                      <TableHead>Storlek</TableHead>
                      <TableHead>Förhandsvisning</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={6}>
                          <div className="flex items-center gap-2 text-sm text-slate-300"><Loader2 className="w-4 h-4 animate-spin"/> Laddar...</div>
                        </TableCell>
                      </TableRow>
                    ) : filtered.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-sm text-slate-400">Inga migreringar matchar filtret</TableCell>
                      </TableRow>
                    ) : (
                      filtered.map((it) => (
                        <TableRow key={it.relPath}>
                          <TableCell>
                            <Checkbox checked={!!selected[it.relPath]} onCheckedChange={(v) => setSelected(s => ({ ...s, [it.relPath]: !!v }))} />
                          </TableCell>
                          <TableCell className="font-mono text-xs">{it.filename}</TableCell>
                          <TableCell className="text-xs text-slate-300">{it.dir}</TableCell>
                          <TableCell className="text-xs">{new Date(it.mtime).toLocaleString('sv-SE')}</TableCell>
                          <TableCell className="text-xs">{(it.size/1024).toFixed(1)} kB</TableCell>
                          <TableCell>
                <Button size="sm" variant="outline" onClick={() => setPreviewItem(it)}>
                              <Eye className="w-4 h-4 mr-1" /> Visa
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column: Filter + Quick actions + Log */}
        <div className="space-y-6 order-1 lg:order-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Filter och åtgärder</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Row 1: Filter + Sort */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Sök</Label>
                  <Input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Filnamn eller sökväg..." />
                </div>
                <div className="space-y-1.5">
                  <Label>Sortera</Label>
                  <Select value={sort} onValueChange={(v: any) => setSort(v)}>
                    <SelectTrigger><SelectValue placeholder="Sortera" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Nyast först</SelectItem>
                      <SelectItem value="oldest">Äldst först</SelectItem>
                      <SelectItem value="alpha">A–Ö</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {/* Row 2: Select all + actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
                <div className="space-y-1.5">
                  <Label>Markera</Label>
                  <div className="flex items-center gap-3 p-2 rounded border border-white/10">
                    <Checkbox
                      checked={allVisibleSelected ? true : (someVisibleSelected ? 'indeterminate' as any : false)}
                      onCheckedChange={toggleSelectAllVisible}
                    />
                    <span className="text-sm text-slate-300">Välj alla synliga</span>
                  </div>
                </div>
                <div className="flex flex-wrap items-end gap-2">
                  <Button variant="outline" onClick={fetchList} disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCcw className="w-4 h-4 mr-2" />} Uppdatera
                  </Button>
                  <Button variant={dryRun ? 'secondary' : 'outline'} onClick={() => setDryRun(v => !v)}>
                    <TestTube className="w-4 h-4 mr-2" /> {dryRun ? 'Torrkörning på' : 'Torrkörning av'}
                  </Button>
                  <Button onClick={() => runMigrations(false)} disabled={running || selectedPaths.length === 0}>
                    {running ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />} Kör valda
                  </Button>
                  {dryRun && (
                    <Button
                      variant="destructive"
                      onClick={() => runMigrations(true)}
                      disabled={running || selectedPaths.length === 0}
                      title="Kör migreringar mot databasen (inte torrkörning)"
                    >
                      <Play className="w-4 h-4 mr-2" /> Kör på riktigt
                    </Button>
                  )}
                  <div className="ml-auto text-xs text-slate-300">Valda: {selectedPaths.length}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Snabbåtgärder</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button variant="secondary" onClick={handleDbStatus}>
                  <ShieldCheck className="w-4 h-4 mr-2" /> Databasstatus
                </Button>
                <Button variant="outline" onClick={handleSetupDb}>
                  <Wrench className="w-4 h-4 mr-2" /> Setup DB (ORM)
                </Button>
                <Button variant="outline" onClick={handleInjectTestData}>
                  <ServerCog className="w-4 h-4 mr-2" /> Lägg till testdata
                </Button>
                <Button variant="outline" onClick={handleCleanupTestData}>
                  <Trash2 className="w-4 h-4 mr-2" /> Rensa testdata
                </Button>
                <Button variant="destructive" onClick={handleFactoryReset}>
                  <AlertTriangle className="w-4 h-4 mr-2" /> Fabriksåterställning
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Log below Filter & actions */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle>Logg</CardTitle>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={copyLogs} disabled={!logs.length}>
                    <Copy className="w-4 h-4 mr-2" /> Kopiera
                  </Button>
                  <Button size="sm" variant="ghost" onClick={clearLogs} disabled={!logs.length}>
                    <Trash2 className="w-4 h-4 mr-2" /> Rensa
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border border-white/10 bg-black/40">
                <ScrollArea className="h-64 p-3">
                  <pre className="text-xs leading-relaxed text-slate-200 whitespace-pre-wrap">{logs.join('\n')}</pre>
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={!!previewItem} onOpenChange={(o) => { if (!o) { setPreviewItem(null); setPreviewText(''); } }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Förhandsvisning: {previewItem?.filename}</DialogTitle>
          </DialogHeader>
          <div className="rounded-md border border-white/10 bg-black/40">
            <ScrollArea className="h-[420px] p-3">
              <pre className="text-xs leading-relaxed text-slate-200 whitespace-pre-wrap">{previewText || 'Laddar...'}</pre>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
