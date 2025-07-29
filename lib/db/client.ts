import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

// Create the Neon client
const sql = neon(process.env.DATABASE_URL!);

// Create the Drizzle instance
export const db = drizzle(sql, { schema });

// Export for scripts
export const drizzleClient = async () => db;
