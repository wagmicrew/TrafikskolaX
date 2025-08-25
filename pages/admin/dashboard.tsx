import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { OrbSpinner } from '@/components/ui/orb-loader';
// ExportSchedule is a client component; import dynamically and pass required props
const ExportSchedule = dynamic(() => import('@/components/Admin/ExportSchedule'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center p-6">
      <OrbSpinner size="sm" />
    </div>
  )
});

// Dynamic imports to avoid SSR issues with auth hooks
const UserManagement = dynamic(() => import('@/components/Admin/UserManagement'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center p-10">
      <OrbSpinner size="md" />
    </div>
  )
});
const LessonManagement = dynamic(() => import('@/components/Admin/LessonManagement'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center p-10">
      <OrbSpinner size="md" />
    </div>
  )
});
const BookingManagement = dynamic(() => import('@/components/Admin/BookingManagement'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center p-10">
      <OrbSpinner size="md" />
    </div>
  )
});

const AdminDashboard = () => {
  const [activeSection, setActiveSection] = useState('users');

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 antialiased">
      <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-semibold tracking-tight">Admin Portal</h1>
          <ExportSchedule role="admin" />
        </div>

        <Card className="mb-6 shadow-sm border border-gray-200">
          <CardContent className="p-2">
            <nav className="flex items-center gap-2 overflow-x-auto">
              <Button
                variant={activeSection === 'users' ? 'primary' : 'outline'}
                size="sm"
                className={activeSection === 'users' ? 'shadow' : ''}
                onClick={() => setActiveSection('users')}
              >
                Användare
              </Button>
              <Button
                variant={activeSection === 'lessons' ? 'primary' : 'outline'}
                size="sm"
                className={activeSection === 'lessons' ? 'shadow' : ''}
                onClick={() => setActiveSection('lessons')}
              >
                Lektioner
              </Button>
              <Button
                variant={activeSection === 'bookings' ? 'primary' : 'outline'}
                size="sm"
                className={activeSection === 'bookings' ? 'shadow' : ''}
                onClick={() => setActiveSection('bookings')}
              >
                Bokningar
              </Button>
              <Button
                variant={activeSection === 'slots' ? 'primary' : 'outline'}
                size="sm"
                className={activeSection === 'slots' ? 'shadow' : ''}
                onClick={() => setActiveSection('slots')}
              >
                Tidsluckor
              </Button>
              <Button
                variant={activeSection === 'settings' ? 'primary' : 'outline'}
                size="sm"
                className={activeSection === 'settings' ? 'shadow' : ''}
                onClick={() => setActiveSection('settings')}
              >
                Inställningar
              </Button>
            </nav>
          </CardContent>
        </Card>

        <Card className="shadow-sm border border-gray-200">
          <CardContent className="p-6">
            {activeSection === 'users' && <UserManagement />}
            {activeSection === 'lessons' && <LessonManagement />}
            {activeSection === 'bookings' && <BookingManagement />}
            {activeSection === 'slots' && (
              <div className="text-center py-12">
                <p className="text-gray-600 font-medium">Hantering av tidsluckor kommer snart...</p>
              </div>
            )}
            {activeSection === 'settings' && (
              <div className="text-center py-12">
                <p className="text-gray-600 font-medium">Hantering av webbplatsinställningar kommer snart...</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
