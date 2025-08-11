#!/usr/bin/env node
import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';

const step = (title) => console.log(`\x1b[36m[build]\x1b[0m ${title}`);

async function run(cmd, args, env = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: 'inherit', env: { ...process.env, ...env } });
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited with ${code}`))));
  });
}

function resolveNextBin() {
  const cwd = process.cwd();
  const win = process.platform === 'win32';
  const candidates = [
    path.join(cwd, 'node_modules', '.bin', win ? 'next.cmd' : 'next'),
    path.join(cwd, 'node_modules', 'next', 'dist', 'bin', 'next'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  // Fallback to PATH
  return 'next';
}

function resolveNextModule() {
  const cwd = process.cwd();
  const mod = path.join(cwd, 'node_modules', 'next', 'dist', 'bin', 'next');
  return fs.existsSync(mod) ? mod : null;
}

async function main() {
  try {
    step('Ensuring production env');
    process.env.NODE_ENV = 'production';

    step('Pre-warm Next.js cache');
    // no-op hook; Next will cache automatically; could run analyze step if configured

    step('Running next build (SWC minify, optimized imports)');
    const nextModule = resolveNextModule();
    if (nextModule) {
      // Run "node next/dist/bin/next build" for cross-platform reliability
      await run(process.execPath, [nextModule, 'build']);
    } else {
      const nextBin = resolveNextBin();
      await run(nextBin, ['build']);
    }

    console.log('\x1b[32mBuild completed successfully.\x1b[0m');
  } catch (err) {
    console.error('\x1b[31mBuild failed:\x1b[0m', err?.message || err);
    process.exit(1);
  }
}

main();


