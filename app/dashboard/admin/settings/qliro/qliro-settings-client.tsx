"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DatePickerPopover } from "@/components/ui/date-picker";
import toast from "react-hot-toast";
import { QliroPaymentDialog } from '@/components/booking/qliro-payment-dialog';
import { useQliroListener } from '@/hooks/use-qliro-listener';
import {
  Download,
  RefreshCw,
  Search,
  TestTube,
  Plus,
  RotateCcw,
  Loader2,
  Link as LinkIcon,
} from "lucide-react";

// Types aligned to backend response
interface PaymentItem {
  id: string;
  userId: string | null;
  userEmail: string | null;
  packageId: string | null;
  packageName: string | null;
  pricePaid: string | number | null;
  paymentMethod: string;
  paymentStatus: string | null;
  invoiceNumber: string | null;
  purchaseDate: string | null;
  paidAt: string | null;
  paymentReference: string | null;
  userFirstName: string | null;
  userLastName: string | null;
}

interface PaymentsResponse {
  page: number;
  pageSize: number;
  total: number;
  items: PaymentItem[];
}

interface UnpaidBookingItem {
  id: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  totalPrice: string | number | null;
  paymentMethod: string | null;
  paymentStatus: string | null;
  status: string | null;
  userEmail: string | null;
  userFirstName: string | null;
  userLastName: string | null;
  lessonTypeName: string | null;
}

interface UnpaidBookingsResponse {
  page: number;
  pageSize: number;
  total: number;
  items: UnpaidBookingItem[];
}

interface UserLite { id: string; firstName: string; lastName: string; email: string; }
interface PackageLite { id: string; name: string; isActive: boolean; }

const currency = new Intl.NumberFormat("sv-SE", { style: "currency", currency: "SEK" });

export default function QliroSettingsClient() {
  const [eventLog, setEventLog] = useState<Array<{ ts: string; type: string; data?: any }>>([])

  const pushLog = useCallback((type: string, data?: any) => {
    try {
      setEventLog((prev) => [{ ts: new Date().toISOString(), type, data }, ...prev].slice(0, 200))
    } catch {
      setEventLog((prev) => [{ ts: new Date().toISOString(), type }, ...prev].slice(0, 200))
    }
  }, [])

  useQliroListener({
    onCompleted: () => {
      pushLog('completed')
      try { window.location.href = '/payments/qliro/thank-you?admin=1' } catch {}
    },
    onDeclined: (reason, message) => {
      pushLog('declined', { reason, message })
      toast.error(`Betalning nekades: ${reason || ''} ${message || ''}`)
    },
    onLoaded: () => pushLog('loaded'),
    onMethodChanged: (payload) => pushLog('method_changed', payload),
    onError: (payload) => {
      pushLog('error', payload)
      try {
        const msg = typeof payload === 'string' ? payload : JSON.stringify(payload)
        toast.error(`Qliro-fel: ${msg.slice(0, 300)}`)
      } catch {
        toast.error('Qliro-fel: Okänt fel')
      }
    },
  })
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [dateField, setDateField] = useState<"purchase" | "paid">("purchase");
  const [fromDate, setFromDate] = useState<string | null>(null);
  const [toDate, setToDate] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Data
  const [loading, setLoading] = useState(false);
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [total, setTotal] = useState(0);
  const [unpaidBookings, setUnpaidBookings] = useState<UnpaidBookingItem[]>([]);
  const [unpaidTotal, setUnpaidTotal] = useState(0);

  // Test connection
  const [testing, setTesting] = useState(false);
  const [testStatus, setTestStatus] = useState<{ passed: boolean; lastTestDate: string | null } | null>(null);
  const [testResult, setTestResult] = useState<any>(null);

  // Create Payment Dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [users, setUsers] = useState<UserLite[]>([]);
  const [packages, setPackages] = useState<PackageLite[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedPackageId, setSelectedPackageId] = useState<string>("");
  const [creating, setCreating] = useState(false);
  const [creatingTest, setCreatingTest] = useState(false);
  const [prereqLoading, setPrereqLoading] = useState(false);
  const [prereqResult, setPrereqResult] = useState<any>(null);
  const [testOrderRunning, setTestOrderRunning] = useState(false);
  const [testOrderResult, setTestOrderResult] = useState<any>(null);
  const [authApiKey, setAuthApiKey] = useState('');
  const [authApiSecret, setAuthApiSecret] = useState('');
  const [authEnv, setAuthEnv] = useState<'sandbox' | 'production'>('sandbox');
  const [authTesting, setAuthTesting] = useState(false);
  const [authResult, setAuthResult] = useState<any>(null);
  const [testSSN, setTestSSN] = useState<string>("");
  const [testQliroOpen, setTestQliroOpen] = useState(false);
  const [testQliroUrl, setTestQliroUrl] = useState("");
  const [selectedPaymentIdOverride, setSelectedPaymentIdOverride] = useState<string>("");
  const [openMethod, setOpenMethod] = useState<'tab' | 'popup' | 'iframe'>('popup');
  const [inspectOpen, setInspectOpen] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState<string>("");
  const [pendingCheckoutUrl, setPendingCheckoutUrl] = useState<string>("");
  const [iframeSrc, setIframeSrc] = useState<string>("");

  // Qliro Payment Methods Settings
  const [paymentMethods, setPaymentMethods] = useState({
    qliro_payment_invoice: true,
    qliro_payment_campaign: false,
    qliro_payment_partpayment_account: false,
    qliro_payment_partpayment_fixed: false,
    qliro_payment_creditcards: true,
    qliro_payment_free: false,
    qliro_payment_trustly_direct: false,
    qliro_payment_swish: false
  });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  // Confirm refund dialog
  const [refundId, setRefundId] = useState<string | null>(null);
  // Confirm repay dialog
  const [repayId, setRepayId] = useState<string | null>(null);
  // Export confirm dialog
  const [exportOpen, setExportOpen] = useState(false);

  const statusMap = useMemo(() => ({
    paid: "Betald",
    pending: "Väntar",
    failed: "Misslyckad",
    refunded: "Återbetald",
  } as Record<string, string>), []);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));
    if (searchTerm.trim()) params.set("search", searchTerm.trim());
    if (status && status !== 'all') params.set("status", status);
    params.set("dateField", dateField);
    if (fromDate) params.set("from", `${fromDate}T00:00:00`);
    if (toDate) params.set("to", `${toDate}T23:59:59`);
    return params.toString();
  }, [page, pageSize, searchTerm, status, dateField, fromDate, toDate]);

  const loadPayments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/qliro/payments?${queryString}`);
      const data: PaymentsResponse = await res.json();
      if (!res.ok) throw new Error((data as any)?.error || "Failed to load payments");
      setPayments(data.items);
      setTotal(data.total);
    } catch (err: any) {
      console.error("Load payments error", err);
      toast.error(`Kunde inte ladda betalningar: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  }, [queryString]);

  const loadUnpaidBookings = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/qliro/unpaid-bookings?page=1&pageSize=50`);
      const data: UnpaidBookingsResponse = await res.json();
      if (!res.ok) throw new Error((data as any)?.error || 'Failed to load unpaid bookings');
      setUnpaidBookings(data.items || []);
      setUnpaidTotal(data.total || 0);
    } catch (err: any) {
      console.error('Load unpaid bookings error', err);
      toast.error(`Kunde inte ladda obetalda bokningar: ${err.message || err}`);
    }
  }, []);

  const loadTestStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/qliro/test`);
      const data = await res.json();
      // GET returns status object, but if route not accessible as GET, ignore
      if (res.ok && ("passed" in data || "lastTestDate" in data)) {
        setTestStatus({ passed: !!data.passed, lastTestDate: data.lastTestDate || null });
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const loadUsersAndPackages = useCallback(async () => {
    try {
      const token = typeof window !== 'undefined' ? (localStorage.getItem('auth-token') || '') : '';
      const authHeaders: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
      const [uRes, pRes] = await Promise.all([
        // Use admin-scoped endpoint that filters out temporary users reliably
        fetch("/api/admin/students?excludeTemp=true", { headers: authHeaders, credentials: 'include' }),
        fetch("/api/packages", { credentials: 'include' }),
      ]);
      if (uRes.status === 401) {
        toast.error('Din admin-session har gått ut. Logga in igen.');
        try {
          const url = typeof window !== 'undefined' ? window.location.href : '/dashboard/admin/settings/qliro';
          window.location.href = `/login?redirect=${encodeURIComponent(url)}`;
        } catch {}
        return;
      }
      const uJson = await uRes.json();
      const pJson = await pRes.json();
      const uList = (uJson.students || uJson.users || []) as any[];
      const pList = (Array.isArray(pJson) ? pJson : (pJson.packages || [])) as any[];
      // Filter to enrolled students only (inskriven) and sort by name
      const filtered = uList
        .filter((u) => u?.inskriven === true)
        .map((u) => ({ id: u.id, firstName: u.firstName, lastName: u.lastName, email: u.email }))
        .sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`, 'sv'));
      setUsers(filtered);
      setPackages(
        pList.map((p) => ({ id: p.id, name: p.name, isActive: !!p.isActive }))
      );
    } catch (err) {
      console.error("Failed to load users/packages", err);
    }
  }, []);

  const loadPaymentMethodSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/settings?category=payment');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load settings');
      
      // API returns { settings: Record<string, any> }
      const raw = data?.settings ?? {};
      const settingsMap: Record<string, any> = Array.isArray(raw)
        ? (raw as any[]).reduce((acc, s) => {
            const key = s?.key ?? s?.name;
            const value = s?.value;
            if (key != null) acc[String(key)] = value;
            return acc;
          }, {} as Record<string, any>)
        : (raw as Record<string, any>);

      // Start from current defaults and override with fetched values
      const next: any = { ...paymentMethods };
      Object.keys(next).forEach((key) => {
        if (key.startsWith('qliro_payment_')) {
          const v = settingsMap[key];
          next[key] = typeof v === 'boolean' ? v : (typeof v === 'string' ? v === 'true' : !!v);
        }
      });

      setPaymentMethods(next);
      setHasUnsavedChanges(false);
    } catch (err: any) {
      console.error('Failed to load payment method settings', err);
      toast.error('Kunde inte ladda betalningsmetodinställningar');
    }
  }, []);

  const savePaymentMethodSettings = async () => {
    setSavingSettings(true);
    const t = toast.loading('Sparar inställningar...', { position: 'top-right' });
    
    try {
      // API expects a PUT with a key-value map
      const updates = Object.fromEntries(
        Object.entries(paymentMethods).map(([key, value]) => [key, value])
      );

      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || data.message || 'Failed to save settings');
      
      toast.success('Inställningar sparade', { id: t, position: 'top-right' });
      setHasUnsavedChanges(false);
    } catch (err: any) {
      console.error('Failed to save payment method settings', err);
      toast.error(`Kunde inte spara inställningar: ${err.message}`, { id: t, position: 'top-right' });
    } finally {
      setSavingSettings(false);
    }
  };

  const handlePaymentMethodChange = (key: string, value: boolean) => {
    setPaymentMethods(prev => ({
      ...prev,
      [key]: value
    }));
    setHasUnsavedChanges(true);
  };

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  useEffect(() => {
    loadUnpaidBookings();
  }, [loadUnpaidBookings]);

  useEffect(() => {
    loadTestStatus();
  }, [loadTestStatus]);

  useEffect(() => {
    loadPaymentMethodSettings();
  }, [loadPaymentMethodSettings]);

  // Warn user before leaving page with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'Du har osparade ändringar. Är du säker på att du vill lämna sidan?';
        return 'Du har osparade ändringar. Är du säker på att du vill lämna sidan?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Capture any qliro:* and legacy events broadcast via postMessage for richer logs
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const d: any = (event as any).data || {}
      try {
        if (d?.type && typeof d.type === 'string' && d.type.startsWith('qliro:')) {
          pushLog(d.type, d.data ?? d)
        } else if (d?.event) {
          pushLog(`legacy:${String(d.event)}`, d)
        }
      } catch {}
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [pushLog])

  useEffect(() => {
    if (createOpen) {
      loadUsersAndPackages();
    }
  }, [createOpen, loadUsersAndPackages]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const onExport = async () => {
    try {
      if (total === 0) {
        toast("Inga betalningar att exportera");
        return;
      }
      const url = `/api/admin/qliro/payments/export?${queryString}`;
      const t = toast.loading("Genererar PDF...", { position: 'top-right', style: { background: 'rgba(15,23,42,0.9)', color: 'white' } });
      // Open in a new tab to leverage Content-Disposition
      const win = window.open(`/payments/qliro/checkout?url=${encodeURIComponent(url)}`, "qliro_window");
      if (!win) {
        toast.error("Popup blocker hindrade exporten", { id: t, position: 'top-right' });
        return;
      }
      setTimeout(() => {
        toast.success("Export startad – nedladdning bör påbörjas", { id: t, position: 'top-right' });
      }, 800);
    } catch (err) {
      toast.error("Kunde inte exportera PDF");
    }
  };

  const onRepay = async (id: string) => {
    const t = toast.loading('Skapar betalningslänk...', { position: 'top-right', style: { background: 'rgba(15,23,42,0.9)', color: 'white' } });
    try {
      const res = await fetch(`/api/admin/qliro/payments/${id}/repay`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Misslyckades att skapa betalningslänk');
      toast.success('Betalningslänk skapad', { id: t, position: 'top-right' });
      if (data.checkoutUrl) {
        try { await navigator.clipboard.writeText(data.checkoutUrl); toast('Länk kopierad', { position: 'top-right' }); } catch {}
        window.open(`/payments/qliro/checkout?orderId=${encodeURIComponent(data.checkoutId || 'admin-repay')}`, '_blank');
      }
    } catch (err: any) {
      toast.error(err.message || 'Fel vid skapande av länk', { id: t, position: 'top-right' });
    }
  };

  const onTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    const t = toast.loading("Testar Qliro-anslutning...", { position: 'top-right', style: { background: 'rgba(15,23,42,0.9)', color: 'white' } });
    try {
      const res = await fetch("/api/admin/qliro/test", { method: "POST" });
      const data = await res.json();
      setTestResult(data);
      if (res.ok && data.success) {
        toast.success("Qliro-anslutning OK", { id: t, position: 'top-right' });
      } else {
        toast.error(`Qliro-test misslyckades: ${data.message || "Fel"}`, { id: t, position: 'top-right' });
      }
      // Refresh status
      loadTestStatus();
    } catch (err: any) {
      console.error(err);
      toast.error(`Qliro-test misslyckades: ${err.message || err}`, { id: t, position: 'top-right' });
    } finally {
      setTesting(false);
    }
  };

  const onCreatePayment = async () => {
    if (!selectedUserId || !selectedPackageId) {
      toast.error("Välj elev och paket");
      return;
    }
    setCreating(true);
    const t = toast.loading("Skapar betalningsförfrågan...", { position: 'top-right', style: { background: 'rgba(15,23,42,0.9)', color: 'white' } });
    try {
      const res = await fetch("/api/admin/qliro/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedUserId, packageId: selectedPackageId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Misslyckades att skapa betalning");
      toast.success("Betalningsförfrågan skapad! Öppnar Qliro...", { id: t, position: 'top-right' });
      if (data.checkoutUrl) {
        try {
          const width = Math.min(480, Math.floor(window.innerWidth * 0.8));
          const height = Math.min(780, Math.floor(window.innerHeight * 0.9));
          const left = Math.max(0, Math.floor((window.screen.width - width) / 2));
          const top = Math.max(0, Math.floor((window.screen.height - height) / 2));
          const features = `popup=yes,noopener,noreferrer,resizable=yes,scrollbars=yes,width=${width},height=${height},left=${left},top=${top}`;
          // Prefer raw popup to avoid site wrapper
          try {
            const { openQliroPopup } = await import('@/lib/payment/qliro-popup')
            if (data.checkoutId) { await openQliroPopup(String(data.checkoutId)); return }
          } catch {}
          const safeUrl = `/payments/qliro/checkout?orderId=${encodeURIComponent(data.checkoutId || 'admin-payment')}`;
          const win = window.open(safeUrl, 'qliro_window', features);
          if (win) win.focus();
        } catch {}
      }
      setCreateOpen(false);
      // Refresh list
      loadPayments();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Misslyckades att skapa betalning", { id: t, position: 'top-right' });
    } finally {
      setCreating(false);
    }
  };

  const onCreateTestOrder = async () => {
    setCreatingTest(true);
    const t = toast.loading('Skapar testorder...', { position: 'top-right', style: { background: 'rgba(15,23,42,0.9)', color: 'white' } });
    try {
      const res = await fetch('/api/admin/qliro/test-order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || 'Misslyckades att skapa testorder');
      toast.success('Testorder skapad – öppnar Qliro...', { id: t, position: 'top-right' });
      if (data.checkoutUrl) {
        setPendingOrderId(String(data.checkoutId || ''));
        setPendingCheckoutUrl(String(data.checkoutUrl || ''));
        setInspectOpen(true);
      }
    } catch (err: any) {
      toast.error(err.message || 'Misslyckades att skapa testorder', { id: t, position: 'top-right' });
    } finally {
      setCreatingTest(false);
    }
  };

  const testDummyOrder = async () => {
    const t = toast.loading('Skapar dummy order & testar PaymentOptions...', { position: 'top-right', style: { background: 'rgba(15,23,42,0.9)', color: 'white' } });
    try {
      const res = await fetch('/api/admin/qliro/test-dummy-order', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Misslyckades att skapa dummy order');
      
      toast.success('Dummy order skapad! Se konsolen för detaljer.', { id: t, position: 'top-right' });
      console.log('[Qliro Test Results]', data);
      
      if (data.availablePaymentMethods) {
        console.log('[Qliro] Available Payment Methods:', data.availablePaymentMethods);
      }
      if (data.nonSwishMethods) {
        console.log('[Qliro] Non-Swish Payment Methods:', data.nonSwishMethods);
      }
    } catch (err: any) {
      console.error('[Qliro Test Error]', err);
      toast.error(err.message || 'Misslyckades att testa dummy order', { id: t, position: 'top-right' });
    }
  };

  const onRefund = async (id: string) => {
    const t = toast.loading("Försöker återbetalning...", { position: 'top-right', style: { background: 'rgba(15,23,42,0.9)', color: 'white' } });
    try {
      const res = await fetch(`/api/admin/qliro/payments/${id}/refund`, { method: "POST" });
      const data = await res.json();
      if (res.status === 501) {
        toast("Återbetalning ej implementerad ännu", { id: t, position: 'top-right' });
      } else if (!res.ok) {
        throw new Error(data.error || data.message || "Återbetalning misslyckades");
      } else {
        toast.success("Återbetalning initierad", { id: t, position: 'top-right' });
      }
      loadPayments();
    } catch (err: any) {
      toast.error(err.message || "Återbetalning misslyckades", { id: t, position: 'top-right' });
    }
  };

  const resetFilters = () => {
    setSearchTerm("");
    setStatus("all");
    setDateField("purchase");
    setFromDate(null);
    setToDate(null);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Filter och åtgärder</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Qliro auth test */}
          <div className="rounded-lg border border-white/10 bg-white/5 p-3">
            <div className="text-sm font-semibold mb-2">Autentiseringstest</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <Input placeholder="API key" value={authApiKey} onChange={(e)=>setAuthApiKey(e.target.value)} className="bg-white/10 border-white/20 text-white" />
              <Input placeholder="API secret" value={authApiSecret} onChange={(e)=>setAuthApiSecret(e.target.value)} className="bg-white/10 border-white/20 text-white" />
              <Select value={authEnv} onValueChange={(v: any)=>setAuthEnv(v)}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white"><SelectValue placeholder="Miljö" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sandbox">Sandbox</SelectItem>
                  <SelectItem value="production">Production</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="mt-2 flex gap-2">
              <Button onClick={async ()=>{
                setAuthTesting(true);
                try {
                  const res = await fetch('/api/admin/qliro/auth-test', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ apiKey: authApiKey, apiSecret: authApiSecret, environment: authEnv }) });
                  const data = await res.json();
                  if (!res.ok) throw new Error(data.error || data.message || 'Autentisering misslyckades');
                  toast.success('Autentisering lyckades!', { position: 'top-right' });
                  setAuthResult(data);
                } catch (err: any) {
                  toast.error(err.message || 'Autentisering misslyckades', { position: 'top-right' });
                } finally {
                  setAuthTesting(false);
                }
              }} disabled={authTesting} className="bg-blue-600 hover:bg-blue-700">
                {authTesting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Testa autentisering
              </Button>
              <Button onClick={testDummyOrder} variant="outline">Testa dummy order</Button>
            </div>
            {authResult && (
              <div className="mt-3 p-2 bg-green-900/20 border border-green-500/30 rounded text-sm">
                <div className="font-semibold text-green-400">Autentisering lyckades</div>
                <div className="text-green-300 text-xs mt-1">API Key: {authResult.apiKeyMasked}</div>
                <div className="text-green-300 text-xs">Miljö: {authResult.environment}</div>
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Sök</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Sök på id, referens, e-post..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                />
                <Button variant="outline" onClick={loadPayments}>
                  <Search className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alla</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Datumfält</Label>
              <Select value={dateField} onValueChange={(v: any) => { setDateField(v); setPage(1); }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="purchase">Köpt datum</SelectItem>
                  <SelectItem value="paid">Betald datum</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Från</Label>
              <DatePickerPopover value={fromDate} onChange={(v) => { setFromDate(v); setPage(1); }} label="Välj från-datum" />
            </div>
            <div className="space-y-1.5">
              <Label>Till</Label>
              <DatePickerPopover value={toDate} onChange={(v) => { setToDate(v); setPage(1); }} label="Välj till-datum" />
            </div>
            <div className="flex items-end gap-2">
              <Button variant="outline" onClick={resetFilters}>
                <RotateCcw className="w-4 h-4 mr-1" /> Återställ
              </Button>
              <Button variant="secondary" onClick={() => setExportOpen(true)} disabled={loading || total === 0}>
                <Download className="w-4 h-4 mr-1" /> Exportera PDF
              </Button>
            </div>
          </div>

          {/* Export confirm dialog */}
          <Dialog open={exportOpen} onOpenChange={setExportOpen}>
            <DialogContent className="bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-2xl shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-white">Bekräfta export</DialogTitle>
              </DialogHeader>
              <div className="text-sm space-y-2 text-slate-200">
                <div>Fält: {dateField === 'purchase' ? 'Köpt datum' : 'Betald datum'}</div>
                <div>Från: {fromDate || '-'} &nbsp; Till: {toDate || '-'}</div>
                <div>Status: {status === 'all' ? 'Alla' : status}</div>
                <div>Filter: {searchTerm ? `"${searchTerm}"` : '-'}</div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setExportOpen(false)}>Avbryt</Button>
                <Button onClick={() => { setExportOpen(false); onExport(); }}>Exportera</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <div className="flex flex-wrap gap-2">
            <Button onClick={onTestConnection} disabled={testing}>
              {testing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <TestTube className="w-4 h-4 mr-2" />} Testa anslutning
            </Button>
            <Button onClick={testDummyOrder} variant="outline">
              <TestTube className="w-4 h-4 mr-2" /> Test PaymentOptions
            </Button>
            <div className="p-3 rounded-lg border border-white/10 bg-white/5 flex items-center gap-2">
              <div className="text-sm text-slate-300">PaymentOptions</div>
              <Input
                placeholder="OrderId"
                value={(testOrderResult?.details?.checkoutId || '').toString()}
                readOnly
                className="w-[220px] bg-white/10 border-white/20 text-white"
              />
              {/* PaymentId override dropdown (built from fetched options) */}
              {testOrderResult?.paymentOptions ? (
                <select
                  className="bg-white/10 border border-white/20 text-white text-xs rounded px-2 py-1"
                  value={selectedPaymentIdOverride}
                  onChange={(e) => setSelectedPaymentIdOverride(e.target.value)}
                >
                  <option value="">Välj PaymentId (auto)</option>
                  {(() => {
                    try {
                      const items: { id: string; name: string }[] = [];
                      const scan = (obj: any) => {
                        if (!obj) return;
                        if (Array.isArray(obj)) { for (const it of obj) scan(it); return; }
                        if (typeof obj === 'object') {
                          const name = String(obj.Name || obj.Method || obj.GroupName || obj.DisplayName || '').trim();
                          const id = obj.PaymentId || obj.Id || obj.PaymentID || null;
                          if (id) items.push({ id: String(id), name: name || String(id) });
                          for (const k of Object.keys(obj)) scan(obj[k]);
                        }
                      };
                      scan(testOrderResult.paymentOptions);
                      // Deduplicate by id
                      const seen = new Set<string>();
                      return items.filter(i => (seen.has(i.id) ? false : (seen.add(i.id), true))).map((i) => (
                        <option key={i.id} value={i.id}>{i.name} ({i.id})</option>
                      ));
                    } catch { return null; }
                  })()}
                </select>
              ) : null}
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    if (!testOrderResult?.details?.checkoutId) { toast.error('Skapa en testorder först'); return; }
                    const res = await fetch('/api/admin/qliro/payment-options', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId: String(testOrderResult.details.checkoutId) }) });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || 'Kunde inte hämta PaymentOptions');
                    setTestOrderResult((prev: any) => ({ ...(prev || {}), paymentOptions: data.options, selectedNonSwishPaymentId: data.selectedNonSwishPaymentId }));
                    toast.success('PaymentOptions hämtade');
                  } catch (e: any) { toast.error(e.message || 'Fel vid PaymentOptions'); }
                }}
              >Hämta</Button>
              <Button
                onClick={() => {
                  try {
                    const url = (testOrderResult?.details?.checkoutUrl || '').toString();
                    const pid = selectedPaymentIdOverride || testOrderResult?.selectedNonSwishPaymentId;
                    if (!url) { toast.error('Ingen checkoutUrl'); return; }
                    const openUrl = pid ? `${url}${url.includes('?') ? '&' : '?'}paymentId=${encodeURIComponent(pid)}` : url;
                    const width = Math.min(480, Math.floor(window.innerWidth * 0.8));
                    const height = Math.min(780, Math.floor(window.innerHeight * 0.9));
                    const left = Math.max(0, Math.floor((window.screen.width - width) / 2));
                    const top = Math.max(0, Math.floor((window.screen.height - height) / 2));
                    const features = `popup=yes,noopener,noreferrer,resizable=yes,scrollbars=yes,width=${width},height=${height},left=${left},top=${top}`;
                    const win = window.open(`/payments/qliro/checkout?url=${encodeURIComponent(openUrl)}`, 'qliro_window', features);
                    if (win) win.focus();
                  } catch {}
                }}
              >Öppna</Button>
            </div>
            {testOrderResult?.paymentOptions ? (
              <div className="w-full mt-2 p-3 rounded-lg border border-white/10 bg-white/5 text-xs text-slate-200">
                <div className="mb-2">Föreslagen PaymentId (ej Swish): <span className="font-semibold">{String(testOrderResult.selectedNonSwishPaymentId || '-')}</span></div>
                <details>
                  <summary className="cursor-pointer">Visa PaymentOptions JSON</summary>
                  <pre className="mt-2 whitespace-pre-wrap break-words">{JSON.stringify(testOrderResult.paymentOptions, null, 2)}</pre>
                </details>
              </div>
            ) : null}

            {/* Checkout Event Console */}
            <div className="w-full mt-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Checkout Event Console</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs text-slate-500">Visar senaste {eventLog.length} händelser</div>
                    <Button variant="outline" size="sm" onClick={() => setEventLog([])}>Rensa</Button>
                  </div>
                  <div className="rounded-md border border-white/10 bg-white/5 max-h-64 overflow-auto p-2 text-xs font-mono">
                    {eventLog.length === 0 ? (
                      <div className="text-slate-400">Inga händelser ännu</div>
                    ) : (
                      eventLog.map((e, idx) => (
                        <div key={idx} className="py-1 border-b last:border-b-0 border-white/10">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400">{new Date(e.ts).toLocaleTimeString()}</span>
                            <span className="text-sky-300">{e.type}</span>
                          </div>
                          {e.data !== undefined ? (
                            <pre className="whitespace-pre-wrap break-words text-slate-200">{
                              (() => { try { return JSON.stringify(e.data, null, 2) } catch { return String(e.data) } })()
                            }</pre>
                          ) : null}
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
            <Button variant="secondary" onClick={async () => {
              setPrereqLoading(true);
              setPrereqResult(null);
              const t = toast.loading('Kontrollerar Qliro-förkrav...', { position: 'top-right', style: { background: 'rgba(15,23,42,0.9)', color: 'white' } });
              try {
                const res = await fetch('/api/admin/qliro/prereq');
                const data = await res.json();
                setPrereqResult(data);
                if (!res.ok) throw new Error(data.error || 'Misslyckades att verifiera förkrav');
                toast.success('Förkrav kontrollerade', { id: t, position: 'top-right' });
              } catch (e: any) {
                toast.error(e.message || 'Misslyckades att verifiera förkrav', { id: t, position: 'top-right' });
              } finally {
                setPrereqLoading(false);
              }
            }} disabled={prereqLoading}>
              {prereqLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Kontrollera förkrav
            </Button>
            <div className="flex gap-2 items-end flex-wrap">
              <div className="space-y-1.5">
                <Label>Testscenario (B2C personnummer)</Label>
                <Select value={testSSN} onValueChange={setTestSSN}>
                  <SelectTrigger className="min-w-[240px]">
                    <SelectValue placeholder="Välj testperson..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="790625-5307">790625-5307</SelectItem>
                    <SelectItem value="750420-8104">750420-8104</SelectItem>
                    <SelectItem value="770530-1773">770530-1773</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Öppningssätt</Label>
                <Select value={openMethod} onValueChange={(v: any) => setOpenMethod(v)}>
                  <SelectTrigger className="min-w-[220px]"><SelectValue placeholder="Välj öppningssätt" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tab">Ny flik</SelectItem>
                    <SelectItem value="popup">Popup-fönster</SelectItem>
                    <SelectItem value="iframe">Direkt i kort (iframe)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" onClick={async () => {
              setTestOrderRunning(true);
              setTestOrderResult(null);
              const t = toast.loading('Skapar testorder via API...', { position: 'top-right', style: { background: 'rgba(15,23,42,0.9)', color: 'white' } });
              try {
                const res = await fetch('/api/admin/qliro/test-order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ customer: { personalNumber: testSSN || undefined } }) });
                const data = await res.json();
                setTestOrderResult(data);
                // Toast detailed steps
                if (data.url) toast(`POST ${data.url}`, { position: 'top-right' });
                if (data.request) toast(`Payload skickad`, { position: 'top-right' });
                if (!res.ok) {
                  toast.error(`Fel ${data.status}: ${data.statusText || data.error || 'Qliro API error'}`, { id: t, position: 'top-right' });
                  if (data.responseText) {
                    toast(`Svar: ${String(data.responseText).slice(0, 180)}...`, { position: 'top-right' });
                  }
                } else {
                  toast.success(`OK ${data.status}: PaymentLink mottagen`, { id: t, position: 'top-right' });
                  if (data.checkoutUrl) {
                    // Open safe embed directly to avoid same-origin frame issues
                    try {
                      const width = Math.min(480, Math.floor(window.innerWidth * 0.8));
                      const height = Math.min(780, Math.floor(window.innerHeight * 0.9));
                      const left = Math.max(0, Math.floor((window.screen.width - width) / 2));
                      const top = Math.max(0, Math.floor((window.screen.height - height) / 2));
                      const features = `popup=yes,noopener,noreferrer,resizable=yes,scrollbars=yes,width=${width},height=${height},left=${left},top=${top}`;
                      const params = new URLSearchParams();
                      if (data.checkoutId) params.set('orderId', String(data.checkoutId));
                      try {
                        const { openQliroPopup } = await import('@/lib/payment/qliro-popup')
                        const oid = params.get('orderId')
                        if (oid) { await openQliroPopup(String(oid)); return }
                      } catch {}
                      const win = window.open(`/payments/qliro/checkout?${params.toString()}`, 'qliro_window', features);
                      if (win) win.focus();
                    } catch {}
                  }
                }
              } catch (e: any) {
                setTestOrderResult({ error: e?.message || 'Okänt fel' });
                toast.error(e.message || 'Misslyckades att skapa testorder', { id: t, position: 'top-right' });
              } finally {
                setTestOrderRunning(false);
              }
            }} disabled={testOrderRunning}>
              {testOrderRunning ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Testorder (API)
            </Button>
            </div>
            {openMethod === 'iframe' ? (
              <div className="mt-3 w-full">
                <Label>Inbäddad test (iframe)</Label>
                <div className="mt-2 w-full rounded-lg overflow-hidden border border-white/10 bg-white/5" style={{height: 780}}>
                  {iframeSrc ? (
                    <iframe title="Qliro Test" src={iframeSrc} className="w-full h-full" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sm text-slate-300">Ingen testorder öppnad ännu</div>
                  )}
                </div>
              </div>
            ) : null}
            <Button variant="outline" onClick={async () => {
              const t = toast.loading('Rensar temporära ordrar...', { position: 'top-right' });
              try {
                const res = await fetch('/api/dashboard/admin/qliro/order-management', {
                  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'clearTemp', payload: {} })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Misslyckades att rensa');
                toast.success('Temporära ordrar rensade', { id: t, position: 'top-right' });
                loadPayments();
              } catch (e: any) {
                toast.error(e.message || 'Misslyckades att rensa', { id: t, position: 'top-right' });
              }
            }}>Rensa temporära ordrar</Button>
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button variant="default"><Plus className="w-4 h-4 mr-1" /> Skapa betalning</Button>
              </DialogTrigger>
              <DialogContent className="bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-2xl shadow-2xl">
                <DialogHeader>
                  <DialogTitle className="text-white">Skapa ny Qliro-betalning</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-slate-200">Elev</Label>
                    <Select value={selectedUserId} onValueChange={(v) => setSelectedUserId(v)}>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white"><SelectValue placeholder="Välj elev" /></SelectTrigger>
                      <SelectContent className="z-[60] bg-white/10 backdrop-blur-md text-white border border-white/20 rounded-2xl shadow-2xl">
                        {users.map((u) => (
                          <SelectItem key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.email})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-slate-200">Paket</Label>
                    <Select value={selectedPackageId} onValueChange={(v) => setSelectedPackageId(v)}>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white"><SelectValue placeholder="Välj paket" /></SelectTrigger>
                      <SelectContent className="z-[60] bg-white/10 backdrop-blur-md text-white border border-white/20 rounded-2xl shadow-2xl">
                        {packages.filter(p => p.isActive).map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter className="mt-4">
                  <Button onClick={onCreatePayment} disabled={creating} className="bg-emerald-600 hover:bg-emerald-700">
                    {creating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Skapa
                  </Button>
                  <Button onClick={onCreateTestOrder} disabled={creatingTest} className="bg-sky-600 hover:bg-sky-700">
                    {creatingTest ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Skapa testorder
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            {/* Confirm refund dialog */}
            <Dialog open={!!refundId} onOpenChange={(open) => { if (!open) setRefundId(null); }}>
              <DialogContent className="bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-2xl shadow-2xl">
                <DialogHeader>
                  <DialogTitle>Bekräfta återbetalning</DialogTitle>
                </DialogHeader>
                <p className="text-sm text-slate-300">Är du säker på att du vill initiera återbetalning för denna betalning?</p>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setRefundId(null)}>Avbryt</Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      const id = refundId!;
                      setRefundId(null);
                      onRefund(id);
                    }}
                  >
                    Bekräfta
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            {/* Confirm repay dialog */}
            <Dialog open={!!repayId} onOpenChange={(open) => { if (!open) setRepayId(null); }}>
              <DialogContent className="bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-2xl shadow-2xl">
                <DialogHeader>
                  <DialogTitle>Skapa betalningslänk</DialogTitle>
                </DialogHeader>
                <p className="text-sm text-slate-300">Detta skapar en ny Qliro-betalningslänk för köpet. Fortsätt?</p>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setRepayId(null)}>Avbryt</Button>
                  <Button
                    onClick={() => {
                      const id = repayId!;
                      setRepayId(null);
                      onRepay(id);
                    }}
                  >
                    Skapa länk
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Qliro Payment Methods Settings */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle>Qliro Betalningsmetoder</CardTitle>
            <div className="flex items-center gap-2">
              {hasUnsavedChanges && (
                <div className="flex items-center gap-2 text-sm text-amber-400">
                  <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                  Osparade ändringar
                </div>
              )}
              <Button 
                onClick={savePaymentMethodSettings}
                disabled={!hasUnsavedChanges || savingSettings}
                className="bg-green-600 hover:bg-green-700"
              >
                {savingSettings ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                Spara
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-slate-400 mb-4">
            Välj vilka betalningsmetoder som ska vara tillgängliga i Qliro-kassan. 
            Ändringar påverkar alla nya betalningar.
          </div>
          
          <div className="flex items-center gap-2 mb-4">
            <Button 
              onClick={async () => {
                const t = toast.loading('Initialiserar betalningsmetoder...', { position: 'top-right' });
                try {
                  const res = await fetch('/api/admin/settings/init-qliro-payment-methods', { method: 'POST' });
                  const data = await res.json();
                  if (!res.ok) throw new Error(data.error || 'Failed to initialize');
                  toast.success('Betalningsmetoder initialiserade!', { id: t, position: 'top-right' });
                  loadPaymentMethodSettings();
                } catch (err: any) {
                  toast.error(`Kunde inte initialisera: ${err.message}`, { id: t, position: 'top-right' });
                }
              }}
              variant="outline"
              size="sm"
            >
              Initialisera betalningsmetoder
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="qliro_payment_invoice"
                  checked={paymentMethods.qliro_payment_invoice}
                  onChange={(e) => handlePaymentMethodChange('qliro_payment_invoice', e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
                <label htmlFor="qliro_payment_invoice" className="text-sm font-medium text-white">
                  Faktura (Invoice)
                </label>
              </div>
              
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="qliro_payment_campaign"
                  checked={paymentMethods.qliro_payment_campaign}
                  onChange={(e) => handlePaymentMethodChange('qliro_payment_campaign', e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
                <label htmlFor="qliro_payment_campaign" className="text-sm font-medium text-white">
                  Kampanj (Campaign)
                </label>
              </div>
              
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="qliro_payment_partpayment_account"
                  checked={paymentMethods.qliro_payment_partpayment_account}
                  onChange={(e) => handlePaymentMethodChange('qliro_payment_partpayment_account', e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
                <label htmlFor="qliro_payment_partpayment_account" className="text-sm font-medium text-white">
                  Delbetalning Konto (Part Payment Account)
                </label>
              </div>
              
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="qliro_payment_partpayment_fixed"
                  checked={paymentMethods.qliro_payment_partpayment_fixed}
                  onChange={(e) => handlePaymentMethodChange('qliro_payment_partpayment_fixed', e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
                <label htmlFor="qliro_payment_partpayment_fixed" className="text-sm font-medium text-white">
                  Delbetalning Fast (Part Payment Fixed)
                </label>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="qliro_payment_creditcards"
                  checked={paymentMethods.qliro_payment_creditcards}
                  onChange={(e) => handlePaymentMethodChange('qliro_payment_creditcards', e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
                <label htmlFor="qliro_payment_creditcards" className="text-sm font-medium text-white">
                  Kreditkort (Credit Cards)
                </label>
              </div>
              
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="qliro_payment_free"
                  checked={paymentMethods.qliro_payment_free}
                  onChange={(e) => handlePaymentMethodChange('qliro_payment_free', e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
                <label htmlFor="qliro_payment_free" className="text-sm font-medium text-white">
                  Gratis (Free)
                </label>
              </div>
              
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="qliro_payment_trustly_direct"
                  checked={paymentMethods.qliro_payment_trustly_direct}
                  onChange={(e) => handlePaymentMethodChange('qliro_payment_trustly_direct', e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
                <label htmlFor="qliro_payment_trustly_direct" className="text-sm font-medium text-white">
                  Trustly Direct
                </label>
              </div>
              
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="qliro_payment_swish"
                  checked={paymentMethods.qliro_payment_swish}
                  onChange={(e) => handlePaymentMethodChange('qliro_payment_swish', e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
                <label htmlFor="qliro_payment_swish" className="text-sm font-medium text-white">
                  Swish
                </label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={inspectOpen} onOpenChange={setInspectOpen}>
        <DialogContent className="bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-2xl shadow-2xl max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-white">Granska betalningslänk</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <div className="text-slate-300">Öppningssätt: <span className="font-semibold">{openMethod === 'tab' ? 'Ny flik' : openMethod === 'popup' ? 'Popup' : 'Iframe'}</span></div>
            <div className="text-slate-300 break-all">
              <div className="font-medium mb-1">PaymentLink</div>
              <code className="text-xs">{pendingCheckoutUrl || '-'}</code>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInspectOpen(false)}>Avbryt</Button>
            <Button onClick={async () => {
              setInspectOpen(false);
              try {
                if (openMethod === 'popup') {
                  try {
                    const { openQliroPopup } = await import('@/lib/payment/qliro-popup');
                    if (pendingOrderId) { await openQliroPopup(String(pendingOrderId)); return }
                  } catch {}
                } else if (openMethod === 'tab') {
                  const url = pendingOrderId ? `/payments/qliro/checkout?orderId=${encodeURIComponent(pendingOrderId)}` : pendingCheckoutUrl;
                  window.open(url || pendingCheckoutUrl, '_blank');
                  return;
                } else if (openMethod === 'iframe') {
                  const src = pendingOrderId ? `/payments/qliro/raw?orderId=${encodeURIComponent(pendingOrderId)}` : '';
                  setIframeSrc(src);
                  return;
                }
                const fallbackUrl = pendingOrderId ? `/payments/qliro/checkout?orderId=${encodeURIComponent(pendingOrderId)}` : pendingCheckoutUrl;
                const width = Math.min(520, Math.floor(window.innerWidth * 0.9));
                const height = Math.min(860, Math.floor(window.innerHeight * 0.95));
                const left = Math.max(0, Math.floor((window.screen.width - width) / 2));
                const top = Math.max(0, Math.floor((window.screen.height - height) / 2));
                const features = `popup=yes,noopener,noreferrer,resizable=yes,scrollbars=yes,width=${width},height=${height},left=${left},top=${top}`;
                window.open(fallbackUrl, 'qliro_window', features);
              } catch {}
            }}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status/Test Panel */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Qliro-status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <QliroPaymentDialog
            isOpen={testQliroOpen}
            onClose={() => setTestQliroOpen(false)}
            purchaseId={testOrderResult?.merchantReference || 'test-order'}
            amount={1}
            checkoutUrl={testQliroUrl}
            onConfirm={() => {
              setTestQliroOpen(false);
              // Thank-you navigation
              try { window.location.href = '/booking/success?test=1'; } catch {}
            }}
          />
          <div className="flex items-center gap-3">
            {testStatus ? (
              <Badge variant={testStatus.passed ? "default" : "destructive"}>
                {testStatus.passed ? "Senaste test: Godkänt" : "Senaste test: Misslyckat"}
              </Badge>
            ) : (
              <span className="text-sm text-slate-400">Ingen teststatus</span>
            )}
            {testStatus?.lastTestDate ? (
              <span className="text-sm text-slate-300">{new Date(testStatus.lastTestDate).toLocaleString("sv-SE")}</span>
            ) : null}
          </div>
          {testResult ? (
            <pre className="bg-slate-900/50 border border-white/10 rounded-lg p-3 text-xs overflow-auto">
{JSON.stringify(testResult, null, 2)}
            </pre>
          ) : null}
          {prereqResult ? (
            <div className="space-y-2">
              <div className="text-sm text-slate-300">Miljö: <span className="font-semibold">{prereqResult.environment}</span></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {(prereqResult.checks || []).map((c: any) => (
                  <div key={c.key} className={`rounded-lg border p-2 text-xs ${c.status === 'ok' ? 'border-emerald-500/40' : c.status === 'warn' ? 'border-amber-500/40' : 'border-red-500/40'}`}>
                    <div className="font-medium">{c.label}</div>
                    <div className="mt-1 text-slate-400">Status: {c.status}</div>
                    {c.details ? (
                      <pre className="mt-1 bg-slate-900/40 rounded p-2 overflow-auto">{JSON.stringify(c.details, null, 2)}</pre>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          {testOrderResult ? (
            <div className="space-y-2">
              <div className="text-sm text-slate-300">Testorder-resultat</div>
              <pre className="bg-slate-900/50 border border-white/10 rounded-lg p-3 text-xs overflow-auto">{JSON.stringify(testOrderResult, null, 2)}</pre>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Betalningar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Köpt</TableHead>
                  <TableHead>Betald</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Paket</TableHead>
                  <TableHead>Elev</TableHead>
                  <TableHead>E-post</TableHead>
                  <TableHead>Belopp</TableHead>
                  <TableHead>Ref</TableHead>
                  <TableHead>Åtgärd</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9}>
                      <div className="flex items-center gap-2 text-sm text-slate-300"><Loader2 className="w-4 h-4 animate-spin"/> Laddar...</div>
                    </TableCell>
                  </TableRow>
                ) : payments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-sm text-slate-400">Inga betalningar hittades</TableCell>
                  </TableRow>
                ) : (
                  payments.map((p) => {
                    const fullname = `${p.userFirstName || ""} ${p.userLastName || ""}`.trim();
                    const amount = typeof p.pricePaid === "string" ? Number(p.pricePaid) : (p.pricePaid ?? 0);
                    return (
                      <TableRow key={p.id}>
                        <TableCell>{p.purchaseDate ? new Date(p.purchaseDate).toLocaleString("sv-SE") : "-"}</TableCell>
                        <TableCell>{p.paidAt ? new Date(p.paidAt).toLocaleString("sv-SE") : "-"}</TableCell>
                        <TableCell>
                          {p.paymentStatus ? (
                            <Badge variant={p.paymentStatus === "paid" ? "default" : p.paymentStatus === "pending" ? "secondary" : "destructive"}>
                              {statusMap[p.paymentStatus] ?? p.paymentStatus}
                            </Badge>
                          ) : "-"}
                        </TableCell>
                        <TableCell>{p.packageName || "-"}</TableCell>
                        <TableCell>{fullname || "-"}</TableCell>
                        <TableCell>{p.userEmail || "-"}</TableCell>
                        <TableCell>{amount ? currency.format(amount) : "-"}</TableCell>
                        <TableCell className="max-w-[180px] truncate" title={p.paymentReference || undefined}>{p.paymentReference || "-"}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => setRepayId(p.id)}>
                              <LinkIcon className="w-4 h-4 mr-1" /> Betalningslänk
                            </Button>
                            {p.paymentReference ? (
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={async () => {
                                  const t = toast.loading('Hämtar checkout...', { position: 'top-right' });
                                  try {
                                    const res = await fetch(`/api/admin/qliro/payments/${encodeURIComponent(p.id)}/link`, { method: 'POST' });
                                    const data = await res.json();
                                    if (!res.ok) throw new Error(data.error || 'Misslyckades att skapa checkout');
                                    toast.success('Öppnar Qliro...', { id: t, position: 'top-right' });
                                    if (data.checkoutUrl) {
                                      try {
                                        const width = Math.min(480, Math.floor(window.innerWidth * 0.8));
                                        const height = Math.min(780, Math.floor(window.innerHeight * 0.9));
                                        const left = Math.max(0, Math.floor((window.screen.width - width) / 2));
                                        const top = Math.max(0, Math.floor((window.screen.height - height) / 2));
                                        const features = `popup=yes,noopener,noreferrer,resizable=yes,scrollbars=yes,width=${width},height=${height},left=${left},top=${top}`;
                                        try {
                                          const { openQliroPopup } = await import('@/lib/payment/qliro-popup')
                                          if (data.checkoutId) { await openQliroPopup(String(data.checkoutId)); return }
                                        } catch {}
                                        const safeUrl = `/payments/qliro/checkout?orderId=${encodeURIComponent(data.checkoutId || 'admin-reference')}`;
                                        const win = window.open(safeUrl, 'qliro_window', features);
                                        if (win) win.focus();
                                      } catch {}
                                    }
                                  } catch (e: any) {
                                    toast.error(e.message || 'Fel vid öppning av checkout', { id: t, position: 'top-right' });
                                  }
                                }}
                              >
                                Visa checkout
                              </Button>
                            ) : null}
                            <Button size="sm" variant="outline" onClick={() => setRefundId(p.id)}>
                              <RefreshCw className="w-4 h-4 mr-1" /> Återbetalning
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-slate-400">Sida {page} av {totalPages} • Totalt {total}</div>
            <div className="flex items-center gap-2">
              <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
                <SelectTrigger className="w-[110px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 / sida</SelectItem>
                  <SelectItem value="20">20 / sida</SelectItem>
                  <SelectItem value="50">50 / sida</SelectItem>
                  <SelectItem value="100">100 / sida</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                  Föregående
                </Button>
                <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                  Nästa
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Unpaid bookings table */}
      <Card className="mt-6">
        <CardHeader className="pb-3">
          <CardTitle>Obetalda bokningar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Datum</TableHead>
                  <TableHead>Tid</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Elev</TableHead>
                  <TableHead>E-post</TableHead>
                  <TableHead>Belopp</TableHead>
                  <TableHead>Typ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unpaidBookings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-sm text-slate-400">Inga obetalda bokningar</TableCell>
                  </TableRow>
                ) : (
                  unpaidBookings.map((b) => {
                    const amount = typeof b.totalPrice === 'string' ? Number(b.totalPrice) : (b.totalPrice ?? 0);
                    const fullname = `${b.userFirstName || ''} ${b.userLastName || ''}`.trim();
                    return (
                      <TableRow key={b.id}>
                        <TableCell>{b.scheduledDate ? new Date(b.scheduledDate).toLocaleDateString('sv-SE') : '-'}</TableCell>
                        <TableCell>{b.startTime}–{b.endTime}</TableCell>
                        <TableCell>
                          <Badge variant="destructive">Ej betald</Badge>
                        </TableCell>
                        <TableCell>{fullname || '-'}</TableCell>
                        <TableCell>{b.userEmail || '-'}</TableCell>
                        <TableCell>{amount ? currency.format(amount) : '-'}</TableCell>
                        <TableCell>{b.lessonTypeName || 'Körlektion'}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
          <div className="text-sm text-slate-400 mt-2">Totalt: {unpaidTotal}</div>
        </CardContent>
      </Card>
    </div>
  );
}
