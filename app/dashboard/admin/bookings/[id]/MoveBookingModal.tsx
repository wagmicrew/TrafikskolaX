import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Calendar, Clock, CheckCircle, X } from 'lucide-react';

interface MoveBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
}

const MoveBookingModal: React.FC<MoveBookingModalProps> = ({
  isOpen,
  onClose,
  bookingId,
}) => {
  const [selectedDate, setSelectedDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    if (selectedDate) {
      fetchAvailableSlots();
    }
  }, [selectedDate]);

  const fetchAvailableSlots = async () => {
    setLoadingSlots(true);
    try {
      const response = await fetch(
        `/api/bookings/available-slots?date=${selectedDate}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch available slots');
      }
      const data = await response.json();
      setAvailableSlots(data.slots || []);
    } catch (error) {
      console.error('Error fetching slots:', error);
      toast.error('Kunde inte hämta tillgängliga tider');
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleMove = async () => {
    if (!selectedSlot) {
      toast.error('Vänligen välj en ny tid');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}/move`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scheduledDate: selectedDate,
          startTime: selectedSlot.startTime,
          endTime: selectedSlot.endTime,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to move booking');
      }

      toast.success('Bokningen har flyttats');
      window.location.reload();
    } catch (error) {
      console.error('Error moving booking:', error);
      toast.error('Kunde inte flytta bokningen');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Calendar className="w-6 h-6 text-sky-400" />
              <h2 className="text-xl font-bold text-white">Flytta bokning</h2>
            </div>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-white font-medium mb-2">
                Välj nytt datum
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 bg-white/5 border border-white/20 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              />
            </div>

            {selectedDate && (
              <div>
                <label className="block text-white font-medium mb-2">
                  Tillgängliga tider
                </label>
                {loadingSlots ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-sky-400"></div>
                    <p className="mt-2 text-slate-300">Hämtar tillgängliga tider...</p>
                  </div>
                ) : availableSlots.length === 0 ? (
                  <p className="text-slate-300 text-center py-8">
                    Inga tillgängliga tider för valt datum
                  </p>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {availableSlots.map((slot, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedSlot(slot)}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          selectedSlot?.startTime === slot.startTime
                            ? 'border-sky-500 bg-sky-500/20 text-white'
                            : 'border-white/20 hover:border-white/40 text-white bg-white/5 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center justify-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span className="font-medium">
                            {slot.startTime} - {slot.endTime}
                          </span>
                        </div>
                        {selectedSlot?.startTime === slot.startTime && (
                          <CheckCircle className="w-4 h-4 text-sky-400 mx-auto mt-1" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {selectedSlot && (
              <div className="bg-sky-500/20 border border-sky-500/30 rounded-lg p-4">
                <p className="text-sm font-medium text-white">Ny bokningstid:</p>
                <p className="text-lg font-semibold text-white">
                  {selectedDate && format(new Date(selectedDate), 'EEEE d MMMM yyyy', { locale: sv })}
                </p>
                <p className="text-lg text-slate-200">
                  Kl. {selectedSlot.startTime} - {selectedSlot.endTime}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-3 justify-end mt-6">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-white border border-white/20 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
            >
              Avbryt
            </button>
            <button
              onClick={handleMove}
              disabled={loading || !selectedSlot}
              className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Flyttar...' : 'Flytta bokning'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MoveBookingModal;
