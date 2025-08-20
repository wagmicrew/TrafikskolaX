#!/usr/bin/env node

/**
 * TypeScript error analyzer and fixer
 * - Runs `tsc --noEmit` to collect TS errors
 * - Ranks and summarizes the most important errors
 * - Applies safe, targeted fixes for known patterns (optional)
 * - Generates an AI-friendly prompt with context and code excerpts (optional)
 *
 * Usage:
 *   node scripts/ts-analyze-fix.mjs              # analyze and summarize
 *   node scripts/ts-analyze-fix.mjs --apply      # analyze and apply safe fixes, then re-analyze
 *   node scripts/ts-analyze-fix.mjs --prompt     # analyze and print an AI prompt to stdout
 *   node scripts/ts-analyze-fix.mjs --max 15     # limit number of top errors in output
 */

import { execSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const cwd = process.cwd();
const projectRoot = cwd;

// Helpers
function run(cmd) {
  try {
    const out = execSync(cmd, { cwd: projectRoot, stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
    return { code: 0, stdout: out, stderr: '' };
  } catch (e) {
    return { code: e.status || 1, stdout: e.stdout?.toString?.() || '', stderr: e.stderr?.toString?.() || e.message };
  }
}

function isSourceFile(p) {
  return /\.(ts|tsx)$/.test(p) && !/node_modules\//.test(p) && !/Documentation\//.test(p);
}

function scorePath(p) {
  let s = 0;
  if (p.startsWith('app/')) s += 5;
  if (p.startsWith('lib/')) s += 4;
  if (p.startsWith('components/')) s += 4;
  if (p.startsWith('pages/')) s += 3;
  if (p.startsWith('hooks/') || p.startsWith('contexts/') || p.startsWith('utils/')) s += 2;
  if (/Documentation\//.test(p) || /scripts\//.test(p)) s -= 2;
  return s;
}

function parseTscOutput(text) {
  const lines = text.split(/\r?\n/);
  const results = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    // Common tsc format: path:line:col - error TSXXXX: message
    let m = line.match(/^(.*\.(?:ts|tsx)):(\d+):(\d+) - error TS(\d+):\s*(.*)$/);
    if (m) {
      const [, file, lineNo, colNo, code, msg] = m;
      const entry = { file: path.normalize(file).replace(/\\/g, '/'), line: Number(lineNo), col: Number(colNo), code: `TS${code}`, message: msg.trim(), context: [] };
      // capture following context lines (until next error or blank)
      let j = i + 1;
      while (j < lines.length && !/^(.*\.(?:ts|tsx)):\d+:\d+ - error TS\d+:/.test(lines[j])) {
        if (lines[j].trim().length === 0) break;
        entry.context.push(lines[j]);
        j++;
      }
      results.push(entry);
      i = j;
      continue;
    }

    // Next.js type checker sometimes prints: "./file.ts:line:col" then the message on next lines
    m = line.match(/^\.?\/?(.*\.(?:ts|tsx)):(\d+):(\d+)/);
    if (m) {
      const [, file, lineNo, colNo] = m;
      let msg = '';
      let j = i + 1;
      while (j < lines.length) {
        const l = lines[j];
        if (/^\.?\/?(.*\.(?:ts|tsx)):\d+:\d+/.test(l)) break;
        if (l.trim().length === 0) break;
        msg += (msg ? '\n' : '') + l;
        j++;
      }
      results.push({ file: path.normalize(file).replace(/\\/g, '/'), line: Number(lineNo), col: Number(colNo), code: 'NXT', message: msg.trim(), context: [] });
      i = j;
      continue;
    }

    i++;
  }
  return results.filter(r => isSourceFile(r.file));
}

function rankError(err) {
  let s = 10 + scorePath(err.file);
  const msg = err.message;
  if (/PgSelectBase/.test(msg)) s += 12; // Drizzle builder mismatch
  if (/RouteContext|withApiHandler|context\?:/.test(msg)) s += 10; // Next route context shape
  if (/possibly 'null'|Object is possibly 'null'/.test(msg)) s += 4; // nullability guards
  if (/Cannot find name|Cannot find module/.test(msg)) s += 6; // missing symbols
  if (/is not assignable/.test(msg)) s += 5; // type assignability
  // Union property access like: Property 'email' does not exist on type 'A | B'
  if (/Property '.*' does not exist on type/.test(msg) && /\|/.test(msg)) s += 9;
  // Unknown type usage
  if (/Object is of type 'unknown'/.test(msg)) s += 3;
  return s;
}

function summarize(errors, max = 10) {
  const top = [...errors].sort((a, b) => rankError(b) - rankError(a)).slice(0, max);
  return top;
}

// --- Custom static analyzer: EnhancedEmailService usage checks ---
function collectSourceFiles() {
  const ignoreDirs = new Set(['node_modules', '.next', '.git', 'public', 'drizzle', 'logs', 'vendor']);
  const files = [];
  function walk(dir) {
    let entries = [];
    try { entries = readdirSync(dir); } catch { return; }
    for (const name of entries) {
      const abs = path.join(dir, name);
      let st; try { st = statSync(abs); } catch { continue; }
      if (st.isDirectory()) {
        if (ignoreDirs.has(name)) continue;
        walk(abs);
      } else if (/\.(ts|tsx)$/.test(name)) {
        const rel = path.relative(projectRoot, abs).replace(/\\/g, '/');
        if (!/Documentation\//.test(rel)) files.push(rel);
      }
    }
  }
  walk(projectRoot);
  return files;
}

function parseEmailTriggerTypes() {
  try {
    const p = path.join(projectRoot, 'lib', 'email', 'enhanced-email-service.ts');
    if (!existsSync(p)) return new Set();
    const src = readFileSync(p, 'utf8');
    const m = src.match(/export\s+type\s+EmailTriggerType\s*=([\s\S]*?);/);
    if (!m) return new Set();
    const union = m[1];
    const triggers = new Set();
    let mm;
    const rx = /['"]([^'"\n]+)['"]/g;
    while ((mm = rx.exec(union))) {
      triggers.add(mm[1]);
    }
    return triggers;
  } catch {
    return new Set();
  }
}

function analyzeEnhancedEmailUsage(files, triggerSet) {
  const findings = [];
  for (const rel of files) {
    let text;
    try { text = readFileSync(path.join(projectRoot, rel), 'utf8'); } catch { continue; }
    const lines = text.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const ln = i + 1;
      // Misnamed/legacy method
      let idx = line.indexOf('sendTemplatedEmail(');
      if (idx !== -1) {
        findings.push({ file: rel, line: ln, col: idx + 1, kind: 'EnhancedEmailService', message: "Found call to sendTemplatedEmail(...), which doesn't exist. Prefer EnhancedEmailService.sendTriggeredEmail(trigger, context) or EnhancedEmailService.sendEmail(options)." });
      }
      // Accidental instantiation
      let mNew = line.match(/\bnew\s+EnhancedEmailService\s*\(/);
      if (mNew) {
        const col = (mNew.index || 0) + 1;
        findings.push({ file: rel, line: ln, col, kind: 'EnhancedEmailService', message: 'Avoid instantiating EnhancedEmailService. Use static methods (e.g., EnhancedEmailService.sendTriggeredEmail or sendEmail).' });
      }
      // Unknown trigger type
      let mTrig = line.match(/EnhancedEmailService\s*\.\s*sendTriggeredEmail\s*\(\s*(["\'])((?:[^\\\n]|\\.)*?)\1/);
      if (mTrig) {
        const trig = mTrig[2];
        if (triggerSet && triggerSet.size > 0 && !triggerSet.has(trig)) {
          const col = (mTrig.index || 0) + 1;
          findings.push({ file: rel, line: ln, col, kind: 'EnhancedEmailService', message: `Unknown email trigger '${trig}' not in EmailTriggerType union.` });
        }
      }
    }
  }
  return findings;
}

// Fixers
function fixWithApiHandlerContext() {
  const p = path.join(projectRoot, 'lib', 'api', 'middleware.ts');
  if (!existsSync(p)) return { applied: false, reason: 'missing' };
  const src = readFileSync(p, 'utf8');
  if (/return async \(req: NextRequest, context: \{ params:/.test(src)) {
    return { applied: false, reason: 'already-correct' };
  }
  let updated = src;
  // Make context required and typed
  updated = updated.replace(
    /return async \(req: NextRequest,\s*context\?:\s*\{[^}]*\}\)\s*=>/,
    'return async (req: NextRequest, context: { params: Record<string, string | string[]> }) =>'
  );
  // Ensure validation uses context.params not optional
  updated = updated.replace(
    /validateRequest\(req,\s*context\?\.params,\s*options\.validate\)/,
    'validateRequest(req, context.params, options.validate)'
  );
  if (updated !== src) {
    writeFileSync(p, updated, 'utf8');
    return { applied: true };
  }
  return { applied: false, reason: 'no-change' };
}

function guardNullabilityInBlockedSlots() {
  const p = path.join(projectRoot, 'app', 'api', 'admin', 'blocked-slots', 'route.ts');
  if (!existsSync(p)) return { applied: false, reason: 'missing' };
  const src = readFileSync(p, 'utf8');
  if (/const bStart = blocked\.timeStart;\s*const bEnd = blocked\.timeEnd;\s*if \(bStart && bEnd\)/s.test(src)) {
    return { applied: false, reason: 'already-guarded' };
  }
  const updated = src.replace(
    /if \(!isAllDay && !blocked\.isAllDay\) \{\s*if \(\s*\(timeStart >= blocked\.timeStart[^]*?\) \{\s*return NextResponse\.json\(\{\s*error: `Time overlaps[^]*?\}\s*\}/,
    `if (!isAllDay && !blocked.isAllDay) {\n        const bStart = blocked.timeStart;\n        const bEnd = blocked.timeEnd;\n        if (bStart && bEnd) {\n          if ((timeStart >= bStart && timeStart < bEnd) || (timeEnd > bStart && timeEnd <= bEnd) || (timeStart <= bStart && timeEnd >= bEnd)) {\n            return NextResponse.json({ error: \`Time overlaps with existing blocked slot: \${bStart} - \${bEnd}\` }, { status: 400 });\n          }\n        }\n      }`
  );
  if (updated !== src) {
    writeFileSync(p, updated, 'utf8');
    return { applied: true };
  }
  return { applied: false, reason: 'no-change' };
}

function getCodeExcerpt(relFile, line, contextLines = 8) {
  try {
    const abs = path.join(projectRoot, relFile);
    const src = readFileSync(abs, 'utf8').split(/\r?\n/);
    const start = Math.max(0, line - contextLines - 1);
    const end = Math.min(src.length, line + contextLines - 1);
    const out = [];
    for (let i = start; i < end; i++) {
      const ln = i + 1;
      const mark = ln === line ? '>' : ' ';
      out.push(`${mark} ${String(ln).padStart(4, ' ')} | ${src[i]}`);
    }
    return out.join('\n');
  } catch {
    return '';
  }
}

function generateAIPrompt(topErrors, customFindings = []) {
  const lines = [];
  lines.push('# TypeScript Fix Plan');
  lines.push('');
  lines.push('Project: TrafikskolaX (Next.js App Router, TypeScript)');
  lines.push('Constraints: Do not change dependencies unless necessary. Follow existing patterns, Drizzle ORM, Neon, JWT, Tailwind/Shadcn/Radix, App Router.');
  lines.push('');
  lines.push('## Top Issues');
  topErrors.forEach((e, idx) => {
    lines.push(`- [${idx + 1}] ${e.file}:${e.line}:${e.col} ${e.code} — ${e.message.split('\n')[0]}`);
  });
  lines.push('');
  if (customFindings.length) {
    lines.push('## Custom Analyzer Findings (EnhancedEmailService)');
    customFindings.forEach((f, idx) => {
      lines.push(`- [${idx + 1}] ${f.file}:${f.line}:${f.col} — ${f.message}`);
    });
    lines.push('');
  }
  lines.push('## Prioritized Fixes');
  topErrors.forEach((e, idx) => {
    const msg = e.message;
    if (/PgSelectBase/.test(msg)) {
      lines.push(`- [${idx + 1}] Drizzle builder mutation in ${e.file}. Refactor mutable query pattern (let query = ...; query = query.where(...); await query.orderBy(...)) to branch-specific chained queries assigning final results.`);
    } else if (/RouteContext|withApiHandler|context\?:/.test(msg)) {
      lines.push(`- [${idx + 1}] Next.js route context mismatch. Ensure wrapper returns (req: NextRequest, context: { params: Record<string, string | string[]> }) and consumers use context.params.`);
    } else if (/possibly 'null'|Object is possibly 'null'/.test(msg)) {
      lines.push(`- [${idx + 1}] Add null guards before using possibly-null values (e.g., timeStart/timeEnd).`);
    } else if (/Property '.*' does not exist on type/.test(msg) && /\|/.test(msg)) {
      lines.push(`- [${idx + 1}] Union property access. Narrow the union before accessing properties. Example: if (res.success) { use res.user.email } else { handle error }. Alternatively, use 'in' checks (e.g., if ('user' in res) { ... }).`);
    } else if (/is not assignable/.test(msg)) {
      lines.push(`- [${idx + 1}] Resolve type mismatch by aligning types or narrowing before usage.`);
    } else {
      lines.push(`- [${idx + 1}] Investigate and fix.`);
    }
  });
  lines.push('');
  lines.push('## Files to Edit');
  const files = Array.from(new Set(topErrors.map(e => e.file)));
  files.forEach(f => lines.push(`- ${f}`));
  lines.push('');
  lines.push('## Notes for Agent');
  lines.push('- Use Drizzle ORM correctly; avoid mutating query builders; prefer branch-specific chaining.');
  lines.push('- For App Router route handlers, match Next.js signatures strictly.');
  lines.push('- For union types, always narrow via discriminants (e.g., success flag) or "in" checks before property access.');
  lines.push('- Do not change UI design or dependencies.');
  lines.push('- Keep code mobile-first and follow existing styling choices.');
  lines.push('');
  lines.push('## Error Context (code excerpts)');
  topErrors.forEach((e, idx) => {
    const excerpt = getCodeExcerpt(e.file, e.line, 6);
    if (excerpt) {
      lines.push(`### [${idx + 1}] ${e.file}:${e.line}`);
      lines.push('```ts');
      lines.push(excerpt);
      lines.push('```');
    }
  });
  lines.push('');
  return lines.join('\n');
}

function main() {
  const args = process.argv.slice(2);
  const apply = args.includes('--apply');
  const promptOnly = args.includes('--prompt');
  const ci = args.includes('--ci');
  const writeOut = args.includes('--write');
  const maxIdx = Math.max(1, Number(args[args.indexOf('--max') + 1] || 10));

  console.log('[ts-analyze] Running TypeScript check...');
  const res = run('npx tsc --noEmit --pretty false');
  const allOut = [res.stdout, res.stderr].filter(Boolean).join('\n');
  const errors = parseTscOutput(allOut);

  // Custom analyzer pass
  const files = collectSourceFiles();
  const triggerSet = parseEmailTriggerTypes();
  const customFindings = analyzeEnhancedEmailUsage(files, triggerSet);

  if (errors.length === 0 && customFindings.length === 0) {
    console.log('✓ No TypeScript errors found.');
    console.log('✓ No EnhancedEmailService issues detected.');
    if (ci) process.exit(0);
    return;
  }

  const top = summarize(errors, maxIdx);

  console.log(`Found ${errors.length} TS errors. Showing top ${top.length}:`);
  top.forEach((e, i) => {
    console.log(`${i + 1}. ${e.file}:${e.line}:${e.col} ${e.code}\n   ${e.message.split('\n')[0]}`);
  });

  // Optional write to logs
  if (writeOut) {
    try {
      const logsDir = path.join(projectRoot, 'logs');
      try { mkdirSync(logsDir, { recursive: true }); } catch {}
      const promptText = generateAIPrompt(top, customFindings);
      writeFileSync(path.join(logsDir, 'ts-analysis-prompt.md'), promptText, 'utf8');
      writeFileSync(
        path.join(logsDir, 'ts-errors.json'),
        JSON.stringify({ errors, topErrors: top, customFindings }, null, 2),
        'utf8'
      );
      console.log(`[ts-analyze] Wrote logs to logs/ts-analysis-prompt.md and logs/ts-errors.json`);
    } catch (err) {
      console.warn('[ts-analyze] Failed to write logs:', err?.message || err);
    }
  }

  if (customFindings.length) {
    console.log(`\n[custom] EnhancedEmailService findings: ${customFindings.length}`);
    customFindings.slice(0, 50).forEach((f, i) => {
      console.log(`- ${f.file}:${f.line}:${f.col} — ${f.message}`);
    });
  }

  if (promptOnly) {
    console.log('\n--- AI PROMPT START ---');
    console.log(generateAIPrompt(top, customFindings));
    console.log('--- AI PROMPT END ---');
    if (ci) process.exit(1);
    return;
  }

  if (apply) {
    console.log('[ts-analyze] Applying safe fixes...');
    const fixes = [];
    // Safe fixers
    fixes.push({ name: 'withApiHandler context', result: fixWithApiHandlerContext() });
    fixes.push({ name: 'blocked-slots null guards', result: guardNullabilityInBlockedSlots() });

    for (const f of fixes) {
      console.log(`- ${f.name}: ${f.result.applied ? 'applied' : 'skipped'}${f.result.reason ? ` (${f.result.reason})` : ''}`);
    }

    console.log('[ts-analyze] Re-running TypeScript check...');
    const res2 = run('npx tsc --noEmit --pretty false');
    const allOut2 = [res2.stdout, res2.stderr].filter(Boolean).join('\n');
    const errors2 = parseTscOutput(allOut2);
    if (errors2.length === 0) {
      console.log('✓ All TypeScript errors resolved after fixes.');
      return;
    }

    const top2 = summarize(errors2, maxIdx);
    console.log(`Remaining ${errors2.length} errors. Top ${top2.length}:
`);
    top2.forEach((e, i) => console.log(`${i + 1}. ${e.file}:${e.line}:${e.col} ${e.code}\n   ${e.message.split('\n')[0]}`));

    console.log('\n--- AI PROMPT START ---');
    // Re-run custom analyzer for updated prompt
    const files2 = collectSourceFiles();
    const triggerSet2 = parseEmailTriggerTypes();
    const customFindings2 = analyzeEnhancedEmailUsage(files2, triggerSet2);
    console.log(generateAIPrompt(top2, customFindings2));
    console.log('--- AI PROMPT END ---');
    if (writeOut) {
      try {
        const logsDir = path.join(projectRoot, 'logs');
        try { mkdirSync(logsDir, { recursive: true }); } catch {}
        const promptText2 = generateAIPrompt(top2, customFindings2);
        writeFileSync(path.join(logsDir, 'ts-analysis-prompt-post-apply.md'), promptText2, 'utf8');
        writeFileSync(
          path.join(logsDir, 'ts-errors-post-apply.json'),
          JSON.stringify({ errors: errors2, topErrors: top2, customFindings: customFindings2 }, null, 2),
          'utf8'
        );
        console.log(`[ts-analyze] Wrote post-apply logs to logs/`);
      } catch (err) {
        console.warn('[ts-analyze] Failed to write post-apply logs:', err?.message || err);
      }
    }
    if (ci && (errors2.length > 0 || customFindings2.length > 0)) process.exit(1);
    return;
  }

  console.log('\nTip: Run with --prompt to print an AI prompt, or --apply to apply safe fixes.');
  if (ci) process.exit(1);
}

main();
