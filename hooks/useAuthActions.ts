"use client";

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export function useAuthActions() {
  const { openAuthPopup } = useAuth();
  const router = useRouter();

  const handleLogin = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    openAuthPopup('login');
  };

  const handleRegister = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    openAuthPopup('register');
  };

  const handleLogout = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (response.ok) {
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Logout error:', error);
      window.location.href = '/';
    }
  };

  return {
    handleLogin,
    handleRegister,
    handleLogout,
  };
}
