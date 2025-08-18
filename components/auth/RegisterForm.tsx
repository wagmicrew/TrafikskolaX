"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';

type RegisterFormProps = {
  onSuccess?: () => void;
  className?: string;
};

export function RegisterForm({ onSuccess, className = '' }: RegisterFormProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { redirectAfterAuth } = useAuth();
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: 'Lösenorden matchar inte',
        description: 'Vänligen bekräfta att du har skrivit samma lösenord i båda fälten.',
        variant: 'destructive',
      });
      return;
    }

    if (!termsAccepted) {
      toast({
        title: 'Godkänn villkoren',
        description: 'Du måste godkänna användarvillkoren för att skapa ett konto.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `${formData.firstName} ${formData.lastName}`.trim(),
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registreringen misslyckades');
      }

      toast({
        title: 'Registrering lyckades',
        description: 'Ditt konto har skapats. Du kan nu logga in.',
      });

      if (onSuccess) {
        onSuccess();
      }

      // Automatically log in the user or redirect to login
      if (redirectAfterAuth) {
        router.push(`/login?redirect=${encodeURIComponent(redirectAfterAuth)}`);
      } else {
        router.push('/login');
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: 'Registrering misslyckades',
        description: error instanceof Error ? error.message : 'Något gick fel vid registrering',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 ${className}`}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">Förnamn</Label>
          <Input
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            required
            disabled={isLoading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Efternamn</Label>
          <Input
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            required
            disabled={isLoading}
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="email">E-post</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="din@epost.se"
          value={formData.email}
          onChange={handleChange}
          required
          disabled={isLoading}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="phone">Telefonnummer</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          placeholder="070-123 45 67"
          value={formData.phone}
          onChange={handleChange}
          required
          disabled={isLoading}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="password">Lösenord</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="••••••••"
          value={formData.password}
          onChange={handleChange}
          required
          minLength={8}
          disabled={isLoading}
        />
        <p className="text-xs text-muted-foreground">
          Minst 8 tecken långt
        </p>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Bekräfta lösenord</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          placeholder="••••••••"
          value={formData.confirmPassword}
          onChange={handleChange}
          required
          disabled={isLoading}
        />
      </div>
      
      <div className="flex items-start space-x-2">
        <Checkbox 
          id="terms" 
          checked={termsAccepted} 
          onCheckedChange={(checked) => setTermsAccepted(checked === true)}
          disabled={isLoading}
        />
        <div className="grid gap-1.5 leading-none">
          <label
            htmlFor="terms"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Jag godkänner{' '}
            <a href="/villkor" className="text-primary hover:underline">
              användarvillkoren
            </a>{' '}
            och{' '}
            <a href="/integritet" className="text-primary hover:underline">
              integritetspolicyn
            </a>
          </label>
        </div>
      </div>
      
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Skapar konto...' : 'Skapa konto'}
      </Button>
    </form>
  );
}
