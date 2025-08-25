"use client";

import React, { useEffect, useState, useCallback, memo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import fetcher from '@/lib/fetcher';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { OrbSpinner } from '@/components/ui/orb-loader';

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
    if (!user || !user.role || user.role !== 'admin') return;
    
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

  if (loading) return (
    <div className="flex items-center justify-center py-12">
      <OrbSpinner size="md" />
    </div>
  );

  return (
    <Card className="shadow-sm border border-gray-200">
      <CardHeader>
        <CardTitle className="text-xl font-semibold tracking-tight">Användarhantering</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Namn</TableHead>
              <TableHead>E-post</TableHead>
              <TableHead>Roll</TableHead>
              <TableHead>Inskriven</TableHead>
              <TableHead>Åtgärder</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.name}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>{u.role}</TableCell>
                <TableCell>{u.inskriven ? 'Ja' : 'Nej'}</TableCell>
                <TableCell className="space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleToggleInskriven(u.id, u.inskriven)}>
                    Växla inskriven
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => handleDeleteUser(u.id)}>
                    Ta bort
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
});

UserManagement.displayName = 'UserManagement';

export default UserManagement;
