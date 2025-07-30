import React, { useState } from 'react';

interface MoveBookingModalProps {
  onClose: () => void;
  bookingId: string;
}

const MoveBookingModal: React.FC<MoveBookingModalProps> = ({ onClose, bookingId }) => {
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);

  const fetchAvailableSlots = async (date: string) => {
    try {
      // Fetch available slots API call
      const response = await fetch(`/api/admin/slots?date=${date}`);
      const data = await response.json();
      setAvailableSlots(data.slots);
    } catch (error) {
      console.error('Failed to fetch available slots', error);
    }
  };

  const handleMove = async () => {
    try {
      // Update booking with new date and time
      await fetch(`/api/admin/bookings/${bookingId}/move`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newDate, newTime }),
      });
      alert('Bokningen har flyttats');
      onClose();
    } catch (error) {
      console.error('Failed to move booking', error);
      alert('Något gick fel vid förflyttning. Försök igen.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg w-80 p-6">
        <h3 className="text-lg font-medium mb-4">Flytta Bokning</h3>
        <label className="block text-sm font-medium text-gray-700">
          Välj Nytt Datum
          <input
            type="date"
            value={newDate}
            onChange={(e) => {
              setNewDate(e.target.value);
              fetchAvailableSlots(e.target.value);
            }}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
          />
        </label>
        {availableSlots.length > 0 && (
          <label className="block mt-4 text-sm font-medium text-gray-700">
            Välj Ny Tid
            <select
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            >
              <option value="">Välj tid</option>
              {availableSlots.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
          </label>
        )}
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="mr-3 inline-flex justify-center rounded-md border border-transparent bg-gray-300 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-400 focus:outline-none focus:ring focus:ring-gray-200"
          >
            Avbryt
          </button>
          <button
            type="button"
            onClick={handleMove}
            className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring focus:ring-blue-200"
          >
            Flytta
          </button>
        </div>
      </div>
    </div>
  );
};

export default MoveBookingModal;
