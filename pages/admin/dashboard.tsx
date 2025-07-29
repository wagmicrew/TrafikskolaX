import React from 'react';
import UserManagement from '@/components/Admin/UserManagement';

const AdminDashboard = () => {
  return (
    <div>
      <h1>Admin Dashboard</h1>
      <nav>
        <ul>
          <li><a href="#users">Users</a></li>
          <li><a href="#lessons">Lessons & Packages</a></li>
          <li><a href="#bookings">Bookings</a></li>
          <li><a href="#slots">Slot Settings</a></li>
          <li><a href="#settings">Site Settings</a></li>
        </ul>
      </nav>
      <section id="users">
        <UserManagement />
      </section>
      {/* Placeholder for other sections */}
      <section id="lessons">
        <h2>Lessons & Packages</h2>
        {/* Lesson management component to be implemented */}
      </section>
      <section id="bookings">
        <h2>Bookings</h2>
        {/* Booking management component to be implemented */}
      </section>
      <section id="slots">
        <h2>Slot Settings</h2>
        {/* Slot management component to be implemented */}
      </section>
      <section id="settings">
        <h2>Site Settings</h2>
        {/* Site settings management component to be implemented */}
      </section>
    </div>
  );
};

export default AdminDashboard;
