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
  useQliroListener({
    onCompleted: () => { try { window.location.href = '/booking/success?admin=1' } catch {} },
    onDeclined: (reason, message) => { toast.error(`Betalning nekades: ${reason || ''} ${message || ''}`) },
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
  const [testSSN, setTestSSN] = useState<string>("");
  const [testQliroOpen, setTestQliroOpen] = useState(false);
  const [testQliroUrl, setTestQliroUrl] = useState("");
  const [selectedPaymentIdOverride, setSelectedPaymentIdOverride] = useState<string>("");

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
      const [uRes, pRes] = await Promise.all([
        // Use admin-scoped endpoint that filters out temporary users reliably
        fetch("/api/admin/students?excludeTemp=true"),
        fetch("/api/packages"),
      ]);
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
      const win = window.open(`/payments/qliro/checkout?url=${encodeURIComponent(url)}`, "_blank");
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
        window.open(data.checkoutUrl, '_blank');
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
          const safeUrl = `/payments/qliro/checkout?url=${encodeURIComponent(data.checkoutUrl)}`
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
      const res = await fetch('/api/payments/qliro/create-checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: 1, reference: 'test_admin_ui', description: 'Admin UI test', returnUrl: `${window.location.origin}/payments/qliro/return?admin=1` }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || 'Misslyckades att skapa testorder');
      toast.success('Testorder skapad – öppnar Qliro...', { id: t, position: 'top-right' });
      if (data.checkoutUrl) {
        try {
          const width = Math.min(480, Math.floor(window.innerWidth * 0.8));
          const height = Math.min(780, Math.floor(window.innerHeight * 0.9));
          const left = Math.max(0, Math.floor((window.screen.width - width) / 2));
          const top = Math.max(0, Math.floor((window.screen.height - height) / 2));
          const features = `popup=yes,noopener,noreferrer,resizable=yes,scrollbars=yes,width=${width},height=${height},left=${left},top=${top}`;
          const safeUrl = `/payments/qliro/checkout?url=${encodeURIComponent(data.checkoutUrl)}`
          const win = window.open(safeUrl, 'qliro_window', features);
          if (win) win.focus();
        } catch {}
      }
    } catch (err: any) {
      toast.error(err.message || 'Misslyckades att skapa testorder', { id: t, position: 'top-right' });
    } finally {
      setCreatingTest(false);
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
                    setTestQliroUrl(data.checkoutUrl);
                    setTestQliroOpen(true);
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
                                    const res = await fetch('/api/payments/qliro/create-for-reference', {
                                      method: 'POST', headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ reference: p.paymentReference })
                                    });
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
                                        const safeUrl = `/payments/qliro/checkout?url=${encodeURIComponent(data.checkoutUrl)}`
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
