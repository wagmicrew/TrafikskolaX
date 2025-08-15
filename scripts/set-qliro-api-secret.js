#!/usr/bin/env node
/**
 * Set Qliro API secret(s) in site_settings
 * Usage:
 *   DATABASE_URL=... node scripts/set-qliro-api-secret.js [secret] [--prod]
 * or set QLIRO_API_SECRET env var. Add --prod to set production secrets instead of sandbox.
 */
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

(async () => {
  try {
    const args = process.argv.slice(2);
    const isProd = args.includes('--prod');
    const secretArg = args.find(a => !a.startsWith('-'));
    const secret = secretArg || process.env.QLIRO_API_SECRET || 'vbQpPxuqvE4K';

    if (!process.env.DATABASE_URL) {
      console.error('Error: DATABASE_URL is not set');
      process.exit(1);
    }

    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 8000,
    });

    console.log('🔌 Connecting to database...');
    await pool.query('SET statement_timeout = 10000');
    await pool.query('SELECT 1');
    console.log('✅ Database connection OK');

    const upsertSql = `
      INSERT INTO site_settings (key, value, description, category, "isEnv", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, false, NOW(), NOW())
      ON CONFLICT (key)
      DO UPDATE SET value = EXCLUDED.value,
                    description = EXCLUDED.description,
                    category = EXCLUDED.category,
                    "updatedAt" = NOW()
    `;

    const targets = isProd
      ? [
          { key: 'qliro_prod_api_secret', desc: 'Qliro production API secret' },
          { key: 'qliro_prod_shared_secret', desc: 'Qliro production shared secret' },
        ]
      : [
          { key: 'qliro_api_secret', desc: 'Qliro sandbox API secret (alias)' },
          { key: 'qliro_shared_secret', desc: 'Qliro sandbox shared secret (alias)' },
          { key: 'qliro_secret', desc: 'Qliro sandbox API shared secret' },
        ];

    for (const t of targets) {
      await pool.query(upsertSql, [t.key, secret, t.desc, 'payment']);
      console.log(`✅ ${t.key}: saved`);
    }

    console.log('🔐 Masked values: ***HIDDEN***');
    await pool.end();
    console.log('🎉 Done');
  } catch (err) {
    console.error('❌ Failed to set Qliro API secret(s):', err.message || err);
    process.exit(1);
  }
})();
