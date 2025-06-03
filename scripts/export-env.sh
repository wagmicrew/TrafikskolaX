#!/bin/bash
# This script exports your environment variables to a .env file

# Define output file
OUTPUT_FILE=".env.generated"

# Start with a header
echo "# Din Trafikskola Hässleholm - Environment Variables" > $OUTPUT_FILE
echo "# Generated on $(date)" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE

# List of environment variables to export
ENV_VARS=(
  "DRIVING_SCHOOL_EMAIL"
  "SENDGRID_FROM_EMAIL"
  "SENDGRID_API_KEY"
  "VERCEL_URL"
  "POSTGRES_URL"
  "POSTGRES_PRISMA_URL"
  "DATABASE_URL_UNPOOLED"
  "POSTGRES_URL_NON_POOLING"
  "PGHOST"
  "POSTGRES_USER"
  "STACK_SECRET_SERVER_KEY"
  "DATABASE_URL"
  "POSTGRES_PASSWORD"
  "POSTGRES_DATABASE"
  "PGPASSWORD"
  "PGDATABASE"
  "PGHOST_UNPOOLED"
  "NEXT_PUBLIC_STACK_PROJECT_ID"
  "PGUSER"
  "POSTGRES_URL_NO_SSL"
  "POSTGRES_HOST"
  "NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY"
  "SMTP_PASSWORD"
  "JWT_SECRET"
  "CRON_SECRET"
  "NEXT_PUBLIC_SWISH_NUMBER"
  "TOKEN_NAME"
)

# Export each variable
for var in "${ENV_VARS[@]}"; do
  # Add a comment for sensitive variables
  if [[ $var == *"SECRET"* ]] || [[ $var == *"PASSWORD"* ]] || [[ $var == *"KEY"* ]] || [[ $var == *"TOKEN"* ]]; then
    echo "# WARNING: This is a sensitive variable" >> $OUTPUT_FILE
  fi
  
  # Get the value and export it
  value="${!var}"
  echo "$var=$value" >> $OUTPUT_FILE
  
  # Add a newline after groups of related variables
  if [[ $var == "SENDGRID_API_KEY" ]] || [[ $var == "VERCEL_URL" ]] || [[ $var == "DATABASE_URL" ]] || 
     [[ $var == "PGDATABASE" ]] || [[ $var == "CRON_SECRET" ]] || 
     [[ $var == "NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY" ]] || [[ $var == "SMTP_PASSWORD" ]]; then
    echo "" >> $OUTPUT_FILE
  fi
done

echo "Environment variables exported to $OUTPUT_FILE"
echo "Please review the file and remove any sensitive information before sharing."
