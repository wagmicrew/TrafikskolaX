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
  Loader2
} from "lucide-react";
import WeeklyCalendar from '@/components/WeeklyCalendar';
import BlockedSlotsCalendar from '@/components/BlockedSlotsCalendar';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

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

const DAYS_OF_WEEK = [
  'Söndag', 'Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag'
];

export default function SlotsClient() {
  const [slots, setSlots] = useState<SlotSetting[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
  const [activeTab, setActiveTab] = useState<'slots' | 'blocked'>('slots');
  const [editingSlot, setEditingSlot] = useState<SlotSetting | null>(null);
  const [editingBlocked, setEditingBlocked] = useState<BlockedSlot | null>(null);
  const [showAddSlot, setShowAddSlot] = useState(false);
  const [showAddBlocked, setShowAddBlocked] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<SlotSetting | null>(null);
  const [showSlotDetails, setShowSlotDetails] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState<{ x: number; y: number } | null>(null);
  const [draggedSlot, setDraggedSlot] = useState<SlotSetting | null>(null);
  const [selectedBlockedSlot, setSelectedBlockedSlot] = useState<BlockedSlot | null>(null);
  const [showBlockedSlotDetails, setShowBlockedSlotDetails] = useState(false);
  const [blockedPopoverPosition, setBlockedPopoverPosition] = useState<{ x: number; y: number } | null>(null);
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

  useEffect(() => {
    fetchSlots();
    fetchBlockedSlots();
  }, []);

  const fetchSlots = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching slots from /api/admin/slots');
      const response = await fetch('/api/admin/slots');
      console.log('Slots response status:', response.status);
      const data = await response.json();
      console.log('Slots response data:', data);
      console.log('Setting slots to:', data.slotSettings || []);
      setSlots(data.slotSettings || []);
    } catch (error) {
      console.error('Error fetching slots:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBlockedSlots = async () => {
    try {
      const response = await fetch('/api/admin/blocked-slots');
      const data = await response.json();
      setBlockedSlots(data.blockedSlots || []);
    } catch (error) {
      console.error('Error fetching blocked slots:', error);
    }
  };

  const handleCreateSlot = async (confirmed = false) => {
    try {
      console.log('Creating slot with data:', slotForm);
      const url = confirmed ? '/api/admin/slots?confirmed=true' : '/api/admin/slots';
      console.log('POST URL:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slotForm),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      const data = await response.json();
      console.log('Response data:', data);

      if (response.status === 422 && data.requiresConfirmation) {
        console.log('Requires confirmation, showing warning');
        setWarning(data.warning);
        setConfirmAction(() => () => handleCreateSlot(true));
        toast({
          title: "Bekräftelse krävs",
          description: data.warning,
          variant: "default"
        });
        return;
      }

      if (response.ok) {
        console.log('Slot created successfully');
        fetchSlots();
        setShowAddSlot(false);
        resetSlotForm();
        toast({
          title: "Framgång!",
          description: "Tidslucka skapad framgångsrikt!",
          variant: "default"
        });
      } else {
        console.error('Error creating slot:', data);
        toast({
          title: "Fel",
          description: data.error || 'Fel vid skapande av tidslucka',
          variant: "destructive"
        });
      }
    } catch (error: unknown) {
      console.error('Exception creating slot:', error);
      const errorMessage = error instanceof Error ? error.message : 'Okänt fel';
      toast({
        title: "Fel",
        description: `Fel vid skapande av tidslucka: ${errorMessage}`,
        variant: "destructive"
      });
    }
  };

  // Helper function to ensure time format is HH:MM (without seconds)
  const formatTimeForApi = (time: string): string => {
    return time.substring(0, 5); // Convert HH:MM:SS to HH:MM
  };

  // Helper function to convert HH:MM:SS to HH:MM for inputs
  const formatTimeForInput = (time: string): string => {
    if (time.length === 8) { // HH:MM:SS format
      return time.substring(0, 5); // Return HH:MM
    }
    return time; // Already HH:MM format
  };

  const handleUpdateSlot = async (slot: SlotSetting) => {
    try {
      setIsUpdating(true);
      // Ensure times are in correct format for API
      const slotData = {
        ...slot,
        timeStart: formatTimeForApi(slot.timeStart),
        timeEnd: formatTimeForApi(slot.timeEnd)
      };
      
      console.log('Time start after format:', formatTimeForApi(slot.timeStart));
      console.log('Time end after format:', formatTimeForApi(slot.timeEnd));
      console.log('Updating slot with formatted data:', slotData);
      const response = await fetch('/api/admin/slots', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slotData),
      });

      console.log('Update response status:', response.status);
      const data = await response.json();
      console.log('Update response data:', data);

      if (response.ok) {
        console.log('Slot updated successfully');
        fetchSlots();
        setEditingSlot(null);
        toast({
          title: "Framgång!",
          description: "Tidslucka uppdaterad framgångsrikt!",
          variant: "default"
        });
      } else {
        console.error('Error updating slot:', data);
        toast({
          title: "Fel",
          description: data.error || 'Fel vid uppdatering av tidslucka',
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Exception updating slot:', error);
      toast({
        title: "Fel",
        description: 'Fel vid uppdatering av tidslucka: ' + error.message,
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteSlot = async (id: string) => {
    if (!confirm('Är du säker på att du vill ta bort denna tidslucka?')) return;

    try {
      console.log('Deleting slot with ID:', id);
      const response = await fetch(`/api/admin/slots?id=${id}`, {
        method: 'DELETE',
      });

      console.log('Delete response status:', response.status);
      const data = await response.json();
      console.log('Delete response data:', data);

      if (response.ok) {
        console.log('Slot deleted successfully');
        fetchSlots();
        toast({
          title: "Framgång!",
          description: "Tidslucka borttagen framgångsrikt!",
          variant: "default"
        });
      } else {
        console.error('Error deleting slot:', data);
        toast({
          title: "Fel",
          description: data.error || 'Fel vid borttagning av tidslucka',
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Exception deleting slot:', error);
      toast({
        title: "Fel",
        description: 'Fel vid borttagning av tidslucka: ' + error.message,
        variant: "destructive"
      });
    }
  };

  const handleCreateBlockedSlot = async () => {
    try {
      const response = await fetch('/api/admin/blocked-slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(blockedForm),
      });

      if (response.ok) {
        fetchBlockedSlots();
        setShowAddBlocked(false);
        resetBlockedForm();
        toast({
          title: "Framgång!",
          description: "Blockerad tid skapad framgångsrikt!",
          variant: "default"
        });
      } else {
        const data = await response.json();
        toast({
          title: "Fel",
          description: data.error || 'Fel vid skapande av blockerad tid',
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Fel",
        description: 'Fel vid skapande av blockerad tid',
        variant: "destructive"
      });
    }
  };

  const handleUpdateBlockedSlot = async (blocked: BlockedSlot) => {
    try {
      const response = await fetch('/api/admin/blocked-slots', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(blocked),
      });

      if (response.ok) {
        fetchBlockedSlots();
        setEditingBlocked(null);
        toast({
          title: "Framgång!",
          description: "Blockerad tid uppdaterad framgångsrikt!",
          variant: "default"
        });
      } else {
        const data = await response.json();
        toast({
          title: "Fel",
          description: data.error || 'Fel vid uppdatering av blockerad tid',
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Fel",
        description: 'Fel vid uppdatering av blockerad tid',
        variant: "destructive"
      });
    }
  };

  const handleDeleteBlockedSlot = async (id: string) => {
    if (!confirm('Är du säker på att du vill ta bort denna blockering?')) return;

    try {
      const response = await fetch(`/api/admin/blocked-slots?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchBlockedSlots();
        toast({
          title: "Framgång!",
          description: "Blockering borttagen framgångsrikt!",
          variant: "default"
        });
      } else {
        toast({
          title: "Fel",
          description: 'Fel vid borttagning av blockering',
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Fel",
        description: 'Fel vid borttagning av blockering',
        variant: "destructive"
      });
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

  const confirmWarning = () => {
    if (confirmAction) {
      confirmAction();
      setConfirmAction(null);
    }
    setWarning(null);
  };

  const cancelWarning = () => {
    setWarning(null);
    setConfirmAction(null);
  };

  // Week navigation helpers
  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(newWeek.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeek(newWeek);
  };

  const formatWeekRange = (date: Date) => {
    const startOfWeek = new Date(date);
    const dayOfWeek = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust for Monday as first day
    startOfWeek.setDate(diff);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    const formatDate = (d: Date) => d.toLocaleDateString('sv-SE', { 
      day: 'numeric', 
      month: 'short' 
    });
    
    return `${formatDate(startOfWeek)} - ${formatDate(endOfWeek)}`;
  };

  // Enhanced slot handlers
  const handleSlotClick = (slot: SlotSetting, event: React.MouseEvent) => {
    event.preventDefault();
    setSelectedSlot(slot);
    setShowSlotDetails(true);
    setEditingSlot({
      ...slot,
      timeStart: formatTimeForInput(slot.timeStart),
      timeEnd: formatTimeForInput(slot.timeEnd)
    });
    
    // Set popover position based on click location
    const rect = event.currentTarget.getBoundingClientRect();
    setPopoverPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10
    });
  };

  const handleSlotRightClick = (slot: SlotSetting, event: React.MouseEvent) => {
    event.preventDefault();
    
    // Create blocked slot for this time
    const today = new Date();
    const dayOffset = slot.dayOfWeek - today.getDay();
    const slotDate = new Date(today);
    slotDate.setDate(today.getDate() + dayOffset);
    
    const newBlockedForm = {
      date: slotDate.toISOString().split('T')[0],
      timeStart: slot.timeStart,
      timeEnd: slot.timeEnd,
      isAllDay: false,
      reason: 'Blockerad från tidslucka'
    };
    
    setBlockedForm(newBlockedForm);
    handleCreateBlockedSlot();
  };

  const handleSlotDrag = (slot: SlotSetting, newTime: { start: string; end: string; day: number }) => {
    const updatedSlot = {
      ...slot,
      dayOfWeek: newTime.day,
      timeStart: newTime.start,
      timeEnd: newTime.end
    };
    
    handleUpdateSlot(updatedSlot);
  };

  const handleSlotResize = (slot: SlotSetting, newTime: { start: string; end: string }) => {
    const updatedSlot = {
      ...slot,
      timeStart: newTime.start,
      timeEnd: newTime.end
    };
    
    handleUpdateSlot(updatedSlot);
  };

  const closePopover = () => {
    setShowSlotDetails(false);
    setSelectedSlot(null);
    setEditingSlot(null);
    setPopoverPosition(null);
  };

  const handleDeleteSlotFromPopover = () => {
    if (selectedSlot) {
      handleDeleteSlot(selectedSlot.id);
      closePopover();
    }
  };

  const handleSaveSlotFromPopover = () => {
    if (editingSlot) {
      handleUpdateSlot(editingSlot);
      closePopover();
    }
  };

  // Blocked slot handlers
  const handleBlockedSlotClick = (slot: BlockedSlot, event: React.MouseEvent) => {
    event.preventDefault();
    setSelectedBlockedSlot(slot);
    setShowBlockedSlotDetails(true);
    setEditingBlocked({
      ...slot,
      timeStart: slot.timeStart || '09:00',
      timeEnd: slot.timeEnd || '10:00'
    });
    
    // Set popover position based on click location
    const rect = event.currentTarget.getBoundingClientRect();
    setBlockedPopoverPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10
    });
  };

  const handleBlockedSlotAdd = (event: React.MouseEvent, date?: string) => {
    event.preventDefault();
    if (date) {
      setBlockedForm({
        ...blockedForm,
        date: date
      });
    }
    setShowAddBlocked(true);
  };

  const closeBlockedPopover = () => {
    setShowBlockedSlotDetails(false);
    setSelectedBlockedSlot(null);
    setEditingBlocked(null);
    setBlockedPopoverPosition(null);
  };

  const handleDeleteBlockedSlotFromPopover = () => {
    if (selectedBlockedSlot) {
      handleDeleteBlockedSlot(selectedBlockedSlot.id);
      closeBlockedPopover();
    }
  };

  const handleSaveBlockedSlotFromPopover = () => {
    if (editingBlocked) {
      handleUpdateBlockedSlot(editingBlocked);
      closeBlockedPopover();
    }
  };

  // Copy slots from Monday to other weekdays
  const handleCopySlots = async () => {
    if (!confirm('Detta kommer att kopiera alla tidsluckor från måndag till tisdag, onsdag, torsdag och fredag. Vill du fortsätta?')) {
      return;
    }

    try {
      setIsLoading(true);
      
      const response = await fetch('/api/admin/slots/copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceDay: 1 }) // 1 = Monday
      });

      const data = await response.json();
      
      if (response.ok) {
        // Refresh the slots
        await fetchSlots();
        
        toast({
          title: "Framgång!",
          description: `Tidsluckor har kopierats framgångsrikt till ${data.totalSlotsCopied} nya platser.`,
          variant: "default"
        });
      } else {
        throw new Error(data.error || 'Kunde inte kopiera tidsluckor');
      }
    } catch (error: unknown) {
      console.error('Error copying slots:', error);
      const errorMessage = error instanceof Error ? error.message : 'Ett okänt fel uppstod';
      toast({
        title: "Fel",
        description: `Ett fel uppstod vid kopiering av tidsluckor: ${errorMessage}`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Tidsluckor</h1>
      </div>

      {/* Warning Dialog */}
      {warning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-yellow-500" />
              <h3 className="text-lg font-semibold">Varning</h3>
            </div>
            <p className="text-gray-600 mb-6">{warning}</p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={cancelWarning}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Avbryt
              </button>
              <button
                onClick={confirmWarning}
                className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
              >
                Fortsätt ändå
              </button>
            </div>
          </div>
        </div>
      )}

{/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              <button
                onClick={() => setActiveTab('slots')}
                className={`px-6 py-3 border-b-2 font-medium text-sm ${
                  activeTab === 'slots'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Clock className="w-4 h-4 inline mr-2" />
                Tidsluckor
              </button>
              <button
                onClick={() => setActiveTab('blocked')}
                className={`px-6 py-3 border-b-2 font-medium text-sm ${
                  activeTab === 'blocked'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Ban className="w-4 h-4 inline mr-2" />
                Blockerade Tider
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Tab Content for Slots */}
            {activeTab === 'slots' && (
              <div>
                {/* Slots Management Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                  <h2 className="text-xl font-semibold">Hantera Tidsluckor</h2>
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <button
                      onClick={handleCopySlots}
                      disabled={isLoading}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Bearbetar...
                        </>
                      ) : (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                          </svg>
                          Kopiera måndag till vardagar
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setShowAddSlot(true)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 justify-center"
                    >
                      <Plus className="w-4 h-4" />
                      Lägg till tidslucka
                    </button>
                  </div>
                </div>

                {/* Add Slot Form */}
                {showAddSlot && (
                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <h3 className="font-semibold mb-3">Ny Tidslucka</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Dag</label>
                        <select
                          value={slotForm.dayOfWeek}
                          onChange={(e) => setSlotForm({ ...slotForm, dayOfWeek: parseInt(e.target.value) })}
                          className="w-full border rounded px-3 py-2"
                        >
                          {DAYS_OF_WEEK.map((day, index) => (
                            <option key={index} value={index}>{day}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Starttid</label>
                        <input
                          type="time"
                          value={slotForm.timeStart}
                          onChange={(e) => setSlotForm({ ...slotForm, timeStart: e.target.value })}
                          className="w-full border rounded px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Sluttid</label>
                        <input
                          type="time"
                          value={slotForm.timeEnd}
                          onChange={(e) => setSlotForm({ ...slotForm, timeEnd: e.target.value })}
                          className="w-full border rounded px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Admin tid (min)</label>
                        <input
                          type="number"
                          value={slotForm.adminMinutes}
                          onChange={(e) => setSlotForm({ ...slotForm, adminMinutes: parseInt(e.target.value) })}
                          className="w-full border rounded px-3 py-2"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => handleCreateSlot()}
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                      >
                        <Save className="w-4 h-4 inline mr-1" />
                        Spara
                      </button>
                      <button
                        onClick={() => {
                          setShowAddSlot(false);
                          resetSlotForm();
                        }}
                        className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
                      >
                        <X className="w-4 h-4 inline mr-1" />
                        Avbryt
                      </button>
                    </div>
                  </div>
                )}


                {/* Week Navigation */}
                <div className="flex items-center justify-between mb-4 p-4 bg-gray-50 rounded-lg">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateWeek('prev')}
                    className="flex items-center gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Föregående vecka
                  </Button>
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span className="font-medium">{formatWeekRange(currentWeek)}</span>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateWeek('next')}
                    className="flex items-center gap-2"
                  >
                    Nästa vecka
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>

                {/* Weekly Calendar View */}
                <div className="relative">
                  {isLoading && (
                    <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-lg">
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                        <span className="text-sm text-gray-600">Laddar tidsluckor...</span>
                      </div>
                    </div>
                  )}
                  <WeeklyCalendar 
                    slots={slots} 
                    onEdit={handleSlotClick} 
                    onAdd={setShowAddSlot}
                    currentWeek={currentWeek}
                    onRightClick={handleSlotRightClick}
                    onDrag={handleSlotDrag}
                    onResize={handleSlotResize}
                  />
                </div>

                {/* Hidden Slots List - Now using popover instead */}
              </div>
            )}

            {/* Tab Content for Blocked Slots */}
            {activeTab === 'blocked' && (
              <div>
                {/* Blocked Slots Management Header */}
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Hantera Blockerade Tider</h2>
                  <button
                    onClick={() => setShowAddBlocked(true)}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Blockera tid
                  </button>
                </div>

              {/* Add Blocked Slot Form */}
              {showAddBlocked && (
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <h3 className="font-semibold mb-3">Blockera Tid</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Datum</label>
                      <input
                        type="date"
                        value={blockedForm.date}
                        onChange={(e) => setBlockedForm({ ...blockedForm, date: e.target.value })}
                        className="w-full border rounded px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        <input
                          type="checkbox"
                          checked={blockedForm.isAllDay}
                          onChange={(e) => setBlockedForm({ ...blockedForm, isAllDay: e.target.checked })}
                          className="mr-2"
                        />
                        Hela dagen
                      </label>
                    </div>
                    {!blockedForm.isAllDay && (
                      <>
                        <div>
                          <label className="block text-sm font-medium mb-1">Starttid</label>
                          <input
                            type="time"
                            value={blockedForm.timeStart}
                            onChange={(e) => setBlockedForm({ ...blockedForm, timeStart: e.target.value })}
                            className="w-full border rounded px-3 py-2"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Sluttid</label>
                          <input
                            type="time"
                            value={blockedForm.timeEnd}
                            onChange={(e) => setBlockedForm({ ...blockedForm, timeEnd: e.target.value })}
                            className="w-full border rounded px-3 py-2"
                          />
                        </div>
                      </>
                    )}
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium mb-1">Anledning</label>
                    <input
                      type="text"
                      value={blockedForm.reason}
                      onChange={(e) => setBlockedForm({ ...blockedForm, reason: e.target.value })}
                      placeholder="T.ex. Semester, Sjukdom, etc."
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={handleCreateBlockedSlot}
                      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                    >
                      <Save className="w-4 h-4 inline mr-1" />
                      Spara
                    </button>
                    <button
                      onClick={() => {
                        setShowAddBlocked(false);
                        resetBlockedForm();
                      }}
                      className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
                    >
                      <X className="w-4 h-4 inline mr-1" />
                      Avbryt
                    </button>
                  </div>
                </div>
              )}

              {/* Week Navigation for Blocked Slots */}
              <div className="flex items-center justify-between mb-4 p-4 bg-gray-50 rounded-lg">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateWeek('prev')}
                  className="flex items-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Föregående vecka
                </Button>
                
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span className="font-medium">{formatWeekRange(currentWeek)}</span>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateWeek('next')}
                  className="flex items-center gap-2"
                >
                  Nästa vecka
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              {/* Blocked Slots Calendar View */}
              <BlockedSlotsCalendar 
                blockedSlots={blockedSlots} 
                onEdit={handleBlockedSlotClick} 
                onAdd={handleBlockedSlotAdd}
                currentWeek={currentWeek}
              />

              {/* Hidden Blocked Slots List - Now using popover instead */}
            </div>
          )}
        </div>
      </div>

      {/* Slot Details Popover */}
      {showSlotDetails && selectedSlot && popoverPosition && (
        <div 
          className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-[300px]"
          style={{
            left: `${popoverPosition.x - 150}px`, // Center the popover
            top: `${popoverPosition.y}px`,
            transform: 'translateY(-100%)' // Position above the click point
          }}
        >
          {/* Close button */}
          <button
            onClick={closePopover}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Popover header */}
          <div className="mb-4">
            <h3 className="font-semibold text-lg">Redigera Tidslucka</h3>
            <p className="text-sm text-gray-600">
              {DAYS_OF_WEEK[selectedSlot.dayOfWeek]} {selectedSlot.timeStart} - {selectedSlot.timeEnd}
            </p>
          </div>

          {/* Edit form */}
          {editingSlot && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Dag</label>
                <select
                  value={editingSlot.dayOfWeek}
                  onChange={(e) => setEditingSlot({ ...editingSlot, dayOfWeek: parseInt(e.target.value) })}
                  className="w-full border rounded px-3 py-2"
                >
                  {DAYS_OF_WEEK.map((day, index) => (
                    <option key={index} value={index}>{day}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium mb-1">Starttid</label>
                  <input
                    type="time"
                    value={editingSlot.timeStart}
                    onChange={(e) => setEditingSlot({ ...editingSlot, timeStart: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Sluttid</label>
                  <input
                    type="time"
                    value={editingSlot.timeEnd}
                    onChange={(e) => setEditingSlot({ ...editingSlot, timeEnd: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Admin tid (minuter)</label>
                <input
                  type="number"
                  value={editingSlot.adminMinutes || 0}
                  onChange={(e) => {
                    const value = e.target.value === '' ? 0 : parseInt(e.target.value) || 0;
                    setEditingSlot({ ...editingSlot, adminMinutes: value });
                  }}
                  className="w-full border rounded px-3 py-2"
                  min="0"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={editingSlot.isActive}
                  onChange={(e) => setEditingSlot({ ...editingSlot, isActive: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="isActive" className="text-sm font-medium">Aktiv</label>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 pt-2 border-t">
                <button
                  onClick={handleSaveSlotFromPopover}
                  disabled={isUpdating}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isUpdating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Spara
                </button>
                <button
                  onClick={handleDeleteSlotFromPopover}
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Ta bort
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Overlay to close popover when clicking outside */}
      {showSlotDetails && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={closePopover}
        />
      )}

      {/* Blocked Slot Details Popover */}
      {showBlockedSlotDetails && selectedBlockedSlot && blockedPopoverPosition && (
        <div 
          className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-[300px]"
          style={{
            left: `${blockedPopoverPosition.x - 150}px`, // Center the popover
            top: `${blockedPopoverPosition.y}px`,
            transform: 'translateY(-100%)' // Position above the click point
          }}
        >
          {/* Close button */}
          <button
            onClick={closeBlockedPopover}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Popover header */}
          <div className="mb-4">
            <h3 className="font-semibold text-lg">Redigera Blockerad Tid</h3>
            <p className="text-sm text-gray-600">
              {selectedBlockedSlot.date} {selectedBlockedSlot.isAllDay ? '(Hela dagen)' : `${selectedBlockedSlot.timeStart} - ${selectedBlockedSlot.timeEnd}`}
            </p>
          </div>

          {/* Edit form */}
          {editingBlocked && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Datum</label>
                <input
                  type="date"
                  value={editingBlocked.date}
                  onChange={(e) => setEditingBlocked({ ...editingBlocked, date: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isAllDay"
                  checked={editingBlocked.isAllDay}
                  onChange={(e) => setEditingBlocked({ ...editingBlocked, isAllDay: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="isAllDay" className="text-sm font-medium">Hela dagen</label>
              </div>

              {!editingBlocked.isAllDay && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium mb-1">Starttid</label>
                    <input
                      type="time"
                      value={editingBlocked.timeStart || '09:00'}
                      onChange={(e) => setEditingBlocked({ ...editingBlocked, timeStart: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Sluttid</label>
                    <input
                      type="time"
                      value={editingBlocked.timeEnd || '10:00'}
                      onChange={(e) => setEditingBlocked({ ...editingBlocked, timeEnd: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Anledning</label>
                <input
                  type="text"
                  value={editingBlocked.reason || ''}
                  onChange={(e) => setEditingBlocked({ ...editingBlocked, reason: e.target.value })}
                  placeholder="T.ex. Semester, Sjukdom, etc."
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 pt-2 border-t">
                <button
                  onClick={handleSaveBlockedSlotFromPopover}
                  disabled={isUpdating}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isUpdating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Spara
                </button>
                <button
                  onClick={handleDeleteBlockedSlotFromPopover}
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Ta bort
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Overlay to close blocked popover when clicking outside */}
      {showBlockedSlotDetails && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={closeBlockedPopover}
        />
      )}
    </div>
  );
}
