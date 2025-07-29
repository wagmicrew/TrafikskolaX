import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { redirect } from 'next/navigation';

export interface AuthUser {
  userId: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  firstName: string;
  lastName: string;
}

export async function getServerUser(): Promise<AuthUser | null> {
  const cookieStore = cookies();
  const token = cookieStore.get('auth-token')?.value;

  if (!token) {
    return null;
  }

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('JWT_SECRET not configured');
      return null;
    }

    const decoded = jwt.verify(token, secret) as AuthUser;
    return decoded;
  } catch (error) {
    console.error('JWT verification error:', error);
    return null;
  }
}

export async function requireAuth(requiredRole?: 'student' | 'teacher' | 'admin') {
  const user = await getServerUser();
  
  if (!user) {
    redirect('/inloggning');
  }

  if (requiredRole && user.role !== requiredRole) {
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

  return user;
}
