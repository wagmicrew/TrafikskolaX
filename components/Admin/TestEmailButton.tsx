'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Mail, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface TestEmailButtonProps {
  userId?: string;
  userEmail?: string;
  userName?: string;
  variant?: 'default' | 'secondary' | 'outline';
  size?: 'sm' | 'lg';
}

export default function TestEmailButton({ 
  userId, 
  userEmail, 
  userName,
  variant = 'outline',
  size = 'sm'
}: TestEmailButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [lastSentStatus, setLastSentStatus] = useState<'success' | 'error' | null>(null);

  const handleTestEmail = async () => {
    if (!userId && !userEmail) {
      toast.error('No user ID or email provided');
      return;
    }

    setIsLoading(true);
    setLastSentStatus(null);

    try {
      const response = await fetch('/api/admin/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          email: userEmail,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send test email');
      }

      setLastSentStatus('success');
      toast.success(`Test email sent successfully to ${userEmail || 'user'}`, {
        description: userName ? `Sent to ${userName}` : undefined,
      });

    } catch (error) {
      console.error('Error sending test email:', error);
      setLastSentStatus('error');
      toast.error('Failed to send test email', {
        description: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    } finally {
      setIsLoading(false);
      // Reset status after 3 seconds
      setTimeout(() => setLastSentStatus(null), 3000);
    }
  };

  const getButtonIcon = () => {
    if (isLoading) {
      return <Loader2 className="h-4 w-4 animate-spin" />;
    }
    if (lastSentStatus === 'success') {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    if (lastSentStatus === 'error') {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
    return <Mail className="h-4 w-4" />;
  };

  const getButtonText = () => {
    if (isLoading) return 'Sending...';
    if (lastSentStatus === 'success') return 'Sent!';
    if (lastSentStatus === 'error') return 'Failed';
    return 'Test Email';
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleTestEmail}
      disabled={isLoading}
      className="gap-2"
      title={`Send test email to ${userEmail || 'user'}`}
    >
      {getButtonIcon()}
      {getButtonText()}
    </Button>
  );
}
