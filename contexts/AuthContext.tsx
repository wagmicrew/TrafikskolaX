"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

type AuthMode = 'login' | 'register';
type AuthContextType = {
  isOpen: boolean;
  mode: AuthMode;
  openAuthPopup: (mode?: AuthMode) => void;
  closeAuthPopup: () => void;
  redirectAfterAuth?: string;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<AuthMode>('login');
  const [redirectAfterAuth, setRedirectAfterAuth] = useState<string | undefined>();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Handle auth redirects from protected routes
  useEffect(() => {
    if (pathname === '/login' || pathname === '/registrering') {
      const redirect = searchParams?.get('redirect');
      openAuthPopup(pathname === '/login' ? 'login' : 'register');
      
      if (redirect) {
        setRedirectAfterAuth(redirect);
      }
      
      // Clean up the URL without causing a navigation
      const newUrl = new URL(window.location.href);
      newUrl.pathname = '';
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, [pathname, searchParams]);

  const openAuthPopup = (mode: AuthMode = 'login') => {
    setMode(mode);
    setIsOpen(true);
  };

  const closeAuthPopup = () => {
    setIsOpen(false);
    // Small delay to allow animations to complete
    setTimeout(() => {
      setMode('login');
      setRedirectAfterAuth(undefined);
    }, 300);
  };

  const value = {
    isOpen,
    mode,
    openAuthPopup,
    closeAuthPopup,
    redirectAfterAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
