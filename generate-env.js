const crypto = require('crypto');
const fs = require('fs');

const jwtSecret = crypto.randomBytes(32).toString('base64');
const encryptionKey = crypto.randomBytes(32).toString('hex');
const personalIdKey = crypto.randomBytes(32).toString('hex');

const content = `# Required: JWT Authentication
JWT_SECRET="${jwtSecret}"

# Required: Application URLs
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Required: Encryption Keys
ENCRYPTION_KEY="${encryptionKey}"
PERSONAL_ID_ENCRYPTION_KEY="${personalIdKey}"
`;

fs.appendFileSync('.env.local', content);
console.log('✅ Added required environment variables to .env.local');
console.log('🔐 Generated secure secrets:');
console.log('   JWT_SECRET:', jwtSecret.substring(0, 20) + '...');
console.log('   ENCRYPTION_KEY:', encryptionKey.substring(0, 20) + '...');
console.log('   PERSONAL_ID_ENCRYPTION_KEY:', personalIdKey.substring(0, 20) + '...');
