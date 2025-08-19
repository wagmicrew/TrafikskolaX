'use client';

import { useState } from 'react';
import { AlertTriangle, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface DeleteLessonDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  lessonName: string;
  hasBookings: boolean;
}

export function DeleteLessonDialog({
  isOpen,
  onClose,
  onConfirm,
  lessonName,
  hasBookings,
}: DeleteLessonDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-lg p-0 overflow-hidden border-0 bg-transparent shadow-none">
        {/* Glassmorphism style */}
        <div className="dialog-glassmorphism relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 via-transparent to-blue-500/20 rounded-xl"></div>
          <div className="relative z-10 p-6 sm:p-8">
            <DialogHeader>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                  <DialogTitle className="text-xl font-bold text-white drop-shadow-lg">
                    Radera lektionstyp
                  </DialogTitle>
                </div>

              </div>
              <DialogDescription className="text-slate-300 mt-2">
                Är du säker på att du vill radera <span className="font-semibold text-white">{lessonName}</span>?
              </DialogDescription>
            </DialogHeader>

            {hasBookings && (
              <Alert className="bg-amber-500/20 border-amber-500/30 mt-4">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                <AlertDescription className="text-amber-200">
                  <strong>Varning!</strong> Det finns aktiva bokningar kopplade till denna lektionstyp.
                  <ul className="mt-2 space-y-1 text-sm">
                    <li>• Alla relaterade bokningar kommer att avbokas</li>
                    <li>• Krediter kommer att återställas till berörda elever</li>
                    <li>• E-postmeddelanden kommer att skickas till berörda parter</li>
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <div className="bg-white/10 border border-white/20 rounded-lg p-4 mt-4">
              <p className="text-sm text-slate-300">
                Denna åtgärd kan inte ångras. All data relaterad till lektionstypen kommer att raderas permanent.
              </p>
            </div>

            {/* Footer */}
            <DialogFooter className="mt-6 gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={loading}
                className="flex-1 text-white border-white/20 hover:bg-white/10"
              >
                Avbryt
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirm}
                disabled={loading}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Raderar...
                  </>
                ) : (
                  'Ja, radera lektionstyp'
                )}
              </Button>
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
