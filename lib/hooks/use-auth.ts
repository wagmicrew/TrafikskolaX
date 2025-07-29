"use client";

import { useState, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // This is a simplified auth hook
    // In a real implementation, you'd fetch the user from context or localStorage
    // For now, we'll just return a placeholder
    setLoading(false);
  }, []);

  return {
    user,
    loading,
    login: (userData: User) => setUser(userData),
    logout: () => setUser(null)
  };
};
