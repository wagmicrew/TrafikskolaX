import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { ExportSchedule } from '@/components/Admin/ExportSchedule';

// Dynamic imports to avoid SSR issues with auth hooks
const UserManagement = dynamic(() => import('@/components/Admin/UserManagement'), {
  ssr: false,
  loading: () => <div>Loading...</div>
});
const LessonManagement = dynamic(() => import('@/components/Admin/LessonManagement'), {
  ssr: false,
  loading: () => <div>Loading...</div>
});
const BookingManagement = dynamic(() => import('@/components/Admin/BookingManagement'), {
  ssr: false,
  loading: () => <div>Loading...</div>
});

const AdminDashboard = () => {
  const [activeSection, setActiveSection] = useState('users');

  return (
    <div className="admin-dashboard p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
        <ExportSchedule />
      </div>
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          <button
            onClick={() => setActiveSection('users')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeSection === 'users' 
              ? 'border-blue-500 text-blue-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            Användare
          </button>
          <button
            onClick={() => setActiveSection('lessons')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeSection === 'lessons' 
              ? 'border-blue-500 text-blue-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            Lektioner
          </button>
          <button
            onClick={() => setActiveSection('bookings')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeSection === 'bookings' 
              ? 'border-blue-500 text-blue-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            Bokningar
          </button>
          <button
            onClick={() => setActiveSection('slots')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeSection === 'slots' 
              ? 'border-blue-500 text-blue-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            Tidsluckor
          </button>
          <button
            onClick={() => setActiveSection('settings')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeSection === 'settings' 
              ? 'border-blue-500 text-blue-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            Inställningar
          </button>
        </nav>
      </div>
      
      <div className="admin-content">
        {activeSection === 'users' && <UserManagement />}
        {activeSection === 'lessons' && <LessonManagement />}
        {activeSection === 'bookings' && <BookingManagement />}
        {activeSection === 'slots' && (
          <div>
            <h2>Slot Settings</h2>
            <p>Slot settings management coming soon...</p>
          </div>
        )}
        {activeSection === 'settings' && (
          <div>
            <h2>Site Settings</h2>
            <p>Site settings management coming soon...</p>
          </div>
        )}
      </div>
      
      <style jsx>{`
        .admin-dashboard {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }
        
        .admin-nav {
          display: flex;
          gap: 10px;
          margin-bottom: 30px;
          border-bottom: 2px solid #e0e0e0;
          padding-bottom: 10px;
        }
        
        .admin-nav button {
          padding: 10px 20px;
          border: none;
          background: none;
          cursor: pointer;
          font-size: 16px;
          color: #666;
          transition: all 0.3s;
        }
        
        .admin-nav button:hover {
          color: #000;
        }
        
        .admin-nav button.active {
          color: #0066cc;
          border-bottom: 2px solid #0066cc;
        }
        
        .admin-content {
          background: #f9f9f9;
          padding: 20px;
          border-radius: 8px;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          background: white;
          margin-top: 20px;
        }
        
        th, td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #e0e0e0;
        }
        
        th {
          background: #f5f5f5;
          font-weight: 600;
        }
        
        button {
          padding: 6px 12px;
          margin: 0 4px;
          border: 1px solid #ddd;
          background: white;
          cursor: pointer;
          border-radius: 4px;
          transition: all 0.2s;
        }
        
        button:hover {
          background: #f0f0f0;
        }
        
        select {
          padding: 4px 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;
