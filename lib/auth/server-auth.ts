import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken, JWTPayload } from './jwt';

export interface AuthUser {
  id: string; // Changed from userId to id to match database
  userId: string; // Keep both for backward compatibility
  email: string;
  role: 'student' | 'teacher' | 'admin';
  firstName: string;
  lastName: string;
}

export async function getServerUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;

  if (!token) {
    return null;
  }

  try {
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return null;
    }

    // Create user object with both id and userId for compatibility
    const user: AuthUser = {
      id: decoded.userId, // Map userId to id
      userId: decoded.userId, // Keep original
      email: decoded.email,
      role: decoded.role,
      firstName: decoded.firstName,
      lastName: decoded.lastName,
    };
    
    return user;
  } catch (error) {
    console.error('JWT verification error:', error);
    return null;
  }
}

export async function requireAuth(requiredRoles?: ('student' | 'teacher' | 'admin')[] | 'student' | 'teacher' | 'admin') {
  const user = await getServerUser();
  
  if (!user) {
    redirect('/inloggning');
  }

  // Handle both single role and array of roles
  if (requiredRoles) {
    const allowedRoles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    if (!allowedRoles.includes(user.role)) {
      // Redirect to appropriate dashboard based on role
      switch (user.role) {
        case 'admin':
          redirect('/dashboard/admin');
          break;
        case 'teacher':
          redirect('/dashboard/teacher');
          break;
        case 'student':
        default:
          redirect('/dashboard/student');
          break;
      }
    }
  }

  return user;
}

// API-specific authentication that returns result object
export async function requireAuthAPI(requiredRole?: 'student' | 'teacher' | 'admin'): Promise<{ success: true; user: AuthUser } | { success: false; error: string; status: number }> {
  const user = await getServerUser();
  
  if (!user) {
    return { success: false, error: 'Authentication required', status: 401 };
  }

  if (requiredRole && user.role !== requiredRole) {
    return { success: false, error: 'Insufficient permissions', status: 403 };
  }

  return { success: true, user };
}
