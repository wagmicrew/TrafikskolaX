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
  Ban
} from "lucide-react";

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
      const response = await fetch('/api/admin/slots');
      const data = await response.json();
      setSlots(data.slotSettings || []);
    } catch (error) {
      console.error('Error fetching slots:', error);
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
      const url = confirmed ? '/api/admin/slots?confirmed=true' : '/api/admin/slots';
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slotForm),
      });

      const data = await response.json();

      if (response.status === 422 && data.requiresConfirmation) {
        setWarning(data.warning);
        setConfirmAction(() => () => handleCreateSlot(true));
        return;
      }

      if (response.ok) {
        fetchSlots();
        setShowAddSlot(false);
        resetSlotForm();
        alert('Tidslucka skapad framgångsrikt!');
      } else {
        alert(data.error || 'Fel vid skapande av tidslucka');
      }
    } catch (error) {
      alert('Fel vid skapande av tidslucka');
    }
  };

  const handleUpdateSlot = async (slot: SlotSetting) => {
    try {
      const response = await fetch('/api/admin/slots', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slot),
      });

      if (response.ok) {
        fetchSlots();
        setEditingSlot(null);
        alert('Tidslucka uppdaterad framgångsrikt!');
      } else {
        const data = await response.json();
        alert(data.error || 'Fel vid uppdatering av tidslucka');
      }
    } catch (error) {
      alert('Fel vid uppdatering av tidslucka');
    }
  };

  const handleDeleteSlot = async (id: string) => {
    if (!confirm('Är du säker på att du vill ta bort denna tidslucka?')) return;

    try {
      const response = await fetch(`/api/admin/slots?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchSlots();
        alert('Tidslucka borttagen framgångsrikt!');
      } else {
        alert('Fel vid borttagning av tidslucka');
      }
    } catch (error) {
      alert('Fel vid borttagning av tidslucka');
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
        alert('Blockerad tid skapad framgångsrikt!');
      } else {
        const data = await response.json();
        alert(data.error || 'Fel vid skapande av blockerad tid');
      }
    } catch (error) {
      alert('Fel vid skapande av blockerad tid');
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
        alert('Blockerad tid uppdaterad framgångsrikt!');
      } else {
        const data = await response.json();
        alert(data.error || 'Fel vid uppdatering av blockerad tid');
      }
    } catch (error) {
      alert('Fel vid uppdatering av blockerad tid');
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
        alert('Blockering borttagen framgångsrikt!');
      } else {
        alert('Fel vid borttagning av blockering');
      }
    } catch (error) {
      alert('Fel vid borttagning av blockering');
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
          {activeTab === 'slots' && (
            <div>
              {/* Slot Management Header */}
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Hantera Tidsluckor</h2>
                <button
                  onClick={() => setShowAddSlot(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Lägg till tidslucka
                </button>
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

              {/* Slots List */}
              <div className="space-y-2">
                {slots.map((slot) => (
                  <div key={slot.id} className="border rounded-lg p-4 flex items-center justify-between">
                    {editingSlot?.id === slot.id ? (
                      <div className="flex-1 grid grid-cols-4 gap-4">
                        <select
                          value={editingSlot.dayOfWeek}
                          onChange={(e) => setEditingSlot({ ...editingSlot, dayOfWeek: parseInt(e.target.value) })}
                          className="border rounded px-2 py-1"
                        >
                          {DAYS_OF_WEEK.map((day, index) => (
                            <option key={index} value={index}>{day}</option>
                          ))}
                        </select>
                        <input
                          type="time"
                          value={editingSlot.timeStart}
                          onChange={(e) => setEditingSlot({ ...editingSlot, timeStart: e.target.value })}
                          className="border rounded px-2 py-1"
                        />
                        <input
                          type="time"
                          value={editingSlot.timeEnd}
                          onChange={(e) => setEditingSlot({ ...editingSlot, timeEnd: e.target.value })}
                          className="border rounded px-2 py-1"
                        />
                        <input
                          type="number"
                          value={editingSlot.adminMinutes}
                          onChange={(e) => setEditingSlot({ ...editingSlot, adminMinutes: parseInt(e.target.value) })}
                          className="border rounded px-2 py-1"
                        />
                      </div>
                    ) : (
                      <div className="flex-1">
                        <span className="font-medium">{DAYS_OF_WEEK[slot.dayOfWeek]}</span>
                        <span className="ml-4">{slot.timeStart} - {slot.timeEnd}</span>
                        <span className="ml-4 text-sm text-gray-500">({slot.adminMinutes} min admin)</span>
                        {!slot.isActive && <span className="ml-2 text-red-500 text-sm">(Inaktiv)</span>}
                      </div>
                    )}
                    <div className="flex gap-2">
                      {editingSlot?.id === slot.id ? (
                        <>
                          <button
                            onClick={() => handleUpdateSlot(editingSlot)}
                            className="bg-green-600 text-white p-2 rounded hover:bg-green-700"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingSlot(null)}
                            className="bg-gray-300 p-2 rounded hover:bg-gray-400"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => setEditingSlot(slot)}
                            className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteSlot(slot.id)}
                            className="bg-red-600 text-white p-2 rounded hover:bg-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

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

              {/* Blocked Slots List */}
              <div className="space-y-2">
                {blockedSlots.map((blocked) => (
                  <div key={blocked.id} className="border rounded-lg p-4 flex items-center justify-between">
                    {editingBlocked?.id === blocked.id ? (
                      <div className="flex-1 grid grid-cols-4 gap-4">
                        <input
                          type="date"
                          value={editingBlocked.date}
                          onChange={(e) => setEditingBlocked({ ...editingBlocked, date: e.target.value })}
                          className="border rounded px-2 py-1"
                        />
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={editingBlocked.isAllDay}
                            onChange={(e) => setEditingBlocked({ ...editingBlocked, isAllDay: e.target.checked })}
                            className="mr-2"
                          />
                          Hela dagen
                        </label>
                        {!editingBlocked.isAllDay && (
                          <>
                            <input
                              type="time"
                              value={editingBlocked.timeStart || ''}
                              onChange={(e) => setEditingBlocked({ ...editingBlocked, timeStart: e.target.value })}
                              className="border rounded px-2 py-1"
                            />
                            <input
                              type="time"
                              value={editingBlocked.timeEnd || ''}
                              onChange={(e) => setEditingBlocked({ ...editingBlocked, timeEnd: e.target.value })}
                              className="border rounded px-2 py-1"
                            />
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="flex-1">
                        <span className="font-medium">{blocked.date}</span>
                        {blocked.isAllDay ? (
                          <span className="ml-4 text-red-600">Hela dagen</span>
                        ) : (
                          <span className="ml-4">{blocked.timeStart} - {blocked.timeEnd}</span>
                        )}
                        {blocked.reason && <span className="ml-4 text-sm text-gray-500">({blocked.reason})</span>}
                      </div>
                    )}
                    <div className="flex gap-2">
                      {editingBlocked?.id === blocked.id ? (
                        <>
                          <button
                            onClick={() => handleUpdateBlockedSlot(editingBlocked)}
                            className="bg-green-600 text-white p-2 rounded hover:bg-green-700"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingBlocked(null)}
                            className="bg-gray-300 p-2 rounded hover:bg-gray-400"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => setEditingBlocked(blocked)}
                            className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteBlockedSlot(blocked.id)}
                            className="bg-red-600 text-white p-2 rounded hover:bg-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
