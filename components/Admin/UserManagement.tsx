import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import fetcher from '@/lib/fetcher';

const UserManagement = () => {
  const { user, token } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const response = await fetcher('/api/admin/users', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUsers(response || []);
      } catch (error) {
        console.error('Failed to fetch users', error);
      } finally {
         setLoading(false);
      }
    };
    if (user && user.role === 'admin') {
      fetchUsers();
    }
  }, [user, token]);

  const handleToggleInskriven = async (userId, inskriven) => {
    try {
      await fetcher(`/api/admin/users`, {
        method: 'PATCH',
        body: JSON.stringify({ id: userId, inskriven: !inskriven }),
      });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, inskriven: !inskriven } : u));
    } catch (error) {
      console.error('Error toggling inskriven', error);
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      await fetcher(`/api/admin/users?id=${userId}`, {
        method: 'DELETE',
      });
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (error) {
      console.error('Error deleting user', error);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2>User Management</h2>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Inskriven</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>{user.role}</td>
              <td>{user.inskriven ? 'Yes' : 'No'}</td>
              <td>
                <button onClick={() => handleToggleInskriven(user.id, user.inskriven)}>
                  Toggle Inskriven
                </button>
                <button onClick={() => handleDeleteUser(user.id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserManagement;
