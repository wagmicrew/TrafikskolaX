"use client";

import React from "react";
import { AuthProvider } from "@/lib/hooks/useAuth";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { Toaster } from "react-hot-toast";
import { CookieConsent } from "@/components/CookieConsent";
import ImpersonationBanner from "@/components/ImpersonationBanner";

export function ClientRoot({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ImpersonationBanner />
      <Navigation />
      <main>{children}</main>
      <Toaster />
      <CookieConsent />
      <Footer />
    </AuthProvider>
  );
}