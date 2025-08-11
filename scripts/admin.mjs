#!/usr/bin/env node
// Admin CLI: unifies ops tasks behind a single cross-platform entrypoint
// Zero-deps; uses child_process to call existing scripts/commands.

import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { existsSync } from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function logInfo(message) {
  process.stdout.write(`[admin] ${message}\n`);
}

function logError(message) {
  process.stderr.write(`[admin:error] ${message}\n`);
}

function isWindows() {
  return process.platform === 'win32';
}

function run(command, args, options = {}) {
  const { cwd = process.cwd(), env = process.env, stdio = 'inherit', dryRun = false } = options;
  const pretty = `${command} ${args.join(' ')}`.trim();
  if (dryRun) {
    logInfo(`DRY RUN: ${pretty}`);
    return { status: 0 };
  }
  logInfo(`exec: ${pretty}`);
  const result = spawnSync(command, args, { cwd, env, stdio, shell: isWindows() });
  if (typeof result.status === 'number' && result.status !== 0) {
    logError(`Command failed (${result.status}): ${pretty}`);
  }
  return result;
}

function nodeScript(relativePath, args = [], options = {}) {
  const full = resolve(__dirname, relativePath);
  if (!existsSync(full)) {
    logError(`Script not found: ${full}`);
    process.exitCode = 1;
    return { status: 1 };
  }
  return run(process.execPath, [full, ...args], options);
}

function shScript(relativePath, args = [], options = {}) {
  const full = resolve(__dirname, relativePath);
  if (!existsSync(full)) {
    logError(`Script not found: ${full}`);
    process.exitCode = 1;
    return { status: 1 };
  }
  if (isWindows()) {
    logError(`Script ${relativePath} is a POSIX shell script and cannot run on Windows. Use WSL or run on Linux host.`);
    process.exitCode = 1;
    return { status: 1 };
  }
  return run('bash', [full, ...args], options);
}

function psScript(relativePath, args = [], options = {}) {
  const full = resolve(__dirname, relativePath);
  if (!existsSync(full)) {
    logError(`Script not found: ${full}`);
    process.exitCode = 1;
    return { status: 1 };
  }
  if (!isWindows()) {
    logError(`Script ${relativePath} is a PowerShell script and should be run on Windows host.`);
    process.exitCode = 1;
    return { status: 1 };
  }
  return run('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', full, ...args], options);
}

function parseArgs(argv) {
  const [, , ...rest] = argv;
  const flags = new Set();
  const kv = new Map();
  const positional = [];
  let i = 0;
  while (i < rest.length) {
    const token = rest[i];
    if (token === '--') { positional.push(...rest.slice(i + 1)); break; }
    if (token.startsWith('--')) {
      const [key, value] = token.includes('=') ? token.split('=') : [token, undefined];
      if (typeof value === 'undefined') { flags.add(key); } else { kv.set(key, value); }
    } else {
      positional.push(token);
    }
    i += 1;
  }
  return { flags, kv, positional };
}

function getBool({ flags }, name) { return flags.has(`--${name}`); }
function getStr({ kv }, name, fallback) { return kv.get(`--${name}`) ?? fallback; }

function printHelp() {
  const help = `
TrafikskolaX Admin CLI

Usage: admin <command> [subcommand] [options]

Commands:
  update                 Pull latest and install deps (git pull --ff-only, npm ci)
  build                  Build production artifacts (npm run build)
  deploy                 Update, build, and restart (best-effort cross-platform)
  db migrate|seed|setup  Database actions
  env export             Print environment in chosen format
  static fix             Repair production static files
  pm2 <action>           PM2 helpers (Linux)
  nginx <action>         Nginx/SSL helpers (Linux)
  cron <action>          Cron helpers (Linux)

Options:
  --dry-run              Show what would run without executing
  --format=<fmt>         For env export: sh|ps1|json (default: sh)

Examples:
  admin update
  admin build
  admin deploy
  admin db migrate
  admin env export --format=json
  admin pm2 reset
  admin nginx config-test
`;
  process.stdout.write(help);
}

async function main() {
  const { positional, flags } = parseArgs(process.argv);
  const dryRun = getBool({ flags }, 'dry-run');
  const [command, sub, ...rest] = positional;

  if (!command || command === 'help' || flags.has('--help')) {
    printHelp();
    return;
  }

  switch (command) {
    case 'update': {
      const r1 = run('git', ['pull', '--ff-only'], { dryRun });
      if (r1.status !== 0) process.exit(r1.status ?? 1);
      const r2 = run('npm', ['ci'], { dryRun });
      process.exit(r2.status ?? 0);
      break;
    }
    case 'build': {
      const r = run('npm', ['run', 'build'], { dryRun });
      process.exit(r.status ?? 0);
      break;
    }
    case 'deploy': {
      // Minimal: update + build. Restart is environment-specific; prefer PM2 wrappers on Linux.
      const u = run('git', ['pull', '--ff-only'], { dryRun });
      if (u.status !== 0) process.exit(u.status ?? 1);
      const i = run('npm', ['ci'], { dryRun });
      if (i.status !== 0) process.exit(i.status ?? 1);
      const b = run('npm', ['run', 'build'], { dryRun });
      process.exit(b.status ?? 0);
      break;
    }
    case 'db': {
      switch (sub) {
        case 'migrate': {
          const r = run('npm', ['run', 'db:migrate'], { dryRun });
          process.exit(r.status ?? 0);
          break;
        }
        case 'setup': {
          // Prefer tsx if available; fall back to node
          const tsx = run('npx', ['--yes', 'tsx', 'scripts/setup-database.ts'], { dryRun });
          process.exit(tsx.status ?? 0);
          break;
        }
        case 'seed': {
          const r = run('npm', ['run', 'db:seed'], { dryRun });
          process.exit(r.status ?? 0);
          break;
        }
        default:
          logError('db: expected subcommand migrate|setup|seed');
          process.exit(1);
      }
      break;
    }
    case 'env': {
      if (sub !== 'export') { logError('env: expected subcommand export'); process.exit(1); }
      const format = getStr(parseArgs(process.argv), 'format', 'sh');
      // Reuse existing helpers when available
      if (format === 'sh') {
        const r = shScript('export-env.sh', [], { dryRun });
        process.exit(r.status ?? 0);
      } else if (format === 'ps1') {
        const r = psScript('export-env.ps1', [], { dryRun });
        process.exit(r.status ?? 0);
      } else if (format === 'json') {
        const r = nodeScript('export-env.js', [], { dryRun });
        process.exit(r.status ?? 0);
      } else {
        logError(`Unknown format: ${format}`);
        process.exit(1);
      }
      break;
    }
    case 'static': {
      if (sub !== 'fix') { logError('static: expected subcommand fix'); process.exit(1); }
      const r = shScript('fix-production-static-files.sh', [], { dryRun });
      process.exit(r.status ?? 0);
      break;
    }
    case 'pm2': {
      // Map common actions to existing scripts on Linux
      if (isWindows()) { logError('pm2 actions are intended for Linux hosts.'); process.exit(1); }
      switch (sub) {
        case 'reset': {
          const r = shScript('reset-pm2-with-ecosystem.sh', rest, { dryRun });
          process.exit(r.status ?? 0);
          break;
        }
        case 'startup': {
          const r = shScript('fix-pm2-startup.sh', rest, { dryRun });
          process.exit(r.status ?? 0);
          break;
        }
        case 'repair': {
          const r = shScript('comprehensive-server-fix.sh', rest, { dryRun });
          process.exit(r.status ?? 0);
          break;
        }
        case 'kill-port': {
          const r = shScript('kill-port.sh', rest, { dryRun });
          process.exit(r.status ?? 0);
          break;
        }
        default:
          logError('pm2: expected subcommand reset|startup|repair|kill-port');
          process.exit(1);
      }
      break;
    }
    case 'nginx': {
      if (isWindows()) { logError('nginx actions are intended for Linux hosts.'); process.exit(1); }
      switch (sub) {
        case 'config-fix': {
          const r = shScript('fix-nginx-config.sh', rest, { dryRun });
          process.exit(r.status ?? 0);
          break;
        }
        case 'ssl-fix': {
          const r = shScript('fix-nginx-ssl.sh', rest, { dryRun });
          process.exit(r.status ?? 0);
          break;
        }
        case 'configure-ssl': {
          const r = shScript('configure-ssl.sh', rest, { dryRun });
          process.exit(r.status ?? 0);
          break;
        }
        default:
          logError('nginx: expected subcommand config-fix|ssl-fix|configure-ssl');
          process.exit(1);
      }
      break;
    }
    case 'cron': {
      if (isWindows()) { logError('cron actions are intended for Linux hosts.'); process.exit(1); }
      switch (sub) {
        case 'setup': {
          const r = shScript('setup-cron-jobs.sh', rest, { dryRun });
          process.exit(r.status ?? 0);
          break;
        }
        case 'remove': {
          const r = shScript('remove-cron-jobs.sh', rest, { dryRun });
          process.exit(r.status ?? 0);
          break;
        }
        case 'run': {
          const r = shScript('run-cron-job.sh', rest, { dryRun });
          process.exit(r.status ?? 0);
          break;
        }
        default:
          logError('cron: expected subcommand setup|remove|run');
          process.exit(1);
      }
      break;
    }
    default:
      logError(`Unknown command: ${command}`);
      printHelp();
      process.exit(1);
  }
}

main().catch((err) => {
  logError(String(err?.stack || err));
  process.exit(1);
});


