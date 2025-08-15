/*
  Qliro validation script
  - Loads resolved settings from DB via QliroService
  - Verifies external reachability to Qliro API (expects 401 without auth)
  - Runs extended connection test
*/

import { QliroService } from '../lib/payment/qliro-service';

async function main() {
  const svc = QliroService.getInstance();
  console.log('=== Qliro Validation ===');

  try {
    // 1) Load resolved settings from DB
    const resolved = await svc.getResolvedSettings(true);
    console.log('\n[Resolved Settings]');
    console.log({
      enabled: resolved.enabled,
      environment: resolved.environment,
      apiUrl: resolved.apiUrl,
      publicUrl: resolved.publicUrl,
      hasApiKey: resolved.hasApiKey,
      hasApiSecret: resolved.hasApiSecret,
      apiKeyMasked: resolved.apiKeyMasked,
    });

    // 2) Enabled check
    const enabled = await svc.isEnabled();
    console.log(`\n[Enabled] ${enabled}`);
    if (!enabled) {
      console.log('Qliro is disabled in settings. Enable it to perform full tests.');
    }

    // 3) External reachability (unauthenticated request expected to return 401/403)
    console.log('\n[External Reachability]');
    try {
      const url = `${resolved.apiUrl.replace(/\/+$/, '')}/orders`;
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'TrafikskolaX/1.0',
        },
      });
      console.log('Reachability status:', res.status, res.statusText);
      if (res.status === 401 || res.status === 403) {
        console.log('✓ Qliro API reachable (auth required as expected)');
      } else if (res.ok) {
        console.log('✓ Qliro API reachable (unexpected OK without auth)');
      } else {
        console.log('? Unexpected status. Headers:', Object.fromEntries(res.headers.entries()));
      }
    } catch (e: any) {
      console.error('✗ Failed to reach Qliro API:', e?.message || e);
    }

    // 4) Extended connection test from service (performs minimal signed call)
    console.log('\n[Extended Connection Test]');
    const ext = await svc.testConnection({ extended: true });
    if (ext.success) {
      console.log('✓ Extended test passed');
      if (ext.debug) {
        const { apiKey, apiUrl, environment } = ext.debug;
        console.log('Debug:', {
          apiKey: apiKey ? `${String(apiKey).slice(0, 4)}...${String(apiKey).slice(-4)}` : undefined,
          apiUrl,
          environment,
        });
      }
    } else {
      console.log('✗ Extended test failed:', ext.message);
      if (ext.debug) console.log('Debug:', ext.debug);
    }

    console.log('\n=== Done ===');
  } catch (err: any) {
    console.error('Validator failed:', err?.message || err);
    if (err?.stack) console.error(err.stack);
    process.exitCode = 1;
  }
}

main();
