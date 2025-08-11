"use client";

import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { CheckCircle, XCircle, AlertCircle, CreditCard, Save, Settings } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface StatusUpdatePanelProps {
  booking: any;
  onStatusUpdate?: () => void;
}

const StatusUpdatePanel: React.FC<StatusUpdatePanelProps> = ({ booking, onStatusUpdate }) => {
  const [currentStatus, setCurrentStatus] = useState(booking.status || 'pending');
  const [currentPaymentStatus, setCurrentPaymentStatus] = useState(booking.paymentStatus || 'unpaid');
  const [isUpdating, setIsUpdating] = useState(false);

  const statusOptions = [
    { value: 'pending', label: 'Väntande', color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
    { value: 'confirmed', label: 'Bekräftad', color: 'bg-green-100 text-green-800', icon: CheckCircle },
    { value: 'cancelled', label: 'Avbokad', color: 'bg-red-100 text-red-800', icon: XCircle },
    { value: 'on_hold', label: 'Pausad', color: 'bg-gray-100 text-gray-800', icon: AlertCircle },
  ];

  const paymentStatusOptions = [
    { value: 'unpaid', label: 'Ej betald', color: 'bg-red-100 text-red-800' },
    { value: 'paid', label: 'Betald', color: 'bg-green-100 text-green-800' },
    { value: 'partial', label: 'Delvis betald', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'pending', label: 'Väntar betalning', color: 'bg-blue-100 text-blue-800' },
    { value: 'refunded', label: 'Återbetald', color: 'bg-purple-100 text-purple-800' },
  ];

  const handleStatusUpdate = async () => {
    if (currentStatus === booking.status && currentPaymentStatus === booking.paymentStatus) {
      toast.error('Ingen ändring att spara');
      return;
    }

    setIsUpdating(true);
    const loadingToast = toast.loading('Uppdaterar status...');

    try {
      const response = await fetch(`/api/admin/bookings/${booking.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: currentStatus,
          paymentStatus: currentPaymentStatus,
        }),
      });

      if (response.ok) {
        toast.success('Status uppdaterad framgångsrikt!', {
          id: loadingToast,
        });
        onStatusUpdate?.();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Fel vid uppdatering av status', {
          id: loadingToast,
        });
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Fel vid uppdatering av status', {
        id: loadingToast,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusDisplay = (status: string) => {
    const statusOption = statusOptions.find(opt => opt.value === status);
    if (!statusOption) return null;

    const Icon = statusOption.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${statusOption.color}`}>
        <Icon className="w-4 h-4" />
        {statusOption.label}
      </span>
    );
  };

  const getPaymentStatusDisplay = (paymentStatus: string) => {
    const paymentOption = paymentStatusOptions.find(opt => opt.value === paymentStatus);
    if (!paymentOption) return null;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${paymentOption.color}`}>
        <CreditCard className="w-4 h-4" />
        {paymentOption.label}
      </span>
    );
  };

  const hasChanges = currentStatus !== booking.status || currentPaymentStatus !== booking.paymentStatus;

  return (
    <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-6 text-white relative z-20">
      <div className="flex items-center gap-2 mb-4">
        <Settings className="w-5 h-5 text-sky-300" />
        <h3 className="text-lg font-extrabold">Status</h3>
      </div>

      <div className="space-y-6">
        {/* Current Status Display */}
        <div className="flex flex-wrap gap-3">
          {getStatusDisplay(booking.status)}
          {getPaymentStatusDisplay(booking.paymentStatus)}
          {booking.isCompleted && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              <CheckCircle className="w-4 h-4" />
              Genomförd
            </span>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Booking Status */}
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">
              Bokningsstatus
            </label>
            <Select value={currentStatus} onValueChange={(v) => setCurrentStatus(v)}>
              <SelectTrigger className="w-full rounded-md bg-white/10 border border-white/20 text-white shadow-sm focus:ring-2 focus:ring-sky-400">
                <SelectValue placeholder="Välj status" />
              </SelectTrigger>
              <SelectContent className="z-[60] bg-white/10 backdrop-blur-md border border-white/20 text-white">
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value} className="hover:bg-white/20 focus:bg-white/20">
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {currentStatus !== booking.status && (
              <p className="mt-1 text-sm text-sky-300">
                Ändras från: {statusOptions.find(opt => opt.value === booking.status)?.label}
              </p>
            )}
          </div>

          {/* Payment Status */}
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">
              Betalningsstatus
            </label>
            <Select value={currentPaymentStatus} onValueChange={(v) => setCurrentPaymentStatus(v)}>
              <SelectTrigger className="w-full rounded-md bg-white/10 border border-white/20 text-white shadow-sm focus:ring-2 focus:ring-sky-400">
                <SelectValue placeholder="Välj betalningsstatus" />
              </SelectTrigger>
              <SelectContent className="z-[60] bg-white/10 backdrop-blur-md border border-white/20 text-white">
                {paymentStatusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value} className="hover:bg-white/20 focus:bg-white/20">
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {currentPaymentStatus !== booking.paymentStatus && (
              <p className="mt-1 text-sm text-sky-300">
                Ändras från: {paymentStatusOptions.find(opt => opt.value === booking.paymentStatus)?.label}
              </p>
            )}
          </div>
        </div>

        {/* Update Button */}
        {hasChanges && (
          <div className="flex justify-end pt-4 border-t border-white/10">
            <button
              onClick={handleStatusUpdate}
              disabled={isUpdating}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                isUpdating 
                  ? 'bg-white/20 text-white/50 cursor-not-allowed'
                  : 'bg-sky-600 text-white hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400'
              }`}
            >
              <Save className="w-4 h-4" />
              {isUpdating ? 'Uppdaterar...' : 'Spara ändringar'}
            </button>
          </div>
        )}

        {/* Status History Info */}
        <div className="text-xs text-slate-300 space-y-1">
          <p>Skapad: <span className="text-white">{new Date(booking.createdAt).toLocaleString('sv-SE')}</span></p>
          <p>Senast uppdaterad: <span className="text-white">{new Date(booking.updatedAt).toLocaleString('sv-SE')}</span></p>
          {booking.completedAt && (
            <p>Genomförd: <span className="text-white">{new Date(booking.completedAt).toLocaleString('sv-SE')}</span></p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatusUpdatePanel;
