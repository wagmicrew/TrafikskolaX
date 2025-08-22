'use client';

import { useState, useEffect, createContext, useContext, useRef, useCallback } from 'react';
import { JWTPayload } from '@/lib/auth/jwt';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
  user: JWTPayload | null;
  login: (token: string, redirectTo?: string) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<JWTPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const mountedRef = useRef(true);
  const authCheckRef = useRef<Promise<void> | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Enhanced token validation
  const validateToken = useCallback((token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      
      // Check if token is expired
      if (payload.exp && payload.exp < now) {
        console.log('Token expired');
        return false;
      }
      
      // Check if token has required fields
      if (!payload.userId || !payload.email || !payload.role) {
        console.log('Token missing required fields');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  }, []);

  // Token is HTTP-only cookie now; avoid reading from document.cookie (not accessible)
  const getToken = useCallback((): string | null => {
    return null;
  }, []);

  // Set token in localStorage for client-side access (token is already in cookie via server)
  const setToken = useCallback((token: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth-token', token);
    }
  }, []);

  // Clear token from localStorage and cookies
  const clearToken = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth-token');
    }

    if (typeof document !== 'undefined') {
      // Clear the cookie by setting it to expire
      document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax';
    }
  }, []);

  // Get appropriate dashboard path based on user role
  const getDashboardPath = useCallback((role: string): string => {
    switch (role) {
      case 'admin':
        return '/dashboard/admin';
      case 'teacher':
        return '/dashboard/teacher';
      case 'student':
        return '/dashboard/student';
      default:
        return '/';
    }
  }, []);

  // Check authentication status with proper error handling
  const checkAuth = useCallback(async (): Promise<void> => {
    // Prevent multiple simultaneous auth checks
    if (authCheckRef.current) {
      return authCheckRef.current;
    }

    authCheckRef.current = (async () => {
      if (!mountedRef.current) return;

      try {
        // Verify via HTTP-only cookie (no Authorization header)
        const response = await fetch('/api/auth/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        const data = await response.json();

        if (response.ok && data.user && mountedRef.current) {
          setUser(data.user);

          // Auto-redirect if user is on login/register pages
          if (pathname === '/login' || pathname === '/register' || pathname === '/inloggning') {
            const redirectPath = getDashboardPath(data.user.role);
            if (redirectPath && redirectPath !== pathname) {
              // Use setTimeout to avoid React Error #310 during navigation
              setTimeout(() => {
                if (mountedRef.current) {
                  router.push(redirectPath);
                }
              }, 100);
            }
          }
        } else if (mountedRef.current) {
          clearToken();
          setUser(null);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        if (mountedRef.current) {
          clearToken();
          setUser(null);
        }
      } finally {
        authCheckRef.current = null;
      }
    })();

    return authCheckRef.current;
  }, [getToken, validateToken, clearToken, pathname, router, getDashboardPath]);

  // Initialize authentication on mount
  useEffect(() => {
    mountedRef.current = true;

    const initializeAuth = async () => {
      try {
        await checkAuth();
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        if (mountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    // Use setTimeout to prevent React Error #310 during initial render
    const timer = setTimeout(() => {
      initializeAuth();
    }, 0);

    return () => {
      mountedRef.current = false;
      clearTimeout(timer);
    };
  }, [checkAuth]);

  const clearAuthData = useCallback(() => {
    clearToken();
    if (mountedRef.current) {
      setUser(null);
    }
  }, [clearToken]);

  const login = useCallback(async (token?: string, redirectTo?: string) => {
    // If a token is provided (legacy/localStorage), accept it; otherwise rely on cookie
    if (token) {
      if (!validateToken(token)) {
        console.error('Invalid token provided to login');
        return;
      }
      setToken(token);
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (mountedRef.current) {
          setUser(payload);
          const redirectPath = redirectTo || getDashboardPath(payload.role);
          if (redirectPath && redirectPath !== pathname) {
            setTimeout(() => {
              if (mountedRef.current) {
                router.push(redirectPath);
              }
            }, 100);
          }
        }
      } catch (error) {
        console.error('Invalid token format:', error);
        clearAuthData();
      }
      return;
    }

    // Cookie-only flow: refresh from server and redirect
    try {
      await checkAuth();
      if (mountedRef.current && user) {
        const redirectPath = redirectTo || getDashboardPath(user.role);
        if (redirectPath && redirectPath !== pathname) {
          setTimeout(() => {
            if (mountedRef.current) {
              router.push(redirectPath);
            }
          }, 100);
        }
      }
    } catch (e) {
      console.error('Login (cookie) failed to refresh user:', e);
    }
  }, [validateToken, setToken, getDashboardPath, pathname, router, clearAuthData, checkAuth, user]);

  const logout = useCallback(() => {
    clearAuthData();
    
    // Call logout API to invalidate token on server
    fetch('/api/auth/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    }).catch(error => {
      console.error('Logout API error:', error);
      // Don't throw error, just log it since we've already cleared local data
    });

    // Redirect to home page with setTimeout to avoid React Error #310
    setTimeout(() => {
      if (mountedRef.current) {
        router.push('/');
      }
    }, 100);
  }, [clearAuthData, router]);

  const refreshUser = useCallback(async () => {
    await checkAuth();
  }, [checkAuth]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      refreshUser, 
      isLoading,
      isAuthenticated: !!user 
    }}>
      {children}
    </AuthContext.Provider>
  );
}
