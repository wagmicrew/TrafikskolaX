# Din Trafikskola Hässleholm - Environment Variables Setup

This document explains how to set up environment variables for the Din Trafikskola Hässleholm website.

## Quick Setup

1. Copy `.env.example` to `.env.local` in your project root
2. Fill in the actual values for your environment
3. Never commit `.env.local` to version control

## Environment Variables Explained

### Email Configuration
- `DRIVING_SCHOOL_EMAIL`: The email address where contact form submissions will be sent
- `SENDGRID_FROM_EMAIL`: The "from" email address for outgoing emails
- `SENDGRID_API_KEY`: Your SendGrid API key for sending emails

### Database Configuration
The project uses Neon PostgreSQL database with multiple connection strings for different purposes:
- `DATABASE_URL`: Main database connection string
- `POSTGRES_URL`: Standard PostgreSQL connection
- `POSTGRES_PRISMA_URL`: Connection string optimized for Prisma with connection pooling
- `DATABASE_URL_UNPOOLED`: Direct database connection without pooling

### Authentication & Security
- `JWT_SECRET`: Secret key for JWT token signing (use a strong, random string)
- `TOKEN_NAME`: Name of the authentication token
- `CRON_SECRET`: Secret key for protecting cron job endpoints

### Payment Integration
- `NEXT_PUBLIC_SWISH_NUMBER`: The Swish number for payments (123-273-20-71)

### Stack Auth (Optional)
If using Stack Auth for authentication:
- `STACK_SECRET_SERVER_KEY`: Server-side Stack Auth key
- `NEXT_PUBLIC_STACK_PROJECT_ID`: Public Stack Auth project ID
- `NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY`: Public Stack Auth client key

## Security Notes

1. **Never commit actual environment variables to version control**
2. **Use strong, unique secrets for production**
3. **Rotate secrets regularly**
4. **Use different values for development and production**

## Development vs Production

### Development
- Use `.env.local` for local development
- Can use test/development API keys
- Database can be a development instance

### Production
- Set environment variables in your hosting platform (Vercel, etc.)
- Use production API keys and database
- Ensure all secrets are strong and unique

## Setting up SendGrid

1. Create a SendGrid account
2. Generate an API key with "Mail Send" permissions
3. Verify your sender email address
4. Add the API key to `SENDGRID_API_KEY`
5. Set `SENDGRID_FROM_EMAIL` to your verified email

## Setting up Neon Database

1. Create a Neon project
2. Get your connection string from the Neon dashboard
3. Set all the database environment variables
4. Test the connection

## Vercel Deployment

When deploying to Vercel:
1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add all production environment variables
4. Deploy your project

## Troubleshooting

### Email not sending
- Check that `SENDGRID_API_KEY` is correct and has proper permissions
- Verify that `SENDGRID_FROM_EMAIL` is verified in SendGrid
- Check that `DRIVING_SCHOOL_EMAIL` is set correctly

### Database connection issues
- Verify all database environment variables are set
- Check that the database is accessible from your deployment environment
- Ensure connection strings are properly formatted

### Contact Form Issues
- Check browser console for errors
- Verify all required environment variables are set
- Test the contact form in development first
