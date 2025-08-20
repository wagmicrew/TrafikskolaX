import React, { useEffect, useState, useCallback, memo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import fetcher from '@/lib/fetcher';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  inskriven: boolean;
}

const UserManagement = memo(() => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  
  const fetchUsers = useCallback(async () => {
    if (!user || user.role !== 'admin') return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('auth-token');
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
  }, [user]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleInskriven = useCallback(async (userId: string, inskriven: boolean) => {
    try {
      await fetcher(`/api/admin/users`, {
        method: 'PATCH',
        body: JSON.stringify({ id: userId, inskriven: !inskriven }),
      });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, inskriven: !inskriven } : u));
    } catch (error) {
      console.error('Error toggling inskriven', error);
    }
  }, []);

  const handleDeleteUser = useCallback(async (userId: string) => {
    try {
      await fetcher(`/api/admin/users?id=${userId}`, {
        method: 'DELETE',
      });
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (error) {
      console.error('Error deleting user', error);
    }
  }, []);

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
});

UserManagement.displayName = 'UserManagement';

export default UserManagement;
