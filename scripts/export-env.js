// This script will export your environment variables to a .env file
// Run with: node scripts/export-env.js

import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

// Get the directory name
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Define the environment variables to export
const envVars = [
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
  "TOKEN_NAME",
]

// Create the .env file content
let envFileContent = "# Din Trafikskola Hässleholm - Environment Variables\n"
envFileContent += "# Generated on " + new Date().toISOString() + "\n\n"

// Add each environment variable to the file
envVars.forEach((varName) => {
  const value = process.env[varName] || ""

  // Add a comment for sensitive variables
  if (
    varName.includes("SECRET") ||
    varName.includes("PASSWORD") ||
    varName.includes("KEY") ||
    varName.includes("TOKEN")
  ) {
    envFileContent += `# WARNING: This is a sensitive variable\n`
  }

  envFileContent += `${varName}=${value}\n`

  // Add a newline after groups of related variables
  if (
    varName === "SENDGRID_API_KEY" ||
    varName === "VERCEL_URL" ||
    varName === "DATABASE_URL" ||
    varName === "PGDATABASE" ||
    varName === "CRON_SECRET" ||
    varName === "NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY" ||
    varName === "SMTP_PASSWORD"
  ) {
    envFileContent += "\n"
  }
})

// Write the file
const outputPath = path.join(__dirname, "..", ".env.generated")
fs.writeFileSync(outputPath, envFileContent)

console.log(`Environment variables exported to ${outputPath}`)
console.log("Current environment variables:")

// Display the current environment variables (with sensitive values masked)
envVars.forEach((varName) => {
  let value = process.env[varName] || ""

  // Mask sensitive values
  if (
    varName.includes("SECRET") ||
    varName.includes("PASSWORD") ||
    varName.includes("KEY") ||
    varName.includes("TOKEN")
  ) {
    if (value) {
      value = value.substring(0, 3) + "..." + value.substring(value.length - 3)
    }
  }

  console.log(`${varName}=${value}`)
})
