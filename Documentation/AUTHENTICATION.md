# Authentication System Documentation

## Overview
The authentication system uses JWT (JSON Web Tokens) for secure user authentication and authorization. It supports multiple user roles and integrates with the database for user management.

## JWT Implementation

### Token Generation
- Uses `jsonwebtoken` library
- 7-day token expiration
- Signed with app secret key
- Contains user ID and role in payload

### Token Structure
```typescript
{
  userId: string,
  email: string,
  role: 'student' | 'teacher' | 'admin',
  iat: number,  // issued at
  exp: number   // expiration time
}
```

## User Roles

### 1. Student
- Can book lessons
- View their schedule
- Access learning materials
- Submit feedback

### 2. Teacher
- All student permissions
- View assigned lessons
- Submit student feedback
- Access teaching materials

### 3. Admin
- Full system access
- User management
- System configuration
- Reporting and analytics

## Authentication Flow

### 1. Registration
1. User submits registration form
2. Server validates input
3. Creates user in database (with hashed password)
4. Sends welcome email
5. Returns success response

### 2. Login
1. User submits credentials
2. Server verifies credentials
3. Generates JWT token
4. Returns token in HTTP-only cookie
5. Client stores token in memory

### 3. Protected Routes
1. Client includes token in Authorization header
2. Server verifies token
3. Checks user permissions
4. Grants/denies access

## Security Measures

### Password Security
- Hashed using bcrypt (10 rounds)
- Minimum 8 characters
- Complexity requirements:
  - At least 1 uppercase
  - At least 1 number
  - At least 1 special character

### Rate Limiting
- 5 failed login attempts per 15 minutes
- 3 password reset requests per hour
- IP-based rate limiting

### Session Security
- HTTP-only cookies
- Secure flag (HTTPS only)
- SameSite=Strict
- Short-lived access tokens
- Refresh token rotation

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Invalidate token
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### User Management
- `GET /api/users/me` - Get current user
- `PUT /api/users/me` - Update profile
- `GET /api/users/:id` - Get user by ID (admin only)
- `PUT /api/users/:id` - Update user (admin only)

## Implementation Notes

### Frontend
1. Store token in memory (not localStorage)
2. Implement automatic token refresh
3. Handle 401/403 responses
4. Show appropriate error messages

### Backend
1. Validate all inputs
2. Use middleware for auth checks
3. Log security events
4. Implement proper error handling

## Testing

### Test Cases
1. Successful login/logout
2. Failed login attempts
3. Token expiration
4. Role-based access control
5. Password reset flow
6. Account lockout

### Test Users
- **Admin**: admin@example.com / admin123
- **Teacher**: teacher@example.com / teacher123
- **Student**: student@example.com / student123

## Dependencies
- `jsonwebtoken`: JWT implementation
- `bcryptjs`: Password hashing
- `express-validator`: Input validation
- `express-rate-limit`: Rate limiting
