"use client";

import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Spinner } from 'flowbite-react';
import { Calendar, Clock, User, Car, CreditCard, MapPin, Phone, Mail } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { toast } from 'sonner';

interface Booking {
  id: string;
  lessonType?: {
    name: string;
    durationMinutes: number;
  };
  scheduledDate: string;
  startTime: string;
  endTime: string;
  status: string;
  paymentStatus: string;
  totalPrice: number;
  teacher?: {
    firstName: string;
    lastName: string;
    phone?: string;
    email?: string;
  };
  car?: {
    name: string;
    brand: string;
    model: string;
  };
  transmissionType?: string;
  notes?: string;
  createdAt: string;
}

export default function StudentBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed' | 'cancelled'>('all');
  const { user } = useAuth();

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/student/bookings');
      if (response.ok) {
        const data = await response.json();
        setBookings(data.bookings || []);
      } else {
        toast.error('Kunde inte hämta bokningar');
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Ett fel uppstod vid hämtning av bokningar');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed': return 'success';
      case 'pending': return 'warning';
      case 'cancelled': return 'failure';
      case 'completed': return 'info';
      default: return 'gray';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid': return 'success';
      case 'pending': return 'warning';
      case 'failed': return 'failure';
      default: return 'gray';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sv-SE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return timeString.slice(0, 5); // HH:MM format
  };

  const filteredBookings = bookings.filter(booking => {
    if (filter === 'all') return true;
    return booking.status.toLowerCase() === filter;
  });

  const upcomingBookings = bookings.filter(booking => {
    const bookingDate = new Date(booking.scheduledDate);
    const today = new Date();
    return bookingDate >= today && booking.status !== 'cancelled';
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <Spinner size="xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mina Bokningar</h1>
          <p className="text-gray-600">Hantera och se dina körlektion bokningar</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <div className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Totalt</p>
                  <p className="text-2xl font-bold text-gray-900">{bookings.length}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Clock className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Kommande</p>
                  <p className="text-2xl font-bold text-gray-900">{upcomingBookings.length}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <CreditCard className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Betalda</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {bookings.filter(b => b.paymentStatus === 'paid').length}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <User className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Genomförda</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {bookings.filter(b => b.status === 'completed').length}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Button
            color={filter === 'all' ? 'blue' : 'gray'}
            onClick={() => setFilter('all')}
            size="sm"
          >
            Alla ({bookings.length})
          </Button>
          <Button
            color={filter === 'upcoming' ? 'blue' : 'gray'}
            onClick={() => setFilter('upcoming')}
            size="sm"
          >
            Kommande ({upcomingBookings.length})
          </Button>
          <Button
            color={filter === 'completed' ? 'blue' : 'gray'}
            onClick={() => setFilter('completed')}
            size="sm"
          >
            Genomförda ({bookings.filter(b => b.status === 'completed').length})
          </Button>
          <Button
            color={filter === 'cancelled' ? 'blue' : 'gray'}
            onClick={() => setFilter('cancelled')}
            size="sm"
          >
            Avbokade ({bookings.filter(b => b.status === 'cancelled').length})
          </Button>
        </div>

        {/* Bookings List */}
        <div className="space-y-4">
          {filteredBookings.length === 0 ? (
            <Card>
              <div className="p-8 text-center">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Inga bokningar hittades</h3>
                <p className="text-gray-500">
                  {filter === 'all' 
                    ? 'Du har inga bokningar än. Boka din första körlektion!'
                    : `Du har inga ${filter === 'upcoming' ? 'kommande' : filter === 'completed' ? 'genomförda' : 'avbokade'} bokningar.`
                  }
                </p>
                <Button href="/boka-korning" className="mt-4">
                  Boka körlektion
                </Button>
              </div>
            </Card>
          ) : (
            filteredBookings.map((booking) => (
              <Card key={booking.id} className="hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                    {/* Main Info */}
                    <div className="flex-1 mb-4 lg:mb-0">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {booking.lessonType?.name || 'Okänd lektionstyp'}
                          </h3>
                          <div className="flex items-center text-gray-600 text-sm space-x-4">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {formatDate(booking.scheduledDate)}
                            </div>
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-2">
                          <Badge color={getStatusColor(booking.status)} size="sm">
                            {booking.status === 'confirmed' ? 'Bekräftad' :
                             booking.status === 'pending' ? 'Väntar' :
                             booking.status === 'cancelled' ? 'Avbokad' :
                             booking.status === 'completed' ? 'Genomförd' : booking.status}
                          </Badge>
                          <Badge color={getPaymentStatusColor(booking.paymentStatus)} size="sm">
                            {booking.paymentStatus === 'paid' ? 'Betald' :
                             booking.paymentStatus === 'pending' ? 'Väntar betalning' :
                             booking.paymentStatus === 'failed' ? 'Betalning misslyckades' : booking.paymentStatus}
                          </Badge>
                        </div>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                        {booking.teacher && (
                          <div className="flex items-center text-gray-600">
                            <User className="h-4 w-4 mr-2" />
                            <div>
                              <p className="font-medium">Instruktör</p>
                              <p>{booking.teacher.firstName} {booking.teacher.lastName}</p>
                              {booking.teacher.phone && (
                                <div className="flex items-center mt-1">
                                  <Phone className="h-3 w-3 mr-1" />
                                  <span className="text-xs">{booking.teacher.phone}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {booking.car && (
                          <div className="flex items-center text-gray-600">
                            <Car className="h-4 w-4 mr-2" />
                            <div>
                              <p className="font-medium">Bil</p>
                              <p>{booking.car.name}</p>
                              <p className="text-xs">{booking.car.brand} {booking.car.model}</p>
                              {booking.transmissionType && (
                                <p className="text-xs capitalize">{booking.transmissionType}</p>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="flex items-center text-gray-600">
                          <CreditCard className="h-4 w-4 mr-2" />
                          <div>
                            <p className="font-medium">Pris</p>
                            <p className="text-lg font-semibold text-gray-900">
                              {booking.totalPrice.toLocaleString('sv-SE')} kr
                            </p>
                          </div>
                        </div>
                      </div>

                      {booking.notes && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-600">
                            <strong>Anteckningar:</strong> {booking.notes}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col space-y-2 lg:ml-6">
                      <Button
                        href={`/dashboard/student/bokningar/${booking.id}`}
                        size="sm"
                        color="blue"
                      >
                        Visa detaljer
                      </Button>
                      
                      {booking.status === 'confirmed' && new Date(booking.scheduledDate) > new Date() && (
                        <Button
                          size="sm"
                          color="gray"
                          onClick={() => {
                            // TODO: Implement cancel booking
                            toast.info('Avbokning kommer snart');
                          }}
                        >
                          Avboka
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 flex justify-center">
          <Button href="/boka-korning" size="lg">
            Boka ny körlektion
          </Button>
        </div>
      </div>
    </div>
  );
}
