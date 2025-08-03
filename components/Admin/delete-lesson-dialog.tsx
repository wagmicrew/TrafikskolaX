'use client';

import { useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <DialogTitle className="text-center text-xl font-semibold">
            Radera lektionstyp
          </DialogTitle>
          <DialogDescription className="text-center text-gray-600 mt-2">
            Är du säker på att du vill radera <span className="font-semibold">{lessonName}</span>?
          </DialogDescription>
        </DialogHeader>

        {hasBookings && (
          <Alert className="bg-amber-50 border-amber-200 mt-4">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              <strong>Varning!</strong> Det finns aktiva bokningar kopplade till denna lektionstyp.
              <ul className="mt-2 space-y-1 text-sm">
                <li>• Alla relaterade bokningar kommer att avbokas</li>
                <li>• Krediter kommer att återställas till berörda elever</li>
                <li>• E-postmeddelanden kommer att skickas till berörda parter</li>
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <div className="bg-gray-50 rounded-lg p-4 mt-4">
          <p className="text-sm text-gray-700">
            Denna åtgärd kan inte ångras. All data relaterad till lektionstypen kommer att raderas permanent.
          </p>
        </div>

        <DialogFooter className="mt-6 gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="flex-1"
          >
            Avbryt
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 bg-red-600 hover:bg-red-700"
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
      </DialogContent>
    </Dialog>
  );
}
