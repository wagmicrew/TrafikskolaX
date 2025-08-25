"use client";

import { useEffect, useState } from 'react';
import { OrbLoader } from '@/components/ui/orb-loader';

export default function ImpersonationBanner() {
  const [impersonating, setImpersonating] = useState(false);
  const [showRestoreLoader, setShowRestoreLoader] = useState(false);
  useEffect(() => {
    fetch('/api/auth/impersonation-status')
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then(data => setImpersonating(Boolean(data?.impersonating)))
      .catch(() => setImpersonating(false));
  }, []);

  if (!impersonating) return null;

  const handleRestore = async (e: React.MouseEvent) => {
    e.preventDefault();
    setShowRestoreLoader(true);
    const res = await fetch('/api/auth/impersonate', { method: 'DELETE' });
    try {
      const data = await res.json();
      if (data?.token) {
        try { localStorage.setItem('auth-token', data.token); } catch {}
        document.cookie = `auth-token=${data.token}; path=/; max-age=604800`;
      } else {
        // Fallback: if we saved admin backup in localStorage at impersonation time
        const backup = localStorage.getItem('admin-session-token');
        if (backup) {
          try { localStorage.setItem('auth-token', backup); } catch {}
          document.cookie = `auth-token=${backup}; path=/; max-age=604800`;
        } else {
          try { localStorage.removeItem('auth-token'); } catch {}
          document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
        }
      }
    } catch {}
    window.location.href = '/dashboard/admin';
  };

  return (
    <>
      <OrbLoader isVisible={showRestoreLoader} text="Återgår till Admin..." />
      <div className="fixed top-0 inset-x-0 z-[100] bg-yellow-500 text-black px-4 py-2 text-sm font-semibold flex items-center justify-between">
        <span>Du använder en tillfällig användarsession</span>
        <a href="#" onClick={handleRestore} className="underline">Återgå till admin</a>
      </div>
    </>
  );
}


