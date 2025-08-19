"use client";

import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';

export function useAuthActions() {
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogin = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    router.push('/inloggning');
  };

  const handleRegister = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    router.push('/inloggning?tab=register');
  };

  const handleLogout = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (response.ok) {
        logout();
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Logout error:', error);
      logout();
      window.location.href = '/';
    }
  };

  return {
    handleLogin,
    handleRegister,
    handleLogout,
  };
}
