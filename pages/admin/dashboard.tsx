import React, { useState } from 'react';
import UserManagement from '@/components/Admin/UserManagement';
import LessonManagement from '@/components/Admin/LessonManagement';
import BookingManagement from '@/components/Admin/BookingManagement';

const AdminDashboard = () => {
  const [activeSection, setActiveSection] = useState('users');

  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>
      <nav className="admin-nav">
        <button 
          className={activeSection === 'users' ? 'active' : ''}
          onClick={() => setActiveSection('users')}
        >
          Users
        </button>
        <button 
          className={activeSection === 'lessons' ? 'active' : ''}
          onClick={() => setActiveSection('lessons')}
        >
          Lessons & Packages
        </button>
        <button 
          className={activeSection === 'bookings' ? 'active' : ''}
          onClick={() => setActiveSection('bookings')}
        >
          Bookings
        </button>
        <button 
          className={activeSection === 'slots' ? 'active' : ''}
          onClick={() => setActiveSection('slots')}
        >
          Slot Settings
        </button>
        <button 
          className={activeSection === 'settings' ? 'active' : ''}
          onClick={() => setActiveSection('settings')}
        >
          Site Settings
        </button>
      </nav>
      
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
