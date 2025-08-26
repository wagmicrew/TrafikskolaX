"use client";

import React, { useEffect, useState, useCallback } from "react";
import OpeningHoursEditor from "@/components/Admin/OpeningHoursEditor";
import type { OpeningHoursConfig } from "@/lib/site-settings/opening-hours";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import toast from "react-hot-toast";

export default function AdminOpeningHoursPage() {
  const [openingHours, setOpeningHours] = useState<OpeningHoursConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings", { cache: "no-store" });
      if (!res.ok) throw new Error("Kunde inte hämta inställningar");
      const data = await res.json();
      setOpeningHours(data.settings?.opening_hours ?? null);
      setDirty(false);
    } catch (e) {
      console.error(e);
      toast.error("Kunde inte hämta öppettider");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = useCallback(async () => {
    if (!openingHours) return;
    setSaving(true);
    const t = toast.loading("Sparar öppettider...");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opening_hours: openingHours }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Kunde inte spara öppettider");
      }
      toast.success("Öppettider sparade!", { id: t });
      setDirty(false);
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Fel vid sparande av öppettider", { id: t });
    } finally {
      setSaving(false);
    }
  }, [openingHours]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-black flex items-center gap-2">
              <Save className="w-8 h-8 text-blue-600" />
              Öppettider
            </h1>
          </div>
          <div className="flex items-center gap-3 sticky top-6 z-10">
            {dirty && (
              <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                Osparade ändringar
              </div>
            )}
            <Button onClick={save} disabled={saving || !dirty} className={`px-4 py-2 ${dirty ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-lg transition-colors`}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Sparar...' : 'Spara'}
            </Button>
          </div>
        </div>

        <Card className="shadow-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-black font-bold flex items-center gap-2">
              <Save className="w-5 h-5 text-blue-600" />
              Inställningar för Öppettider
            </CardTitle>
          </CardHeader>
          <CardContent className={`${loading ? 'opacity-50 pointer-events-none' : ''}`}>
            {openingHours ? (
              <OpeningHoursEditor
                value={openingHours}
                onChange={(next) => {
                  setOpeningHours(next);
                  setDirty(true);
                }}
              />
            ) : (
              <div className="text-center py-8 text-black">
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    Laddar öppettider...
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-lg">Ingen data hittades</div>
                    <p className="text-sm">Öppettider har inte konfigurerats än.</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
