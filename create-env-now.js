const fs = require('fs');

const content = `DATABASE_URL=postgresql://neondb_owner:npg_yDzfPB4Hxg5w@ep-autumn-glade-a2lglkak-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
JWT_SECRET=Ls7gq/1O4IXsYvGefuyHEtby7nDqR9DAkmrDs5rc5gE=
NEXT_PUBLIC_APP_URL=http://localhost:3000
ENCRYPTION_KEY=ea8c69acfc7ef714a4bff052bad06026cf51fb92c6393c4fd5109b291c36cfdc
PERSONAL_ID_ENCRYPTION_KEY=1ccacb820ac7c36453d76b33c2a65e29cab6c5b08afcb2805eecfc37052a96fc
NODE_ENV=development
`;

fs.writeFileSync('.env.local', content);
console.log('✅ Created .env.local with all required environment variables');
console.log('🚀 The server should now work properly');
