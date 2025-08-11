"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FaCheck, FaCreditCard, FaMobileAlt, FaPercent, FaSpinner, FaStar } from "react-icons/fa";
import { cn } from "@/lib/utils";

type PackageItem = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  priceStudent?: number | null;
  salePrice?: number | null;
  isActive: boolean;
  features: string[];
  credits: number;
  image: string;
  isPopular: boolean;
};

type StartPaymentArgs =
  | { method: "swish"; purchaseId: string; amount: number; message: string }
  | { method: "qliro"; purchaseId: string; amount: number; checkoutUrl: string };

interface PackageStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: "student" | "teacher" | "admin";
  onStartPayment: (args: StartPaymentArgs) => void;
  hasActivePackage?: boolean;
}

export default function PackageStoreModal({ isOpen, onClose, userRole, onStartPayment, hasActivePackage = false }: PackageStoreModalProps) {
  const [loading, setLoading] = useState<boolean>(true);
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyPurchaseId, setBusyPurchaseId] = useState<string | null>(null);
  const [acknowledgeActiveWarning, setAcknowledgeActiveWarning] = useState<boolean>(false);

  const [qliroAvailable, setQliroAvailable] = useState<boolean>(true);
  const [qliroStatusMessage, setQliroStatusMessage] = useState<string>("");
  const [qliroStatusLoading, setQliroStatusLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!isOpen) return;

    let isCancelled = false;
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [pkgRes, qliroRes] = await Promise.all([
          fetch("/api/packages/with-contents"),
          fetch("/api/payments/qliro/status"),
        ]);

        if (!pkgRes.ok) throw new Error("Kunde inte hämta paket");
        const pkgJson = await pkgRes.json();
        const items: PackageItem[] = pkgJson.packages || [];

        if (!isCancelled) {
          setPackages(items);
        }

        if (qliroRes.ok) {
          const qliroJson = await qliroRes.json();
          setQliroAvailable(Boolean(qliroJson.available));
          setQliroStatusMessage(qliroJson.message || "");
        } else {
          setQliroAvailable(false);
          setQliroStatusMessage("Kunde inte kontrollera Qliro-status");
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Något gick fel");
      } finally {
        if (!isCancelled) {
          setLoading(false);
          setQliroStatusLoading(false);
        }
      }
    };

    fetchData();
    return () => {
      isCancelled = true;
    };
  }, [isOpen]);

  const getEffectivePrice = (pkg: PackageItem): number => {
    if (pkg.salePrice != null) return Number(pkg.salePrice);
    if (userRole === "student" && pkg.priceStudent != null) return Number(pkg.priceStudent);
    return Number(pkg.price);
  };

  const handlePurchase = async (pkg: PackageItem, method: "swish" | "qliro") => {
    try {
      if (hasActivePackage && !acknowledgeActiveWarning) {
        // Require explicit acknowledgment before allowing purchase
        setError("Du har redan ett aktivt paket. Bekräfta att du vill fortsätta för att köpa fler.");
        return;
      }
      if (method === "qliro" && !qliroAvailable) return;
      setBusyPurchaseId(pkg.id);

      const response = await fetch("/api/packages/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId: pkg.id, paymentMethod: method }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Köpet kunde inte skapas");

      const amount = getEffectivePrice(pkg);

      // Close selector first
      onClose();

      if (method === "swish") {
        onStartPayment({
          method: "swish",
          purchaseId: data.purchaseId,
          amount,
          message: `Paket ${pkg.name} - Order ${data.purchaseId}`,
        });
      } else {
        onStartPayment({
          method: "qliro",
          purchaseId: data.purchaseId,
          amount,
          checkoutUrl: data.checkoutUrl,
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Något gick fel vid betalning");
    } finally {
      setBusyPurchaseId(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-[1000px] p-0 bg-transparent border-0 shadow-none">
        <div className="relative bg-white/10 backdrop-blur-2xl border border-white/20 rounded-2xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-slate-800/80" />
          <div className="relative p-6">
            <DialogHeader>
              <DialogTitle className="text-white text-2xl font-extrabold">Välj paket</DialogTitle>
            </DialogHeader>

            {/* Payment methods explainer */}
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-white/90 text-sm">
                <div className="flex items-center gap-2 font-semibold text-white">
                  <FaMobileAlt className="text-sky-300" /> Swish
                </div>
                <p className="mt-1 text-white/80">Snabb betalning med QR-kod eller app. Vi verifierar betalningen så snart som möjligt.</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-white/90 text-sm">
                <div className="flex items-center gap-2 font-semibold text-white">
                  <FaCreditCard className="text-indigo-300" /> Qliro
                  {qliroStatusLoading && <FaSpinner className="ml-1 animate-spin" />}
                </div>
                <p className="mt-1 text-white/80">Kassa genom Qliro i nytt fönster. {(!qliroStatusLoading && !qliroAvailable) ? <span className="text-amber-300">({qliroStatusMessage || 'Otillgänglig just nu'})</span> : null}</p>
              </div>
            </div>

            {/* Active package warning and acknowledgement */}
            {hasActivePackage && (
              <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-amber-100">
                <div className="font-semibold">Du har redan ett aktivt paket</div>
                <p className="text-sm mt-1">Att köpa fler paket lägger till ytterligare krediter i ditt konto. Fortsätt endast om du vill köpa mer.</p>
                <label className="mt-2 flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={acknowledgeActiveWarning}
                    onChange={(e) => setAcknowledgeActiveWarning(e.target.checked)}
                    className="h-4 w-4 rounded border-white/20 bg-transparent"
                  />
                  <span>Jag förstår och vill fortsätta</span>
                </label>
              </div>
            )}

            {error && (
              <div className="mt-4 text-red-200 bg-red-900/30 border border-red-700/40 rounded-lg p-3 text-sm">
                {error}
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-16 text-white/80">
                <FaSpinner className="animate-spin mr-2" /> Laddar paket...
              </div>
            ) : packages.length === 0 ? (
              <div className="text-center text-white/80 py-16">Inga paket tillgängliga just nu</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                {packages.map((pkg) => {
                  const effectivePrice = getEffectivePrice(pkg);
                  const savings = pkg.salePrice != null ? Math.max(0, Math.round(((Number(pkg.price) - Number(pkg.salePrice)) / Number(pkg.price)) * 100)) : 0;
                  const isPopular = savings > 15;
                  return (
                    <div key={pkg.id} className="relative bg-white/5 border border-white/10 rounded-xl p-5 text-white">
                      {isPopular && (
                        <div className="absolute top-4 right-4 bg-amber-100/90 text-amber-900 px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                          <FaStar /> Populär
                        </div>
                      )}

                      {savings > 0 && (
                        <div className="absolute top-4 left-4 bg-green-100/90 text-green-800 px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                          <FaPercent /> Spara {savings}%
                        </div>
                      )}

                      <div className="mb-4">
                        <h3 className="text-lg font-bold">{pkg.name}</h3>
                        {pkg.description && <p className="text-sm text-white/70">{pkg.description}</p>}
                      </div>

                      <div className="mb-4">
                        <div className="text-2xl font-extrabold">{effectivePrice} kr</div>
                        {savings > 0 && (
                          <div className="text-xs text-white/70">
                            Ord. pris {Number(pkg.price)} kr
                          </div>
                        )}
                      </div>

                      <ul className="space-y-2 text-sm mb-5">
                        {pkg.features.map((f, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <FaCheck className="text-emerald-400" />
                            <span className="text-white/90">{f}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          onClick={() => handlePurchase(pkg, "swish")}
                          disabled={busyPurchaseId === pkg.id || (hasActivePackage && !acknowledgeActiveWarning)}
                          className={cn(
                            "bg-sky-600 hover:bg-sky-500 text-white",
                            (busyPurchaseId === pkg.id || (hasActivePackage && !acknowledgeActiveWarning)) && "opacity-70 cursor-not-allowed"
                          )}
                        >
                          {busyPurchaseId === pkg.id ? (
                            <>
                              <FaSpinner className="animate-spin mr-2" />
                              Vänta...
                            </>
                          ) : (
                            <>
                              <FaMobileAlt className="mr-2" /> Swish
                            </>
                          )}
                        </Button>

                        <Button
                          onClick={() => handlePurchase(pkg, "qliro")}
                          disabled={busyPurchaseId === pkg.id || !qliroAvailable || (hasActivePackage && !acknowledgeActiveWarning)}
                          className={cn(
                            "bg-indigo-600 hover:bg-indigo-500 text-white",
                            (!qliroAvailable || busyPurchaseId === pkg.id || (hasActivePackage && !acknowledgeActiveWarning)) && "opacity-60 cursor-not-allowed"
                          )}
                          title={!qliroAvailable ? qliroStatusMessage || "Qliro otillgänglig" : "Betala med Qliro"}
                        >
                          {busyPurchaseId === pkg.id ? (
                            <>
                              <FaSpinner className="animate-spin mr-2" />
                              Vänta...
                            </>
                          ) : (
                            <>
                              <FaCreditCard className="mr-2" /> Qliro
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


