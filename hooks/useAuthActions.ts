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
    
    // Use the logout function from useAuth which already handles the API call
    logout();
    window.location.href = '/';
  };

  return {
    handleLogin,
    handleRegister,
    handleLogout,
  };
}
