# Environment Variables Export Instructions

This document explains how to export your environment variables to a `.env` file using the provided scripts.

## Option 1: Using Node.js Script

1. **Run the script**:
   \`\`\`bash
   node scripts/export-env.js
   \`\`\`

2. The script will create a `.env.generated` file in your project root with all your environment variables.

## Option 2: Using Bash Script (Linux/Mac)

1. **Make the script executable**:
   \`\`\`bash
   chmod +x scripts/export-env.sh
   \`\`\`

2. **Run the script**:
   \`\`\`bash
   ./scripts/export-env.sh
   \`\`\`

3. The script will create a `.env.generated` file in your project root.

## Option 3: Using PowerShell Script (Windows)

1. **Run the script**:
   \`\`\`powershell
   .\scripts\export-env.ps1
   \`\`\`

2. The script will create a `.env.generated` file in your project root.

## Option 4: Using Vercel CLI

If you're using Vercel, you can pull environment variables directly:

1. **Install Vercel CLI** (if not already installed):
   \`\`\`bash
   npm i -g vercel
   \`\`\`

2. **Login to Vercel**:
   \`\`\`bash
   vercel login
   \`\`\`

3. **Pull environment variables**:
   \`\`\`bash
   vercel env pull .env.local
   \`\`\`

## Security Warning

The exported `.env` file will contain sensitive information such as API keys and passwords. Take these precautions:

1. **Never commit** the generated `.env` file to version control
2. **Review the file** before sharing it with anyone
3. **Delete the file** when you're done with it
4. **Consider masking** sensitive values before sharing

## What's Included

The exported file will contain all environment variables from your Din Trafikskola project, including:

- Email configuration (SendGrid)
- Database connection details (PostgreSQL/Neon)
- Authentication secrets
- API keys
- Payment configuration

## Next Steps

After exporting your environment variables:

1. **Review** the file to ensure all variables are correctly exported
2. **Make a backup** of your environment variables in a secure location
3. **Use the file** to set up a new development environment or for deployment
