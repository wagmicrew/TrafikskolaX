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

    // Detect column naming style in site_settings
    const colsRes = await pool.query(
      `SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='site_settings'`
    );
    const colNames = colsRes.rows.map(r => r.column_name);
    const hasIsEnvSnake = colNames.includes('is_env');
    const hasIsEnvCamel = colNames.includes('isEnv');
    const hasCreatedAtSnake = colNames.includes('created_at');
    const hasCreatedAtCamel = colNames.includes('createdAt');
    const hasUpdatedAtSnake = colNames.includes('updated_at');
    const hasUpdatedAtCamel = colNames.includes('updatedAt');

    const columns = ['key', 'value', 'description', 'category'];
    const values = ['$1', '$2', '$3', '$4'];
    if (hasIsEnvSnake) { columns.push('is_env'); values.push('false'); }
    else if (hasIsEnvCamel) { columns.push('"isEnv"'); values.push('false'); }
    if (hasCreatedAtSnake) { columns.push('created_at'); values.push('NOW()'); }
    else if (hasCreatedAtCamel) { columns.push('"createdAt"'); values.push('NOW()'); }
    if (hasUpdatedAtSnake) { columns.push('updated_at'); values.push('NOW()'); }
    else if (hasUpdatedAtCamel) { columns.push('"updatedAt"'); values.push('NOW()'); }

    const insertSql = `INSERT INTO site_settings (${columns.join(', ')}) VALUES (${values.join(', ')})`;
    const updateSets = [
      'value = EXCLUDED.value',
      'description = EXCLUDED.description',
      'category = EXCLUDED.category',
    ];
    if (hasUpdatedAtSnake) updateSets.push('updated_at = NOW()');
    if (hasUpdatedAtCamel) updateSets.push('"updatedAt" = NOW()');
    const upsertSql = `${insertSql} ON CONFLICT (key) DO UPDATE SET ${updateSets.join(', ')}`;

    await pool.query(upsertSql, ['qliro_webhook_secret', secret, 'Qliro webhook HMAC secret', 'payment']);
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
