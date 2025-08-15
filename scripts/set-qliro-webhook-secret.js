#!/usr/bin/env node
/**
 * Set Qliro webhook secret in site_settings
 * Usage:
 *   DATABASE_URL=... node scripts/set-qliro-webhook-secret.js [secret]
 * or set QLIRO_WEBHOOK_SECRET env var.
 */
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

(async () => {
  try {
    const secret = process.argv[2] || process.env.QLIRO_WEBHOOK_SECRET || 'vbQpPxuqvE4K';
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

    const params = ['qliro_webhook_secret', secret, 'Qliro webhook HMAC secret', 'payment'];
    await pool.query(upsertSql, params);
    console.log('✅ qliro_webhook_secret saved');

    const check = await pool.query('SELECT key, value, category FROM site_settings WHERE key = $1', ['qliro_webhook_secret']);
    const val = check.rows[0]?.value || '';
    console.log('🔐 Current value (masked):', val ? '***HIDDEN***' : '(empty)');

    await pool.end();
    console.log('🎉 Done');
  } catch (err) {
    console.error('❌ Failed to set webhook secret:', err.message || err);
    process.exit(1);
  }
})();
