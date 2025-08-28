"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { getErrorMessage } from "@/utils/getErrorMessage";

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface Booking {
  id: string;
  date: string;
  time: string;
  type: string;
  status: "confirmed" | "pending" | "cancelled" | "completed";
  paymentStatus: "paid" | "unpaid" | "partial";
  studentName: string;
  instructorName?: string;
  vehicle?: string;
  notes?: string;
  price: number;
  paidAmount: number;
  createdAt: string;
  updatedAt: string;
  betalhubben?: string;
}

interface BookingsTableProps {
  bookings: Booking[];
  userRole: 'student' | 'teacher' | 'admin';
  onRefresh?: () => void;
  compact?: boolean;
}

export function BookingsTable({ bookings, userRole, onRefresh, compact = false }: BookingsTableProps) {
  const router = useRouter();
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cancellationReason, setCancellationReason] = useState<string>("");
  const [cancellationError, setCancellationError] = useState<string>("");

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "confirmed": return "default";
      case "completed": return "secondary";
      case "cancelled": return "destructive";
      case "pending": return "outline";
      default: return "outline";
    }
  };

  const getPaymentStatusVariant = (status: string) => {
    switch (status) {
      case "paid": return "default";
      case "unpaid": return "destructive";
      case "partial": return "outline";
      default: return "outline";
    }
  };

  const handleDeleteClick = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowDeleteDialog(true);
    setCancellationReason("");
    setCancellationError("");
  };

  const handleMoveClick = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowMoveDialog(true);
  };

  const handleDelete = async () => {
    if (!selectedBooking) return;
    if (!cancellationReason.trim()) {
      setCancellationError("Vänligen ange en anledning för avbokning");
      return;
    }
    
    setIsProcessing(true);
    try {
      const loadingId = toast.loading("Avbokar...");
      const response = await fetch(`/api/bookings/${selectedBooking.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: cancellationReason }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Kunde inte avboka lektionen");
      }

      toast.success("Bokningen har avbokats.", { id: loadingId });
      
      onRefresh?.();
    } catch (error) {
      console.error("Error deleting booking:", error);
      toast.error(getErrorMessage(error, "Kunde inte avboka bokningen"));
    } finally {
      setIsProcessing(false);
      setShowDeleteDialog(false);
      setSelectedBooking(null);
      setCancellationReason("");
      setCancellationError("");
    }
  };

  const handleMove = async (newDate: Date) => {
    if (!selectedBooking) return;
    
    setIsProcessing(true);
    try {
      const response = await fetch(`/api/bookings/${selectedBooking.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date: newDate.toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error("Kunde inte flytta bokningen");
      }

      toast.success("Bokning flyttad");
      
      onRefresh?.();
    } catch (error) {
      console.error("Error moving booking:", error);
      toast.error(getErrorMessage(error, "Kunde inte flytta bokningen"));
    } finally {
      setIsProcessing(false);
      setShowMoveDialog(false);
      setSelectedBooking(null);
    }
  };

  const formatDateTime = (dateString: string, timeString: string) => {
    try {
      // Handle both ISO format and simple date format
      let date;
      if (dateString.includes('T')) {
        date = new Date(dateString);
      } else {
        const datetimeString = `${dateString}T${timeString || '00:00'}`;
        date = new Date(datetimeString);
      }

      if (isNaN(date.getTime())) throw new Error('Invalid date');
      
      const now = new Date();
      const isUpcoming = date >= now;
      
      return (
        <div className="flex flex-col space-y-1">
          <span className={`font-semibold text-sm ${isUpcoming ? 'text-blue-700' : 'text-gray-700'}`}>
            {format(date, "EEEE d MMMM", { locale: sv })}
          </span>
          <span className={`text-xs ${isUpcoming ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
            {format(date, "HH:mm", { locale: sv })}
          </span>
          {isUpcoming && (
            <span className="text-xs text-green-600 font-medium">Kommande</span>
          )}
        </div>
      );
    } catch {
      return (
        <div className="flex flex-col">
          <span className="font-medium text-red-600 text-sm">Ogiltigt datum</span>
          <span className="text-xs text-red-500">Kontakta support</span>
        </div>
      );
    }
  };

  return (
    <div className={`rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 text-white shadow-xl ${compact ? 'text-sm' : ''}`}>
      <Table>
        <TableHeader>
          <TableRow className="bg-white/5">
            <TableHead className={`font-semibold text-white ${compact ? 'py-2' : 'py-3'}`}>Datum & Tid</TableHead>
            <TableHead className={`font-semibold text-white ${compact ? 'py-2' : 'py-3'}`}>Lektionstyp</TableHead>
            <TableHead className={`font-semibold text-white ${compact ? 'py-2' : 'py-3'}`}>Status</TableHead>
            <TableHead className={`font-semibold text-white ${compact ? 'py-2' : 'py-3'}`}>Betalning</TableHead>
            {userRole !== "student" && <TableHead className={`font-semibold text-white ${compact ? 'py-2' : 'py-3'}`}>Elev</TableHead>}
            {userRole === "admin" && <TableHead className={`font-semibold text-white ${compact ? 'py-2' : 'py-3'}`}>Handledare</TableHead>}
            <TableHead className={`text-right font-semibold text-white ${compact ? 'py-2' : 'py-3'}`}>Åtgärder</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bookings.length === 0 ? (
            <TableRow>
              <TableCell colSpan={userRole === "admin" ? 7 : userRole === "teacher" ? 6 : 5} className="h-24 text-center">
                Inga bokningar hittades
              </TableCell>
            </TableRow>
          ) : (
            bookings.map((booking) => {
              const bookingDate = new Date(`${booking.date}T${booking.time}`);
              const isUpcoming = bookingDate >= new Date() && booking.status !== 'completed' && booking.status !== 'cancelled';
              
              return (
                <TableRow
                  key={booking.id}
                  className={`transition-all ${isUpcoming ? 'border-l-4 border-l-blue-400' : ''} hover:outline hover:outline-1 hover:outline-emerald-400 hover:outline-offset-[-2px]`}
                >
                  <TableCell className="py-4">
                    {formatDateTime(booking.date, booking.time)}
                  </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium text-white">{booking.type || 'Okänd typ'}</span>
                    {booking.instructorName && (
                      <span className="text-xs text-slate-300">Lärare: {booking.instructorName}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(booking.status)}>
                    {booking.status === "confirmed" && "Bekräftad"}
                    {booking.status === "pending" && "Väntar"}
                    {booking.status === "cancelled" && "Inställd"}
                    {booking.status === "completed" && "Genomförd"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={getPaymentStatusVariant(booking.paymentStatus)}>
                    {booking.paymentStatus === "paid" && "Betald"}
                    {booking.paymentStatus === "unpaid" && "Obetald"}
                    {booking.paymentStatus === "partial" && "Delvis betald"}
                  </Badge>
                </TableCell>
                {userRole !== "student" && (
                  <TableCell>
                    <div className="font-medium text-white">{booking.studentName}</div>
                  </TableCell>
                )}
                {userRole === "admin" && (
                  <TableCell>
                    <div className="font-medium text-white">{booking.instructorName || "Ej tilldelad"}</div>
                  </TableCell>
                )}
                <TableCell className="text-right">
                  {userRole === 'student' ? (
                    <div className="flex justify-end items-center gap-2">
                      {booking.paymentStatus === 'unpaid' && (
                        <Button
                          variant="default"
                          size="sm"
                          className="h-8 px-3 text-xs bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => router.push(`/booking/payment/${booking.id}`)}
                        >
                          Betala
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-3 text-xs border-white/20 text-white hover:bg-white/10"
                        onClick={() => router.push(`/dashboard/student/bokningar/${booking.id}`)}
                      >
                        Visa detaljer
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="h-8 px-3 text-xs"
                        disabled={isProcessing}
                        onClick={() => handleDeleteClick(booking)}
                      >
                        Avboka
                      </Button>
                    </div>
                  ) : (
                    <div className="flex justify-end items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-3 text-xs"
                        onClick={() => router.push(`/dashboard/bookings/${booking.id}`)}
                      >
                        Visa detaljer
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="h-8 px-3 text-xs"
                        disabled={isProcessing}
                        onClick={() => handleDeleteClick(booking)}
                      >
                        Avboka
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="z-[11000] bg-slate-900/95 border border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Avboka lektion</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-300">
              Är du säker på att du vill avboka denna lektion? Denna åtgärd kan inte ångras.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="mt-2">
            <label htmlFor="cancel-reason" className="block text-sm font-medium text-white mb-2">Anledning för avbokning *</label>
            <textarea
              id="cancel-reason"
              rows={3}
              value={cancellationReason}
              onChange={(e) => { setCancellationReason(e.target.value); setCancellationError(""); }}
              disabled={isProcessing}
              placeholder="Beskriv kort varför du avbokar"
              className="w-full rounded-md bg-white/5 border border-white/10 text-white placeholder:text-white/40 p-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            {cancellationError && (
              <p className="mt-2 text-sm text-red-300">{cancellationError}</p>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel 
              disabled={isProcessing}
              className="bg-white/10 hover:bg-white/20 border border-white/20 text-white"
            >
              Behåll
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-500 text-white"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <span className="inline-flex items-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                  Avbokar...
                </span>
              ) : (
                "Ja, avboka"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showMoveDialog} onOpenChange={setShowMoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Flytta bokning</AlertDialogTitle>
            <AlertDialogDescription>
              Välj nytt datum och tid för denna lektion.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Datumväljare kommer att implementeras här
            </p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Avbryt</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => handleMove(new Date())}
              disabled={isProcessing}
            >
              {isProcessing ? "Sparar..." : "Spara ändringar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}