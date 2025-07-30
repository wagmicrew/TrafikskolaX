import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Calendar, Clock, CheckCircle } from 'lucide-react';

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Flytta bokning
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Välj nytt datum
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {selectedDate && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Tillgängliga tider
              </label>
              {loadingSlots ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-gray-600">Hämtar tillgängliga tider...</p>
                </div>
              ) : availableSlots.length === 0 ? (
                <p className="text-gray-600 text-center py-8">
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
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span className="font-medium">
                          {slot.startTime} - {slot.endTime}
                        </span>
                      </div>
                      {selectedSlot?.startTime === slot.startTime && (
                        <CheckCircle className="w-4 h-4 text-blue-600 mx-auto mt-1" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {selectedSlot && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-medium">Ny bokningstid:</p>
              <p className="text-lg font-semibold">
                {selectedDate && format(new Date(selectedDate), 'EEEE d MMMM yyyy', { locale: sv })}
              </p>
              <p className="text-lg">
                Kl. {selectedSlot.startTime} - {selectedSlot.endTime}
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-end mt-6">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
          >
            Avbryt
          </button>
          <button
            onClick={handleMove}
            disabled={loading || !selectedSlot}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Flyttar...' : 'Flytta bokning'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MoveBookingModal;
