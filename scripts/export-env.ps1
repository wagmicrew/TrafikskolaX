# PowerShell script to export environment variables to a .env file

# Define output file
$outputFile = ".env.generated"

# Start with a header
"# Din Trafikskola Hässleholm - Environment Variables" | Out-File -FilePath $outputFile
"# Generated on $(Get-Date)" | Out-File -FilePath $outputFile -Append
"" | Out-File -FilePath $outputFile -Append

# List of environment variables to export
$envVars = @(
  "DRIVING_SCHOOL_EMAIL",
  "SENDGRID_FROM_EMAIL",
  "SENDGRID_API_KEY",
  "VERCEL_URL",
  "POSTGRES_URL",
  "POSTGRES_PRISMA_URL",
  "DATABASE_URL_UNPOOLED",
  "POSTGRES_URL_NON_POOLING",
  "PGHOST",
  "POSTGRES_USER",
  "STACK_SECRET_SERVER_KEY",
  "DATABASE_URL",
  "POSTGRES_PASSWORD",
  "POSTGRES_DATABASE",
  "PGPASSWORD",
  "PGDATABASE",
  "PGHOST_UNPOOLED",
  "NEXT_PUBLIC_STACK_PROJECT_ID",
  "PGUSER",
  "POSTGRES_URL_NO_SSL",
  "POSTGRES_HOST",
  "NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY",
  "SMTP_PASSWORD",
  "JWT_SECRET",
  "CRON_SECRET",
  "NEXT_PUBLIC_SWISH_NUMBER",
  "TOKEN_NAME"
)

# Export each variable
foreach ($var in $envVars) {
  # Add a comment for sensitive variables
  if ($var -match "SECRET|PASSWORD|KEY|TOKEN") {
    "# WARNING: This is a sensitive variable" | Out-File -FilePath $outputFile -Append
  }
  
  # Get the value and export it
  $value = [Environment]::GetEnvironmentVariable($var)
  "$var=$value" | Out-File -FilePath $outputFile -Append
  
  # Add a newline after groups of related variables
  if ($var -eq "SENDGRID_API_KEY" -or $var -eq "VERCEL_URL" -or $var -eq "DATABASE_URL" -or 
      $var -eq "PGDATABASE" -or $var -eq "CRON_SECRET" -or 
      $var -eq "NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY" -or $var -eq "SMTP_PASSWORD") {
    "" | Out-File -FilePath $outputFile -Append
  }
}

Write-Host "Environment variables exported to $outputFile"
Write-Host "Please review the file and remove any sensitive information before sharing."
