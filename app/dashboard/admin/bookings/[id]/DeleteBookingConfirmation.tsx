import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { X, AlertTriangle } from 'lucide-react';

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
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl max-w-md w-full mx-4">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-red-400" />
              <h2 className="text-xl font-bold text-white">Bekräfta borttagning</h2>
            </div>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <p className="text-slate-300 mb-6">
            Är du säker på att du vill ta bort denna bokning? Denna åtgärd kan inte ångras.
          </p>
          
          <div className="mb-6">
            <label className="block text-white font-medium mb-2">
              Anledning för avbokning <span className="text-red-400">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 bg-white/5 border border-white/20 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 placeholder:text-white/50"
              rows={3}
              placeholder="Ange anledning..."
              disabled={loading}
            />
          </div>

          {/* Footer */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-white border border-white/20 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
            >
              Avbryt
            </button>
            <button
              onClick={handleDelete}
              disabled={loading || !reason.trim()}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Tar bort...' : 'Ta bort bokning'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteBookingConfirmation;
