"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Loader2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';

export function ResetSiteButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const { logout } = useAuth();

  const handleReset = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/reset-site', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to reset site');
      }

      // Generate PDF of the reset actions
      const pdfContent = {
        title: 'Site Reset Report',
        date: new Date().toISOString(),
        actions: [
          'All bookings have been deleted',
          'All users except admin have been removed',
          'User feedback and handledar bookings have been cleared',
          'Packages and lesson types have been reset to defaults',
          'New admin password has been generated and emailed',
        ],
        newAdminEmail: 'admin@dintrafikskolahlm.se',
        resetBy: 'System Administrator',
      };

      // Create and download PDF
      const blob = new Blob([JSON.stringify(pdfContent, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `site-reset-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Site Reset Complete',
        description: 'The site has been reset to factory settings. You will be logged out.',
        variant: 'default' as const,
      });

      // Sign out the current user
      await logout();
      router.push('/login');
      
    } catch (error) {
      console.error('Error resetting site:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to reset site',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setIsOpen(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" className="w-full">
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <AlertTriangle className="mr-2 h-4 w-4" />
          )}
          Reset Site to Factory Settings
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <p className="font-semibold text-destructive">
              This action cannot be undone. This will permanently:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Delete all bookings and user data</li>
              <li>Remove all users except the admin account</li>
              <li>Reset packages and lesson types to defaults</li>
              <li>Generate a new admin password</li>
              <li>Log out all users</li>
            </ul>
            <p className="pt-2">
              A new admin password will be generated and sent to johaswe@gmail.com.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleReset} 
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Resetting...
              </>
            ) : (
              'Reset Site'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
