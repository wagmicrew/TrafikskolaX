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
