import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

export default defineConfig({
  schema: './lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    // Use the direct connection string without pooling for migrations
    url: process.env.DATABASE_URL?.replace('-pooler', '') || process.env.DATABASE_URL!,
  },
});
