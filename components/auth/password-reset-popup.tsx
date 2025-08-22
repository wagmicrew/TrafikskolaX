"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Shield, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";

interface PasswordResetPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onBackToLogin?: () => void;
  initialEmail?: string;
}

export function PasswordResetPopup({ isOpen, onClose, onBackToLogin, initialEmail = "" }: PasswordResetPopupProps) {
  const { user } = useAuth();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [throttleRetry, setThrottleRetry] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setError("");
      setInfo("");
      setCode("");
      setPassword("");
      setConfirmPassword("");
      setThrottleRetry(null);
      // Keep initialEmail when reopened
      setEmail((prev) => prev || initialEmail);
    }
  }, [isOpen, initialEmail]);

  useEffect(() => {
    if (throttleRetry === null) return;
    if (throttleRetry <= 0) return;
    const timer = setInterval(() => {
      setThrottleRetry((v) => (v !== null ? Math.max(0, v - 1) : v));
    }, 1000);
    return () => clearInterval(timer);
  }, [throttleRetry]);

  const isAdminBlocked = useMemo(() => user?.role === "admin", [user]);

  const passwordOk = useMemo(() => {
    // Simple client-side checks mirroring server rules (length and mix)
    const len = password.length >= 8;
    const lower = /[a-z]/.test(password);
    const upper = /[A-Z]/.test(password);
    const num = /[0-9]/.test(password);
    const special = /[^A-Za-z0-9]/.test(password);
    return len && lower && upper && num && special && password === confirmPassword;
  }, [password, confirmPassword]);

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/forgot/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.status === 429) {
        const data = await res.json();
        const retry = typeof data?.retryAfterSec === "number" ? data.retryAfterSec : 120;
        setThrottleRetry(retry);
        setError(`För många försök. Försök igen om ${retry} sekunder.`);
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Kunde inte initiera återställning");
      }
      setStep(2);
      setInfo("Om ett konto finns med den e‑postadressen har vi skickat en kod.");
    } catch (err: any) {
      setError(err?.message || "Ett fel uppstod");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/forgot/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Verifiering misslyckades");
      if (!data?.valid) {
        setError("Felaktig kod. Försök igen.");
        return;
      }
      setStep(3);
      setInfo("Kod verifierad. Ange nytt lösenord.");
    } catch (err: any) {
      setError(err?.message || "Ett fel uppstod");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");
    if (!passwordOk) {
      setError("Lösenordet uppfyller inte kraven eller matchar inte.");
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/forgot/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, newPassword: password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Kunde inte ändra lösenord");
      setStep(4);
      setInfo("Ditt lösenord har ändrats. Du kan nu logga in.");
    } catch (err: any) {
      setError(err?.message || "Ett fel uppstod");
    } finally {
      setIsLoading(false);
    }
  };

  const renderBody = () => {
    if (isAdminBlocked) {
      return (
        <div className="space-y-6">
          <div className="flex items-center gap-3 p-3 bg-amber-500/20 border border-amber-400/30 rounded-lg text-amber-200">
            <Shield className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm">Administratörer kan inte återställa lösenord via detta gränssnitt.</span>
          </div>
          <Button onClick={onBackToLogin || onClose} className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-semibold">Tillbaka</Button>
        </div>
      );
    }

    switch (step) {
      case 1:
        return (
          <form onSubmit={handleStart} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="reset-email" className="text-white font-medium drop-shadow-sm text-sm sm:text-base">E‑postadress</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-white/60" />
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="din.email@exempel.se"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-white/10 backdrop-blur-sm border border-white/30 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/50 transition-all duration-200 rounded-lg"
                  disabled={isLoading || throttleRetry !== null && throttleRetry > 0}
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-3 p-3 bg-red-500/20 border border-red-400/30 rounded-lg text-red-300">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}
            {info && (
              <div className="flex items-center gap-3 p-3 bg-blue-500/20 border border-blue-400/30 rounded-lg text-blue-200">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">{info}</span>
              </div>
            )}
            {typeof throttleRetry === 'number' && throttleRetry > 0 && (
              <div className="text-xs text-white/80">Vänta {throttleRetry}s innan du försöker igen.</div>
            )}

            <Button type="submit" disabled={isLoading || (throttleRetry !== null && throttleRetry > 0)} className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-semibold">
              {isLoading ? "Skickar..." : "Skicka kod"}
            </Button>
          </form>
        );
      case 2:
        return (
          <form onSubmit={handleVerify} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="reset-code" className="text-white font-medium drop-shadow-sm text-sm sm:text-base">Verifieringskod</Label>
              <Input
                id="reset-code"
                type="text"
                inputMode="numeric"
                pattern="\\d{6}"
                placeholder="6‑siffrig kod"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="bg-white/10 backdrop-blur-sm border border-white/30 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/50 transition-all duration-200 rounded-lg"
                disabled={isLoading}
              />
            </div>

            {error && (
              <div className="flex items-center gap-3 p-3 bg-red-500/20 border border-red-400/30 rounded-lg text-red-300">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}
            {info && (
              <div className="flex items-center gap-3 p-3 bg-blue-500/20 border border-blue-400/30 rounded-lg text-blue-200">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">{info}</span>
              </div>
            )}

            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1 bg-white/10 text-white border-white/30 hover:bg-white/20">
                <ArrowLeft className="w-4 h-4 mr-2" /> Tillbaka
              </Button>
              <Button type="submit" disabled={isLoading || code.length < 4} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-semibold">
                {isLoading ? "Verifierar..." : "Verifiera"}
              </Button>
            </div>
          </form>
        );
      case 3:
        return (
          <form onSubmit={handleReset} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="reset-password" className="text-white font-medium drop-shadow-sm text-sm sm:text-base">Nytt lösenord</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-white/60" />
                <Input
                  id="reset-password"
                  type="password"
                  placeholder="Minst 8 tecken, stor/liten bokstav, siffra, specialtecken"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-white/10 backdrop-blur-sm border border-white/30 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/50 transition-all duration-200 rounded-lg"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reset-confirm" className="text-white font-medium drop-shadow-sm text-sm sm:text-base">Bekräfta lösenord</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-white/60" />
                <Input
                  id="reset-confirm"
                  type="password"
                  placeholder="Upprepa lösenordet"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 bg-white/10 backdrop-blur-sm border border-white/30 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/50 transition-all duration-200 rounded-lg"
                  disabled={isLoading}
                />
              </div>
            </div>

            {!passwordOk && (
              <ul className="text-xs text-white/80 list-disc pl-4 space-y-1">
                <li>Minst 8 tecken</li>
                <li>Minst en liten och en stor bokstav</li>
                <li>Minst en siffra</li>
                <li>Minst ett specialtecken</li>
                <li>Lösenorden måste matcha</li>
              </ul>
            )}

            {error && (
              <div className="flex items-center gap-3 p-3 bg-red-500/20 border border-red-400/30 rounded-lg text-red-300">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}
            {info && (
              <div className="flex items-center gap-3 p-3 bg-blue-500/20 border border-blue-400/30 rounded-lg text-blue-200">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">{info}</span>
              </div>
            )}

            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setStep(2)} className="flex-1 bg-white/10 text-white border-white/30 hover:bg-white/20">
                <ArrowLeft className="w-4 h-4 mr-2" /> Tillbaka
              </Button>
              <Button type="submit" disabled={isLoading || !passwordOk} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-semibold">
                {isLoading ? "Sparar..." : "Byt lösenord"}
              </Button>
            </div>
          </form>
        );
      case 4:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 p-3 bg-green-500/20 border border-green-400/30 rounded-lg text-green-200">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">Lösenordet är ändrat. Du kan nu logga in.</span>
            </div>
            <Button onClick={onBackToLogin || onClose} className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-semibold">Till inloggning</Button>
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="w-[95vw] max-w-[95vw] sm:w-[90vw] sm:max-w-[500px] md:max-w-[600px] lg:max-w-[700px] xl:max-w-[750px] max-h-[95vh] sm:max-h-[90vh] p-0 overflow-hidden border-0 bg-transparent shadow-none"
        aria-describedby="reset-description"
      >
        <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl sm:rounded-2xl shadow-2xl h-full max-h-[95vh] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 via-transparent to-blue-500/20 rounded-xl sm:rounded-2xl"></div>
          <div className="relative z-10 h-full overflow-y-auto">
            <div className="p-4 sm:p-6 md:p-8">
              <DialogHeader className="relative mb-4 sm:mb-6">
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-xl sm:text-2xl md:text-3xl font-bold text-white drop-shadow-lg pr-2">
                    {step === 4 ? "Klart" : "Återställ lösenord"}
                  </DialogTitle>
                </div>
                <DialogDescription id="reset-description" className="sr-only">
                  Återställ ditt lösenord via e‑postkod och nytt lösenord
                </DialogDescription>
                <div className="h-px bg-gradient-to-r from-transparent via-white/30 to-transparent mt-3 sm:mt-4"></div>
              </DialogHeader>

              {renderBody()}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
