import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface DeleteBookingConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
}

const DeleteBookingConfirmation: React.FC<DeleteBookingConfirmationProps> = ({
  isOpen,
  onClose,
  bookingId,
}) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState('');

  const handleDelete = async () => {
    if (!reason.trim()) {
      toast.error('Vänligen ange en anledning för avbokningen');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete booking');
      }

      toast.success('Bokningen har tagits bort');
      router.push('/dashboard/admin/bookings');
    } catch (error) {
      console.error('Error deleting booking:', error);
      toast.error('Kunde inte ta bort bokningen');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Bekräfta borttagning</h2>
        <p className="text-gray-600 mb-4">
          Är du säker på att du vill ta bort denna bokning? Denna åtgärd kan inte ångras.
        </p>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Anledning för avbokning <span className="text-red-500">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            rows={3}
            placeholder="Ange anledning..."
            disabled={loading}
          />
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
          >
            Avbryt
          </button>
          <button
            onClick={handleDelete}
            disabled={loading || !reason.trim()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Tar bort...' : 'Ta bort bokning'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteBookingConfirmation;
