'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'react-hot-toast';
import { Plus, Edit3, Trash2, Save, X, Loader2 } from 'lucide-react';

type Group = {
  id: string;
  name: string;
  sortOrder: number | null;
  isActive: boolean | null;
};

type Item = {
  id: string;
  groupId: string;
  title: string;
  description: string | null;
  durationMinutes: number | null;
  sortOrder: number | null;
  isActive: boolean | null;
};

export default function LessonContentClient({ initialGroups, initialItems }: { initialGroups: Group[]; initialItems: Item[]; }) {
  const [groups, setGroups] = useState<Group[]>(initialGroups);
  const [items, setItems] = useState<Item[]>(initialItems);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = useState('');
  const [addingItemForGroup, setAddingItemForGroup] = useState<string | null>(null);
  const [itemDraft, setItemDraft] = useState<Partial<Item>>({ title: '', description: '', durationMinutes: 45 });
  const [savingItemId, setSavingItemId] = useState<string | null>(null);
  const [savingNewItem, setSavingNewItem] = useState(false);
  const [savingGroupName, setSavingGroupName] = useState<string | null>(null);
  const itemsByGroup = useMemo(() => {
    const map: Record<string, Item[]> = {};
    for (const it of items) {
      if (!map[it.groupId]) map[it.groupId] = [];
      map[it.groupId].push(it);
    }
    Object.values(map).forEach(arr => arr.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)));
    return map;
  }, [items]);

  const addGroup = async () => {
    if (!newGroupName.trim()) { toast.error('Ange gruppnamn'); return; }
    setCreatingGroup(true);
    try {
      const res = await fetch('/api/admin/lesson-content/groups', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newGroupName.trim() }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Kunde inte skapa grupp');
      setGroups(prev => [...prev, data.group]);
      setNewGroupName('');
      toast.success('Grupp skapad');
    } catch (e: any) {
      toast.error(e.message || 'Fel vid skapande');
    } finally {
      setCreatingGroup(false);
    }
  };

  const saveGroupName = async (groupId: string) => {
    if (!editingGroupName.trim()) { toast.error('Ange gruppnamn'); return; }
    try {
      setSavingGroupName(groupId);
      const res = await fetch(`/api/admin/lesson-content/groups/${groupId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: editingGroupName.trim() }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Kunde inte uppdatera grupp');
      setGroups(prev => prev.map(g => g.id === groupId ? { ...g, name: editingGroupName.trim() } : g));
      setEditingGroupId(null);
      setEditingGroupName('');
      toast.success('Grupp uppdaterad');
    } catch (e: any) {
      toast.error(e.message || 'Fel vid uppdatering');
    } finally {
      setSavingGroupName(null);
    }
  };

  const deleteGroup = async (groupId: string) => {
    if (!confirm('Vill du verkligen radera gruppen och dess innehåll?')) return;
    try {
      const res = await fetch(`/api/admin/lesson-content/groups/${groupId}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Kunde inte radera grupp');
      setGroups(prev => prev.filter(g => g.id !== groupId));
      setItems(prev => prev.filter(i => i.groupId !== groupId));
      toast.success('Grupp raderad');
    } catch (e: any) {
      toast.error(e.message || 'Fel vid radering');
    }
  };

  const addItem = async (groupId: string) => {
    if (!itemDraft.title?.trim()) { toast.error('Ange titel'); return; }
    try {
      setSavingNewItem(true);
      const res = await fetch(`/api/admin/lesson-content/groups/${groupId}/items`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: itemDraft.title, description: itemDraft.description, durationMinutes: itemDraft.durationMinutes }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Kunde inte skapa punkt');
      setItems(prev => [...prev, data.item]);
      setAddingItemForGroup(null);
      setItemDraft({ title: '', description: '', durationMinutes: 45 });
      toast.success('Punkt tillagd');
    } catch (e: any) {
      toast.error(e.message || 'Fel vid skapande');
    } finally {
      setSavingNewItem(false);
    }
  };

  const updateItem = async (item: Item) => {
    try {
      setSavingItemId(item.id);
      const res = await fetch(`/api/admin/lesson-content/items/${item.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: item.title, description: item.description, durationMinutes: item.durationMinutes }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Kunde inte uppdatera punkt');
      toast.success('Punkt uppdaterad');
    } catch (e: any) {
      toast.error(e.message || 'Fel vid uppdatering');
    } finally {
      setSavingItemId(null);
    }
  };

  const deleteItem = async (itemId: string) => {
    if (!confirm('Vill du verkligen radera denna punkt?')) return;
    try {
      const res = await fetch(`/api/admin/lesson-content/items/${itemId}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Kunde inte radera punkt');
      setItems(prev => prev.filter(i => i.id !== itemId));
      toast.success('Punkt raderad');
    } catch (e: any) {
      toast.error(e.message || 'Fel vid radering');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-white">Lektionsinnehåll</h1>
        <div className="flex items-center gap-2">
          <Input placeholder="Ny grupp..." value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} className="w-64 bg-white/10 border-white/20 text-white placeholder:text-white/50" />
          <Button onClick={addGroup} disabled={creatingGroup} className="bg-sky-500 hover:bg-sky-600 text-white"><Plus className="w-4 h-4 mr-1" /> Lägg till grupp</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {groups.sort((a,b) => (a.sortOrder||0)-(b.sortOrder||0)).map((group) => (
          <Card key={group.id} className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
              {editingGroupId === group.id ? (
                <div className="flex-1 flex items-center gap-2">
                  <Input value={editingGroupName} onChange={(e)=>setEditingGroupName(e.target.value)} className="bg-white/10 border-white/20 text-white" />
                  <Button size="sm" onClick={() => saveGroupName(group.id)} disabled={savingGroupName===group.id} className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50">
                    {savingGroupName===group.id ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4" />}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { setEditingGroupId(null); setEditingGroupName(''); }} className="border-white/20 text-white"><X className="w-4 h-4" /></Button>
                </div>
              ) : (
                <CardTitle className="flex items-center gap-2 text-white font-extrabold"><span>{group.name}</span></CardTitle>
              )}
              <div className="flex items-center gap-2">
                {editingGroupId !== group.id && (
                  <Button size="sm" variant="outline" onClick={() => { setEditingGroupId(group.id); setEditingGroupName(group.name); }} className="border-white/20 text-white"><Edit3 className="w-4 h-4" /></Button>
                )}
                <Button size="sm" variant="destructive" onClick={() => deleteGroup(group.id)} className="bg-rose-600 hover:bg-rose-500"><Trash2 className="w-4 h-4" /></Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(itemsByGroup[group.id] || []).map((it) => (
                  <div key={it.id} className="rounded-xl p-3 bg-white/5 border border-white/10">
                    <div className="flex items-center gap-2">
                      <Input value={it.title || ''} onChange={(e) => setItems(prev => prev.map(p => p.id === it.id ? { ...p, title: e.target.value } : p))} className="flex-1 bg-white/10 border-white/20 text-white" />
                      <Input type="number" value={it.durationMinutes || 0} onChange={(e) => setItems(prev => prev.map(p => p.id === it.id ? { ...p, durationMinutes: Number(e.target.value) } : p))} className="w-24 bg-white/10 border-white/20 text-white" />
                      <Button size="sm" onClick={() => updateItem(it)} disabled={savingItemId===it.id} className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50">
                        {savingItemId===it.id ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4" />}
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => deleteItem(it.id)} className="bg-rose-600 hover:bg-rose-500"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                    <Textarea value={it.description || ''} onChange={(e) => setItems(prev => prev.map(p => p.id === it.id ? { ...p, description: e.target.value } : p))} placeholder="Beskrivning..." className="mt-2 bg-white/10 border-white/20 text-white placeholder:text-slate-300" />
                  </div>
                ))}
                {addingItemForGroup === group.id ? (
                  <div className="rounded-xl p-3 bg-white/5 border border-white/10">
                    <div className="flex items-center gap-2">
                      <Input value={itemDraft.title || ''} onChange={(e) => setItemDraft(prev => ({ ...prev, title: e.target.value }))} placeholder="Titel..." className="flex-1 bg-white/10 border-white/20 text-white" />
                      <Input type="number" value={itemDraft.durationMinutes || 45} onChange={(e) => setItemDraft(prev => ({ ...prev, durationMinutes: Number(e.target.value) }))} className="w-24 bg-white/10 border-white/20 text-white" />
                      <Button size="sm" onClick={() => addItem(group.id)} disabled={savingNewItem} className="bg-sky-600 hover:bg-sky-500 disabled:opacity-50">
                        {savingNewItem ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4" />}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => { setAddingItemForGroup(null); setItemDraft({ title: '', description: '', durationMinutes: 45 }); }} className="border-white/20 text-white"><X className="w-4 h-4" /></Button>
                    </div>
                    <Textarea value={itemDraft.description || ''} onChange={(e) => setItemDraft(prev => ({ ...prev, description: e.target.value }))} placeholder="Beskrivning..." className="mt-2 bg-white/10 border-white/20 text-white placeholder:text-slate-300" />
                  </div>
                ) : (
                  <Button variant="outline" onClick={() => setAddingItemForGroup(group.id)} className="border-white/20 text-white"><Plus className="w-4 h-4 mr-1" /> Lägg till punkt</Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}


