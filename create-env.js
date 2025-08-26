const crypto = require('crypto');
const fs = require('fs');

const jwtSecret = crypto.randomBytes(32).toString('base64');
const encryptionKey = crypto.randomBytes(32).toString('hex');
const personalIdKey = crypto.randomBytes(32).toString('hex');
const cronSecret = crypto.randomBytes(16).toString('base64');

const content = `# =================================================================
# TRAFIKSKOLAX ENVIRONMENT CONFIGURATION
# =================================================================
# Generated for local development on ${new Date().toISOString()}
# DO NOT commit this file to version control!

# =================================================================
# REQUIRED: Database Configuration
# =================================================================
DATABASE_URL="postgresql://neondb_owner:npg_yDzfPB4Hxg5w@ep-autumn-glade-a2lglkak-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# =================================================================
# REQUIRED: JWT Authentication
# =================================================================
JWT_SECRET="${jwtSecret}"

# =================================================================
# REQUIRED: Application URLs
# =================================================================
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# =================================================================
# REQUIRED: Encryption Keys
# =================================================================
ENCRYPTION_KEY="${encryptionKey}"
PERSONAL_ID_ENCRYPTION_KEY="${personalIdKey}"

# =================================================================
# OPTIONAL: Development & Testing
# =================================================================

# Environment Mode
NODE_ENV="development"

# Cron Job Secret (for automated tasks)
CRON_SECRET_TOKEN="${cronSecret}"

# Test Email for Development
TEST_TEACHER_EMAIL="teacher@example.com"

# =================================================================
# PAYMENT SYSTEM CONFIGURATION (use test values)
# =================================================================

# Swish Payment Configuration
NEXT_PUBLIC_SWISH_NUMBER="1234567890"

# Qliro Payment Configuration
QLIRO_MERCHANT_ID="test-merchant-id"
QLIRO_API_KEY="test-api-key"
NEXT_PUBLIC_QLIRO_MERCHANT_ID="test-merchant-id"

# Teori Payment Configuration
TEORI_API_KEY="test-teori-key"
TEORI_API_SECRET="test-teori-secret"
TEORI_MERCHANT_ID="test-teori-merchant"
TEORI_SHARED_SECRET="test-teori-shared"

# =================================================================
# EMAIL CONFIGURATION (use test values)
# =================================================================

# SendGrid Email Service
SENDGRID_API_KEY="test-sendgrid-key"

# Admin Email for Notifications
ADMIN_EMAIL="admin@example.com"

# =================================================================
# SETUP COMPLETE
# =================================================================
# Your environment is configured for local development.
# Test with: node scripts/test-database-connection.js
# Start app with: npm run dev
`;

fs.writeFileSync('.env.local', content);
console.log('✅ Created fresh .env.local with all required variables');
console.log('🔐 Generated secure secrets:');
console.log('   JWT_SECRET:', jwtSecret.substring(0, 20) + '...');
console.log('   ENCRYPTION_KEY:', encryptionKey.substring(0, 20) + '...');
console.log('   PERSONAL_ID_ENCRYPTION_KEY:', personalIdKey.substring(0, 20) + '...');
