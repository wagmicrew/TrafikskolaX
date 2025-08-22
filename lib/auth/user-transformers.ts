import { JWTPayload } from './jwt';
import { AuthUser } from './server-auth';

/**
 * Type transformation utilities for converting between different user interfaces
 * This helps maintain consistency across the application when different components
 * expect different user interface shapes
 */

// Base user interfaces used across the application
export interface StandardUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

export interface PackagesUser {
  id: string;
  email: string;
  name: string; // Combined firstName + lastName
  role: string;
}

export interface StudentFeedbackUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

/**
 * Transform JWTPayload to StandardUser interface
 */
export function transformJWTPayloadToStandardUser(jwtPayload: JWTPayload): StandardUser {
  return {
    id: jwtPayload.userId,
    firstName: jwtPayload.firstName,
    lastName: jwtPayload.lastName,
    email: jwtPayload.email,
    role: jwtPayload.role,
  };
}

/**
 * Transform AuthUser to StandardUser interface
 */
export function transformAuthUserToStandardUser(authUser: AuthUser): StandardUser {
  return {
    id: authUser.id,
    firstName: authUser.firstName,
    lastName: authUser.lastName,
    email: authUser.email,
    role: authUser.role,
  };
}

/**
 * Transform AuthUser to PackagesUser interface
 * (Packages store expects a combined name field)
 */
export function transformAuthUserToPackagesUser(authUser: AuthUser): PackagesUser {
  return {
    id: authUser.id,
    email: authUser.email,
    name: `${authUser.firstName} ${authUser.lastName}`,
    role: authUser.role,
  };
}

/**
 * Transform JWTPayload to PackagesUser interface
 */
export function transformJWTPayloadToPackagesUser(jwtPayload: JWTPayload): PackagesUser {
  return {
    id: jwtPayload.userId,
    email: jwtPayload.email,
    name: `${jwtPayload.firstName} ${jwtPayload.lastName}`,
    role: jwtPayload.role,
  };
}

/**
 * Transform AuthUser to StudentFeedbackUser interface
 */
export function transformAuthUserToStudentFeedbackUser(authUser: AuthUser): StudentFeedbackUser {
  return {
    id: authUser.id,
    firstName: authUser.firstName,
    lastName: authUser.lastName,
    email: authUser.email,
    role: authUser.role,
  };
}

/**
 * Transform JWTPayload to StudentFeedbackUser interface
 */
export function transformJWTPayloadToStudentFeedbackUser(jwtPayload: JWTPayload): StudentFeedbackUser {
  return {
    id: jwtPayload.userId,
    firstName: jwtPayload.firstName,
    lastName: jwtPayload.lastName,
    email: jwtPayload.email,
    role: jwtPayload.role,
  };
}

/**
 * Generic user transformation function
 * Automatically detects the source type and transforms to the target interface
 */
export function transformUser<T extends StandardUser | PackagesUser | StudentFeedbackUser>(
  sourceUser: AuthUser | JWTPayload,
  targetInterface: 'standard' | 'packages' | 'student-feedback'
): T {
  const isJWTPayload = 'userId' in sourceUser;

  switch (targetInterface) {
    case 'standard':
      return (isJWTPayload
        ? transformJWTPayloadToStandardUser(sourceUser as JWTPayload)
        : transformAuthUserToStandardUser(sourceUser as AuthUser)) as T;

    case 'packages':
      return (isJWTPayload
        ? transformJWTPayloadToPackagesUser(sourceUser as JWTPayload)
        : transformAuthUserToPackagesUser(sourceUser as AuthUser)) as T;

    case 'student-feedback':
      return (isJWTPayload
        ? transformJWTPayloadToStudentFeedbackUser(sourceUser as JWTPayload)
        : transformAuthUserToStudentFeedbackUser(sourceUser as AuthUser)) as T;

    default:
      throw new Error(`Unknown target interface: ${targetInterface}`);
  }
}
