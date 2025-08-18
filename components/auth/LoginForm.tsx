"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

type LoginFormProps = {
  onSuccess?: () => void;
  className?: string;
};

export function LoginForm({ onSuccess, className = '' }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Inloggningen misslyckades');
      }

      // Use the old auth system's login method
      if (data.token) {
        login(data.token);
      }

      toast({
        title: 'Inloggning lyckades',
        description: 'Du är nu inloggad',
      });

      if (onSuccess) {
        onSuccess();
      }

      // Default redirect
      router.push('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: 'Inloggning misslyckades',
        description: error instanceof Error ? error.message : 'Något gick fel vid inloggning',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 ${className}`}>
      <div className="space-y-2">
        <Label htmlFor="email">E-post</Label>
        <Input
          id="email"
          type="email"
          placeholder="din@epost.se"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Lösenord</Label>
          <button
            type="button"
            className="text-sm font-medium text-primary hover:underline"
            onClick={() => {
              // Handle forgot password
              alert('Glömt lösenord funktion kommer snart');
            }}
          >
            Glömt lösenord?
          </button>
        </div>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Loggar in...' : 'Logga in'}
      </Button>
    </form>
  );
}
