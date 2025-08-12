"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Clock, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  AlertTriangle, 
  Calendar,
  Ban,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Settings,
  Shield,
  Users,
  FileText,
  CalendarDays,
  Move,
  GripVertical
} from "lucide-react";
import WeeklyCalendar from '@/components/WeeklyCalendar';
import BlockedSlotsCalendar from '@/components/BlockedSlotsCalendar';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SlotSetting {
  id: string;
  dayOfWeek: number;
  timeStart: string;
  timeEnd: string;
  adminMinutes: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface BlockedSlot {
  id: string;
  date: string;
  timeStart: string | null;
  timeEnd: string | null;
  isAllDay: boolean;
  reason: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ExtraSlot {
  id: string;
  date: string;
  timeStart: string;
  timeEnd: string;
  reason: string | null;
  reservedForUserId?: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

const DAYS_OF_WEEK = [
  'Söndag', 'Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag'
];

export default function SlotsClient() {
  const [slots, setSlots] = useState<SlotSetting[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
  const [extraSlots, setExtraSlots] = useState<ExtraSlot[]>([]);
  const [activeTab, setActiveTab] = useState<'slots' | 'blocked' | 'extra'>('slots');
  const [editingSlot, setEditingSlot] = useState<SlotSetting | null>(null);
  const [editingBlocked, setEditingBlocked] = useState<BlockedSlot | null>(null);
  const [editingExtra, setEditingExtra] = useState<ExtraSlot | null>(null);
  const [showAddSlot, setShowAddSlot] = useState(false);
  const [showAddBlocked, setShowAddBlocked] = useState(false);
  const [showAddExtra, setShowAddExtra] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showCalendar, setShowCalendar] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  // Form states
  const [slotForm, setSlotForm] = useState({
    dayOfWeek: 1,
    timeStart: '09:00',
    timeEnd: '10:00',
    adminMinutes: 15,
    isActive: true,
  });

  const [blockedForm, setBlockedForm] = useState({
    date: '',
    timeStart: '09:00',
    timeEnd: '10:00',
    isAllDay: false,
    reason: '',
  });

  const [extraForm, setExtraForm] = useState({
    date: '',
    timeStart: '09:00',
    timeEnd: '10:00',
    reason: '',
    reservedForUserId: '' as string | null,
  });

  // Users for reserving extra slots
  const [usersForSelect, setUsersForSelect] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    fetchSlots();
    fetchBlockedSlots();
    fetchExtraSlots();
    fetchUsersForExtra();
  }, []);

  // Ensure calendar is default on entry
  useEffect(() => {
    setShowCalendar(true);
  }, []);

  const handleResetMonFri = async () => {
    const confirmed = confirm('Detta rensar ALLA tidsluckor, extra/blockerade tider samt ALLA bokningar. Fortsätt?');
    if (!confirmed) return;
    setIsUpdating(true);
    try {
      const res = await fetch('/api/admin/slots/reset', { method: 'POST' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({} as any));
        toast({ title: 'Fel', description: err.error || 'Misslyckades att återställa schema', variant: 'destructive' });
        return;
      }
      toast({ title: 'Klart', description: 'Standardtider (Mån–Fre) återställda', variant: 'default' });
      await Promise.all([fetchSlots(), fetchBlockedSlots(), fetchExtraSlots()]);
      setShowCalendar(true);
    } catch (e) {
      console.error(e);
      toast({ title: 'Fel', description: 'Misslyckades att återställa schema', variant: 'destructive' });
    } finally {
      setIsUpdating(false);
    }
  };

  const fetchSlots = async () => {
    try {
      const response = await fetch('/api/admin/slots');
      if (response.ok) {
        const data = await response.json();
        setSlots(data.slots || []);
      }
    } catch (error) {
      console.error('Error fetching slots:', error);
    }
  };

  const fetchBlockedSlots = async () => {
    try {
      const response = await fetch('/api/admin/blocked-slots');
      if (response.ok) {
        const data = await response.json();
        setBlockedSlots(data.blockedSlots || []);
      }
    } catch (error) {
      console.error('Error fetching blocked slots:', error);
    }
  };

  const fetchExtraSlots = async () => {
    try {
      const response = await fetch('/api/admin/extra-slots');
      if (response.ok) {
        const data = await response.json();
        setExtraSlots(data.extraSlots || []);
      }
    } catch (error) {
      console.error('Error fetching extra slots:', error);
    }
  };

  const fetchUsersForExtra = async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const all = await response.json();
        const filtered = (all || []).filter((u: any) => {
          const email: string = (u.email || '').toLowerCase();
          const isTempEmail = /^orderid-.*@dintrafikskolahlm\.se$/.test(email) || /^temp-.*@/.test(email);
          const isTempName = (u.firstName || '') === 'Temporary';
          const isStudent = String(u.role || '').toLowerCase() === 'student';
          return isStudent && !isTempEmail && !isTempName;
        });
        const mapped = filtered
          .map((u: any) => ({
            id: u.id,
            name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
          }))
          .sort((a: any, b: any) => a.name.localeCompare(b.name));
        setUsersForSelect(mapped);
      }
    } catch (error) {
      console.error('Error fetching users for extra slots:', error);
    }
  };

  const handleCreateSlot = async (confirmed = false) => {
    if (!confirmed) {
      setWarning('Är du säker på att du vill skapa denna tidslucka?');
      setConfirmAction(() => () => handleCreateSlot(true));
      return;
    }

    setIsUpdating(true);
    try {
      const response = await fetch('/api/admin/slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slotForm),
      });

      if (response.ok) {
        toast({
          title: "Framgång!",
          description: "Tidslucka skapad framgångsrikt.",
          variant: "default"
        });
        await fetchSlots();
        setShowAddSlot(false);
        resetSlotForm();
      } else {
        const error = await response.json();
        toast({
          title: "Fel",
          description: error.error || "Kunde inte skapa tidslucka.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error creating slot:', error);
      toast({
        title: "Fel",
        description: "Ett fel uppstod vid skapande av tidslucka.",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCreateBlockedSlot = async () => {
    setIsUpdating(true);
    try {
      const response = await fetch('/api/admin/blocked-slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(blockedForm),
      });

      if (response.ok) {
        toast({
          title: "Framgång!",
          description: "Blockerad tid skapad framgångsrikt.",
          variant: "default"
        });
        await fetchBlockedSlots();
        setShowAddBlocked(false);
        resetBlockedForm();
      } else {
        const error = await response.json();
        toast({
          title: "Fel",
          description: error.error || "Kunde inte skapa blockerad tid.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error creating blocked slot:', error);
      toast({
        title: "Fel",
        description: "Ett fel uppstod vid skapande av blockerad tid.",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCreateExtraSlot = async () => {
    setIsUpdating(true);
    try {
      const response = await fetch('/api/admin/extra-slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(extraForm),
      });

      if (response.ok) {
        toast({
          title: "Framgång!",
          description: "Extra tidslucka skapad framgångsrikt.",
          variant: "default"
        });
        await fetchExtraSlots();
        setShowAddExtra(false);
        resetExtraForm();
      } else {
        const error = await response.json();
        toast({
          title: "Fel",
          description: error.error || "Kunde inte skapa extra tidslucka.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error creating extra slot:', error);
      toast({
        title: "Fel",
        description: "Ett fel uppstod vid skapande av extra tidslucka.",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateSlot = async (slot: SlotSetting) => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/admin/slots`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slot),
      });

      if (response.ok) {
        toast({
          title: "Framgång!",
          description: "Tidslucka uppdaterad framgångsrikt.",
          variant: "default"
        });
        await fetchSlots();
        setEditingSlot(null);
      } else {
        const error = await response.json();
        toast({
          title: "Fel",
          description: error.error || "Kunde inte uppdatera tidslucka.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error updating slot:', error);
      toast({
        title: "Fel",
        description: "Ett fel uppstod vid uppdatering av tidslucka.",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateBlockedSlot = async (blocked: BlockedSlot) => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/admin/blocked-slots`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(blocked),
      });

      if (response.ok) {
        toast({
          title: "Framgång!",
          description: "Blockerad tid uppdaterad framgångsrikt.",
          variant: "default"
        });
        await fetchBlockedSlots();
        setEditingBlocked(null);
      } else {
        const error = await response.json();
        toast({
          title: "Fel",
          description: error.error || "Kunde inte uppdatera blockerad tid.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error updating blocked slot:', error);
      toast({
        title: "Fel",
        description: "Ett fel uppstod vid uppdatering av blockerad tid.",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateExtraSlot = async (extra: ExtraSlot) => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/admin/extra-slots`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(extra),
      });

      if (response.ok) {
        toast({
          title: "Framgång!",
          description: "Extra tidslucka uppdaterad framgångsrikt.",
          variant: "default"
        });
        await fetchExtraSlots();
        setEditingExtra(null);
      } else {
        const error = await response.json();
        toast({
          title: "Fel",
          description: error.error || "Kunde inte uppdatera extra tidslucka.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error updating extra slot:', error);
      toast({
        title: "Fel",
        description: "Ett fel uppstod vid uppdatering av extra tidslucka.",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteSlot = async (id: string) => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/admin/slots?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: "Framgång!",
          description: "Tidslucka borttagen framgångsrikt.",
          variant: "default"
        });
        await fetchSlots();
      } else {
        const error = await response.json();
        toast({
          title: "Fel",
          description: error.error || "Kunde inte ta bort tidslucka.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error deleting slot:', error);
      toast({
        title: "Fel",
        description: "Ett fel uppstod vid borttagning av tidslucka.",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteBlockedSlot = async (id: string) => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/admin/blocked-slots?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: "Framgång!",
          description: "Blockerad tid borttagen framgångsrikt.",
          variant: "default"
        });
        await fetchBlockedSlots();
      } else {
        const error = await response.json();
        toast({
          title: "Fel",
          description: error.error || "Kunde inte ta bort blockerad tid.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error deleting blocked slot:', error);
      toast({
        title: "Fel",
        description: "Ett fel uppstod vid borttagning av blockerad tid.",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteExtraSlot = async (id: string) => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/admin/extra-slots?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: "Framgång!",
          description: "Extra tidslucka borttagen framgångsrikt.",
          variant: "default"
        });
        await fetchExtraSlots();
      } else {
        const error = await response.json();
        toast({
          title: "Fel",
          description: error.error || "Kunde inte ta bort extra tidslucka.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error deleting extra slot:', error);
      toast({
        title: "Fel",
        description: "Ett fel uppstod vid borttagning av extra tidslucka.",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const resetSlotForm = () => {
    setSlotForm({
      dayOfWeek: 1,
      timeStart: '09:00',
      timeEnd: '10:00',
      adminMinutes: 15,
      isActive: true,
    });
  };

  const resetBlockedForm = () => {
    setBlockedForm({
      date: '',
      timeStart: '09:00',
      timeEnd: '10:00',
      isAllDay: false,
      reason: '',
    });
  };

  const resetExtraForm = () => {
    setExtraForm({
      date: '',
      timeStart: '09:00',
      timeEnd: '10:00',
      reason: '',
      reservedForUserId: '',
    });
  };

  const confirmWarning = () => {
    if (confirmAction) {
      confirmAction();
    }
    setWarning(null);
    setConfirmAction(null);
  };

  const cancelWarning = () => {
    setWarning(null);
    setConfirmAction(null);
  };

  // Group slots by day of week for calendar view
  const slotsByDay = slots.reduce((acc, slot) => {
    if (!acc[slot.dayOfWeek]) {
      acc[slot.dayOfWeek] = [];
    }
    acc[slot.dayOfWeek].push(slot);
    return acc;
  }, {} as Record<number, SlotSetting[]>);

  return (
    <div className="text-slate-100">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-white flex items-center gap-2 drop-shadow-sm">
          <Settings className="w-8 h-8 text-sky-300" />
          Tidsluckor
        </h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowCalendar(!showCalendar)}
            className="text-white border-white/20 hover:bg-white/10"
          >
            <CalendarDays className="w-4 h-4 mr-2" />
            {showCalendar ? 'Lista' : 'Kalender'}
          </Button>
          <Button
            variant="destructive"
            onClick={handleResetMonFri}
            disabled={isUpdating}
            className="bg-red-600 hover:bg-red-700"
          >
            {isUpdating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />} Återställ (Mån–Fre)
          </Button>
        </div>
      </div>

      {/* Warning Dialog with Glassmorphism */}
      {warning && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100]">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-yellow-400" />
              <h3 className="text-lg font-semibold text-white">Varning</h3>
            </div>
            <p className="text-slate-300 mb-6">{warning}</p>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={cancelWarning}
                className="text-white border-white/20 hover:bg-white/10"
              >
                Avbryt
              </Button>
              <Button
                onClick={confirmWarning}
                className="bg-yellow-500 hover:bg-yellow-600 text-white"
              >
                Fortsätt ändå
              </Button>
            </div>
          </div>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-white/10 border border-white/20">
          <TabsTrigger value="slots" className="text-white data-[state=active]:bg-sky-500">
            Tidsluckor
          </TabsTrigger>
          <TabsTrigger value="blocked" className="text-white data-[state=active]:bg-red-500">
            Blockerade Tider
          </TabsTrigger>
          <TabsTrigger value="extra" className="text-white data-[state=active]:bg-green-500">
            Extra Tidsluckor
          </TabsTrigger>
        </TabsList>

        <TabsContent value="slots" className="mt-6">
          <Card className="bg-white/10 border border-white/20 text-white">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-sky-300" />
                Hantera Tidsluckor
              </CardTitle>
              <CardDescription className="text-slate-300">
                Konfigurera tillgängliga tidsluckor för varje veckodag
              </CardDescription>
            </CardHeader>
            <CardContent>
              {showCalendar ? (
                // Calendar View
                <div className="grid grid-cols-7 gap-4">
                  {DAYS_OF_WEEK.map((day, index) => (
                    <div key={index} className="space-y-2">
                      <h3 className="text-sm font-semibold text-sky-300 text-center">
                        {day}
                      </h3>
                      <div className="space-y-2">
                        {slotsByDay[index]?.map((slot) => (
                          <div
                            key={slot.id}
                            className="p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer group"
                            onClick={() => setEditingSlot(slot)}
                          >
                            <div className="text-xs text-white font-medium">
                              {slot.timeStart} - {slot.timeEnd}
                            </div>
                            <div className="flex items-center justify-between mt-1">
                              <Badge variant={slot.isActive ? "default" : "secondary"} className="text-xs">
                                {slot.isActive ? "Aktiv" : "Inaktiv"}
                              </Badge>
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 w-6 p-0 text-white border-white/20 hover:bg-white/10"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingSlot(slot);
                                  }}
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="h-6 w-6 p-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteSlot(slot.id);
                                  }}
                                  disabled={isUpdating}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSlotForm({...slotForm, dayOfWeek: index});
                            setShowAddSlot(true);
                          }}
                          className="w-full text-white border-white/20 hover:bg-white/10 text-xs"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Lägg till
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // List View
                <div className="space-y-4">
                  {slots.map((slot) => (
                    <div key={slot.id} className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
                      <div className="flex items-center gap-4">
                        <div className="text-sky-300 font-medium">
                          {DAYS_OF_WEEK[slot.dayOfWeek]}
                        </div>
                        <div className="text-white">
                          {slot.timeStart} - {slot.timeEnd}
                        </div>
                        <Badge variant={slot.isActive ? "default" : "secondary"}>
                          {slot.isActive ? "Aktiv" : "Inaktiv"}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingSlot(slot)}
                          className="text-white border-white/20 hover:bg-white/10"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteSlot(slot.id)}
                          disabled={isUpdating}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  <Button
                    onClick={() => setShowAddSlot(true)}
                    className="bg-sky-500 hover:bg-sky-600 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Lägg till Tidslucka
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="blocked" className="mt-6">
          <Card className="bg-white/10 border border-white/20 text-white">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Ban className="w-5 h-5 text-red-300" />
                Blockerade Tider
              </CardTitle>
              <CardDescription className="text-slate-300">
                Hantera blockerade tider och datum
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {blockedSlots.map((blocked) => (
                  <div key={blocked.id} className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
                    <div className="flex items-center gap-4">
                      <div className="text-red-300 font-medium">
                        {new Date(blocked.date).toLocaleDateString('sv-SE')}
                      </div>
                      <div className="text-white">
                        {blocked.isAllDay ? 'Hela dagen' : `${blocked.timeStart} - ${blocked.timeEnd}`}
                      </div>
                      {blocked.reason && (
                        <div className="text-slate-300 text-sm">
                          {blocked.reason}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingBlocked(blocked)}
                        className="text-white border-white/20 hover:bg-white/10"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteBlockedSlot(blocked.id)}
                        disabled={isUpdating}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                <Button
                  onClick={() => setShowAddBlocked(true)}
                  className="bg-red-500 hover:bg-red-600 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Lägg till Blockerad Tid
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="extra" className="mt-6">
          <Card className="bg-white/10 border border-white/20 text-white">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-green-300" />
                Extra Tidsluckor
              </CardTitle>
              <CardDescription className="text-slate-300">
                Hantera extra tidsluckor för specifika datum
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {extraSlots.map((extra) => (
                  <div key={extra.id} className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
                    <div className="flex items-center gap-4">
                      <div className="text-green-300 font-medium">
                        {new Date(extra.date).toLocaleDateString('sv-SE')}
                      </div>
                      <div className="text-white">
                        {extra.timeStart} - {extra.timeEnd}
                      </div>
                      {extra.reason && (
                        <div className="text-slate-300 text-sm">
                          {extra.reason}
                        </div>
                      )}
                      {extra.reservedForUserId && (
                        <Badge variant="secondary" className="text-xs">
                          Reserverad: {usersForSelect.find(u => u.id === extra.reservedForUserId)?.name || 'Okänd'}
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingExtra(extra)}
                        className="text-white border-white/20 hover:bg-white/10"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteExtraSlot(extra.id)}
                        disabled={isUpdating}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                <Button
                  onClick={() => setShowAddExtra(true)}
                  className="bg-green-500 hover:bg-green-600 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Lägg till Extra Tidslucka
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Slot Modal with Glassmorphism */}
      {showAddSlot && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[90]">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Lägg till Tidslucka</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAddSlot(false)}
                className="text-white hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <Label className="text-white">Veckodag</Label>
                <Select
                  value={slotForm.dayOfWeek.toString()}
                  onValueChange={(value) => setSlotForm({...slotForm, dayOfWeek: parseInt(value)})}
                >
                  <SelectTrigger className="glassmorphism-dropdown-trigger">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glassmorphism-dropdown-content">
                    {DAYS_OF_WEEK.map((day, index) => (
                      <SelectItem key={index} value={index.toString()} className="glassmorphism-dropdown-item">
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-white">Starttid</Label>
                  <Input
                    type="time"
                    value={slotForm.timeStart}
                    onChange={(e) => setSlotForm({...slotForm, timeStart: e.target.value})}
                    className="bg-white/5 border-white/20 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white">Sluttid</Label>
                  <Input
                    type="time"
                    value={slotForm.timeEnd}
                    onChange={(e) => setSlotForm({...slotForm, timeEnd: e.target.value})}
                    className="bg-white/5 border-white/20 text-white"
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-4 border-t border-white/10">
                <Button
                  variant="outline"
                  onClick={() => setShowAddSlot(false)}
                  className="text-white border-white/20 hover:bg-white/10"
                >
                  Avbryt
                </Button>
                <Button
                  onClick={() => handleCreateSlot()}
                  disabled={isUpdating}
                  className="bg-sky-500 hover:bg-sky-600 text-white"
                >
                  {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Skapa
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Blocked Slot Modal with Glassmorphism */}
      {showAddBlocked && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[90]">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Lägg till Blockerad Tid</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAddBlocked(false)}
                className="text-white hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <Label className="text-white">Datum</Label>
                <Input
                  type="date"
                  value={blockedForm.date}
                  onChange={(e) => setBlockedForm({...blockedForm, date: e.target.value})}
                  className="bg-white/5 border-white/20 text-white"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={blockedForm.isAllDay}
                  onChange={(e) => setBlockedForm({...blockedForm, isAllDay: e.target.checked})}
                  className="w-4 h-4"
                />
                <Label className="text-white">Hela dagen</Label>
              </div>
              {!blockedForm.isAllDay && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white">Starttid</Label>
                    <Input
                      type="time"
                      value={blockedForm.timeStart}
                      onChange={(e) => setBlockedForm({...blockedForm, timeStart: e.target.value})}
                      className="bg-white/5 border-white/20 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Sluttid</Label>
                    <Input
                      type="time"
                      value={blockedForm.timeEnd}
                      onChange={(e) => setBlockedForm({...blockedForm, timeEnd: e.target.value})}
                      className="bg-white/5 border-white/20 text-white"
                    />
                  </div>
                </div>
              )}
              <div>
                <Label className="text-white">Anledning (valfritt)</Label>
                <Input
                  type="text"
                  value={blockedForm.reason}
                  onChange={(e) => setBlockedForm({...blockedForm, reason: e.target.value})}
                  className="bg-white/5 border-white/20 text-white"
                />
              </div>
              <div className="flex gap-2 justify-end pt-4 border-t border-white/10">
                <Button
                  variant="outline"
                  onClick={() => setShowAddBlocked(false)}
                  className="text-white border-white/20 hover:bg-white/10"
                >
                  Avbryt
                </Button>
                <Button
                  onClick={handleCreateBlockedSlot}
                  disabled={isUpdating}
                  className="bg-red-500 hover:bg-red-600 text-white"
                >
                  {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Skapa
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Extra Slot Modal with Glassmorphism */}
      {showAddExtra && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[90]">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Lägg till Extra Tidslucka</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAddExtra(false)}
                className="text-white hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <Label className="text-white">Datum</Label>
                <Input
                  type="date"
                  value={extraForm.date}
                  onChange={(e) => setExtraForm({...extraForm, date: e.target.value})}
                  className="bg-white/5 border-white/20 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-white">Starttid</Label>
                  <Input
                    type="time"
                    value={extraForm.timeStart}
                    onChange={(e) => setExtraForm({...extraForm, timeStart: e.target.value})}
                    className="bg-white/5 border-white/20 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white">Sluttid</Label>
                  <Input
                    type="time"
                    value={extraForm.timeEnd}
                    onChange={(e) => setExtraForm({...extraForm, timeEnd: e.target.value})}
                    className="bg-white/5 border-white/20 text-white"
                  />
                </div>
              </div>
              <div>
                <Label className="text-white">Anledning (valfritt)</Label>
                <Input
                  type="text"
                  value={extraForm.reason}
                  onChange={(e) => setExtraForm({...extraForm, reason: e.target.value})}
                  className="bg-white/5 border-white/20 text-white"
                />
              </div>
              <div>
                <Label className="text-white">Reservera för användare (valfritt)</Label>
                <Select
                  value={extraForm.reservedForUserId ? extraForm.reservedForUserId : 'ALL'}
                  onValueChange={(value) => setExtraForm({ ...extraForm, reservedForUserId: value === 'ALL' ? '' : value })}
                >
                  <SelectTrigger className="glassmorphism-dropdown-trigger relative z-[10001]">
                    <SelectValue placeholder="Synlig för alla" />
                  </SelectTrigger>
                  <SelectContent className="glassmorphism-dropdown-content max-h-72 overflow-auto relative z-[10001]">
                    <SelectItem value="ALL" className="glassmorphism-dropdown-item">Synlig för alla</SelectItem>
                    {usersForSelect.map((u) => (
                      <SelectItem key={u.id} value={u.id} className="glassmorphism-dropdown-item">
                        {u.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 justify-end pt-4 border-t border-white/10">
                <Button
                  variant="outline"
                  onClick={() => setShowAddExtra(false)}
                  className="text-white border-white/20 hover:bg-white/10"
                >
                  Avbryt
                </Button>
                <Button
                  onClick={handleCreateExtraSlot}
                  disabled={isUpdating}
                  className="bg-green-500 hover:bg-green-600 text-white"
                >
                  {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Skapa
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Slot Modal with Glassmorphism */}
      {editingSlot && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[90]">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Redigera Tidslucka</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingSlot(null)}
                className="text-white hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <Label className="text-white">Veckodag</Label>
                <Select
                  value={editingSlot.dayOfWeek.toString()}
                  onValueChange={(value) => setEditingSlot({...editingSlot, dayOfWeek: parseInt(value)})}
                >
                  <SelectTrigger className="glassmorphism-dropdown-trigger">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glassmorphism-dropdown-content">
                    {DAYS_OF_WEEK.map((day, index) => (
                      <SelectItem key={index} value={index.toString()} className="glassmorphism-dropdown-item">
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-white">Starttid</Label>
                  <Input
                    type="time"
                    value={editingSlot.timeStart}
                    onChange={(e) => setEditingSlot({...editingSlot, timeStart: e.target.value})}
                    className="bg-white/5 border-white/20 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white">Sluttid</Label>
                  <Input
                    type="time"
                    value={editingSlot.timeEnd}
                    onChange={(e) => setEditingSlot({...editingSlot, timeEnd: e.target.value})}
                    className="bg-white/5 border-white/20 text-white"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editingSlot.isActive}
                  onChange={(e) => setEditingSlot({...editingSlot, isActive: e.target.checked})}
                  className="w-4 h-4"
                />
                <Label className="text-white">Aktiv</Label>
              </div>
              <div className="flex gap-2 justify-end pt-4 border-t border-white/10">
                <Button
                  variant="outline"
                  onClick={() => setEditingSlot(null)}
                  className="text-white border-white/20 hover:bg-white/10"
                >
                  Avbryt
                </Button>
                <Button
                  onClick={() => handleUpdateSlot(editingSlot)}
                  disabled={isUpdating}
                  className="bg-sky-500 hover:bg-sky-600 text-white"
                >
                  {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Uppdatera
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Extra Slot Modal with Glassmorphism */}
      {editingExtra && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[90]">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Redigera Extra Tidslucka</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingExtra(null)}
                className="text-white hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <Label className="text-white">Datum</Label>
                <Input
                  type="date"
                  value={editingExtra.date}
                  onChange={(e) => setEditingExtra({ ...(editingExtra as any), date: e.target.value })}
                  className="bg-white/5 border-white/20 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-white">Starttid</Label>
                  <Input
                    type="time"
                    value={editingExtra.timeStart}
                    onChange={(e) => setEditingExtra({ ...(editingExtra as any), timeStart: e.target.value })}
                    className="bg-white/5 border-white/20 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white">Sluttid</Label>
                  <Input
                    type="time"
                    value={editingExtra.timeEnd}
                    onChange={(e) => setEditingExtra({ ...(editingExtra as any), timeEnd: e.target.value })}
                    className="bg-white/5 border-white/20 text-white"
                  />
                </div>
              </div>
              <div>
                <Label className="text-white">Anledning (valfritt)</Label>
                <Input
                  type="text"
                  value={editingExtra.reason || ''}
                  onChange={(e) => setEditingExtra({ ...(editingExtra as any), reason: e.target.value })}
                  className="bg-white/5 border-white/20 text-white"
                />
              </div>
              <div>
                <Label className="text-white">Reservera för användare (valfritt)</Label>
                <Select
                  value={editingExtra.reservedForUserId ? editingExtra.reservedForUserId : 'ALL'}
                  onValueChange={(value) => setEditingExtra({ ...(editingExtra as any), reservedForUserId: value === 'ALL' ? '' : value })}
                >
                  <SelectTrigger className="glassmorphism-dropdown-trigger relative z-[10001]">
                    <SelectValue placeholder="Synlig för alla" />
                  </SelectTrigger>
                  <SelectContent className="glassmorphism-dropdown-content max-h-72 overflow-auto relative z-[10001]">
                    <SelectItem value="ALL" className="glassmorphism-dropdown-item">Synlig för alla</SelectItem>
                    {usersForSelect.map((u) => (
                      <SelectItem key={u.id} value={u.id} className="glassmorphism-dropdown-item">
                        {u.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 justify-end pt-4 border-t border-white/10">
                <Button
                  variant="outline"
                  onClick={() => setEditingExtra(null)}
                  className="text-white border-white/20 hover:bg-white/10"
                >
                  Avbryt
                </Button>
                <Button
                  onClick={() => handleUpdateExtraSlot(editingExtra)}
                  disabled={isUpdating}
                  className="bg-green-500 hover:bg-green-600 text-white"
                >
                  {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Uppdatera
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
