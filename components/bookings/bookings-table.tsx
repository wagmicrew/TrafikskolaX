"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2, Calendar } from "lucide-react";
import { toast } from "react-hot-toast";
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
  };

  const handleMoveClick = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowMoveDialog(true);
  };

  const handleDelete = async () => {
    if (!selectedBooking) return;
    
    setIsProcessing(true);
    try {
      const response = await fetch(`/api/bookings/${selectedBooking.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Kunde inte avboka lektionen");
      }

      toast.success("Bokning borttagen");
      
      onRefresh?.();
    } catch (error) {
      console.error("Error deleting booking:", error);
      toast.error(error.message || "Kunde inte ta bort bokningen");
    } finally {
      setIsProcessing(false);
      setShowDeleteDialog(false);
      setSelectedBooking(null);
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
      toast.error(error.message || "Kunde inte flytta bokningen");
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
    <div className={`rounded-lg border shadow-sm bg-white ${compact ? 'text-sm' : ''}`}>
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50/50">
            <TableHead className={`font-semibold text-gray-700 ${compact ? 'py-2' : 'py-3'}`}>Datum & Tid</TableHead>
            <TableHead className={`font-semibold text-gray-700 ${compact ? 'py-2' : 'py-3'}`}>Lektionstyp</TableHead>
            <TableHead className={`font-semibold text-gray-700 ${compact ? 'py-2' : 'py-3'}`}>Status</TableHead>
            <TableHead className={`font-semibold text-gray-700 ${compact ? 'py-2' : 'py-3'}`}>Betalning</TableHead>
            {userRole !== "student" && <TableHead className={`font-semibold text-gray-700 ${compact ? 'py-2' : 'py-3'}`}>Elev</TableHead>}
            {userRole === "admin" && <TableHead className={`font-semibold text-gray-700 ${compact ? 'py-2' : 'py-3'}`}>Handledare</TableHead>}
            <TableHead className={`text-right font-semibold text-gray-700 ${compact ? 'py-2' : 'py-3'}`}>Åtgärder</TableHead>
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
                <TableRow key={booking.id} className={`hover:bg-gray-50/50 transition-colors ${isUpcoming ? 'border-l-4 border-l-blue-400' : ''}`}>
                  <TableCell className="py-4">
                    {formatDateTime(booking.date, booking.time)}
                  </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-900">{booking.type || 'Okänd typ'}</span>
                    {booking.instructorName && (
                      <span className="text-xs text-gray-500">Lärare: {booking.instructorName}</span>
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
                    <div className="font-medium">{booking.studentName}</div>
                  </TableCell>
                )}
                {userRole === "admin" && (
                  <TableCell>
                    <div className="font-medium">{booking.instructorName || "Ej tilldelad"}</div>
                  </TableCell>
                )}
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Öppna meny</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          const detailsUrl = userRole === 'student' 
                            ? `/dashboard/student/bokningar/${booking.id}`
                            : `/dashboard/bookings/${booking.id}`;
                          router.push(detailsUrl);
                        }}
                        className="cursor-pointer"
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        <span>Visa detaljer</span>
                      </DropdownMenuItem>
                      
                      {(userRole === "admin" || userRole === "teacher") && (
                        <DropdownMenuItem
                          onClick={() => handleMoveClick(booking)}
                          className="cursor-pointer"
                          disabled={isProcessing}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          <span>Flytta tid</span>
                        </DropdownMenuItem>
                      )}
                      
                      <DropdownMenuItem
                        onClick={() => handleDeleteClick(booking)}
                        className="cursor-pointer text-destructive focus:text-destructive"
                        disabled={isProcessing}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Avboka</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Är du säker på att du vill avboka denna lektion?</AlertDialogTitle>
            <AlertDialogDescription>
              Denna åtgärd kan inte ångras. Detta kommer att ta bort bokningen permanent.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Avbryt</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isProcessing}
            >
              {isProcessing ? "Bearbetar..." : "Ja, avboka"}
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