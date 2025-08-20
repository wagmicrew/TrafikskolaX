/*
DB vs Code Analyzer for Drizzle + Neon

What it does
- Introspects live Neon (Postgres) schema using pg
- Parses Drizzle pgTable definitions from lib/db/schema.ts and lib/db/schema/*.ts
- Scans project for Drizzle table/column usages and raw SQL usages
- Detects:
  * Columns used in code but missing in DB
  * Columns defined in Drizzle but missing in DB
  * Tables referenced by raw SQL but missing in DB
  * Columns referenced by raw SQL but missing in DB
  * Enum definitions in Drizzle not present (or missing labels) in DB
- Generates:
  * AI prompt with prioritized issues, file excerpts, and suggested fixes
  * Draft migration SQL to add missing columns/types (best-effort)

Usage
  node scripts/db-schema-analyze.mjs [--prompt] [--write] [--ci] [--truth=code|db]

Flags
  --prompt        Write AI prompt to logs/db-schema-analysis-prompt.md
  --write         Write migration SQL to lib/db/migrations/auto-missing-columns-<timestamp>.sql
  --ci            Exit non-zero when issues are detected (for CI pipelines)
  --truth=code    Treat code/Drizzle as source of truth (generate/apply DB migrations)
  --truth=db      Treat live DB as source of truth (suppress migration generation; fix code/schema)

Notes
- Safe best-effort generator; does not apply migrations.
- Requires DATABASE_URL (reads .env.local by default).
*/

import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import url from 'url';
import dotenv from 'dotenv';
import { neon } from '@neondatabase/serverless';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const projectRoot = path.resolve(__dirname, '..');

// Load env early
const envPathCandidates = [
  path.join(projectRoot, '.env.local'),
  path.join(projectRoot, '.env'),
];
for (const p of envPathCandidates) {
  if (fs.existsSync(p)) {
    dotenv.config({ path: p });
    break;
  }
}

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL is not set. Please create .env.local with DATABASE_URL.');
  process.exit(1);
}

const ARGS = new Set(process.argv.slice(2));
const WRITE_PROMPT = ARGS.has('--prompt');
const WRITE_MIGRATION = ARGS.has('--write');
const CI_MODE = ARGS.has('--ci');
const TRUTH = (() => {
  const a = process.argv.slice(2).find((x) => x.startsWith('--truth='));
  if (!a) return null;
  const v = a.split('=')[1]?.toLowerCase();
  return v === 'code' || v === 'db' ? v : null;
})();

// -----------------------------
// Utilities
// -----------------------------

function ts() {
  const d = new Date();
  const pad = (n) => (n < 10 ? '0' + n : '' + n);
  return (
    d.getFullYear().toString() +
    pad(d.getMonth() + 1) +
    pad(d.getDate()) + '-' +
    pad(d.getHours()) +
    pad(d.getMinutes()) +
    pad(d.getSeconds())
  );
}

async function walk(dir, ignores = []) {
  const entries = await fsp.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    const rel = path.relative(projectRoot, full).replace(/\\/g, '/');
    if (ignores.some((ig) => rel.startsWith(ig))) continue;
    if (e.isDirectory()) {
      files.push(...(await walk(full, ignores)));
    } else {
      files.push(full);
    }
  }
  return files;
}

async function readFileSafe(p) {
  try { return await fsp.readFile(p, 'utf8'); } catch { return ''; }
}

function ensureDirSync(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

// -----------------------------
// Introspect DB (live Neon)
// -----------------------------

async function introspectDb() {
  const sql = neon(DATABASE_URL);
  const tablesRows = await sql`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type='BASE TABLE'
    ORDER BY table_name
  `;
  const tables = tablesRows.map(r => r.table_name);

  const columnsByTable = {};
  for (const t of tables) {
    const colsRows = await sql`
      SELECT column_name, data_type, is_nullable, column_default, character_maximum_length, numeric_precision, numeric_scale
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = ${t}
      ORDER BY ordinal_position
    `;
    columnsByTable[t] = colsRows.map(r => ({
      name: r.column_name,
      dataType: r.data_type,
      isNullable: r.is_nullable === 'YES',
      default: r.column_default,
      charMax: r.character_maximum_length,
      numPrecision: r.numeric_precision,
      numScale: r.numeric_scale,
    }));
  }

  const enumsRows = await sql`
    SELECT t.typname AS enum_name, e.enumlabel AS label
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
    ORDER BY enum_name, e.enumsortorder
  `;
  const enumsByName = {};
  for (const r of enumsRows) {
    enumsByName[r.enum_name] ??= [];
    enumsByName[r.enum_name].push(r.label);
  }

  return { tables, columnsByTable, enumsByName };
}

// -----------------------------
// Parse Drizzle schema from TS using regex (best-effort)
// -----------------------------

const DRIZZLE_TYPE_SQL = {
  uuid: () => 'uuid',
  varchar: (opts) => {
    const len = opts?.length || opts?.length?.value;
    return len ? `varchar(${len})` : 'varchar';
  },
  text: () => 'text',
  integer: () => 'integer',
  decimal: (opts) => {
    const p = opts?.precision;
    const s = opts?.scale;
    return p && s ? `numeric(${p},${s})` : 'numeric';
  },
  boolean: () => 'boolean',
  timestamp: () => 'timestamp',
  time: () => 'time',
  date: () => 'date',
  serial: () => 'integer', // for ADD COLUMN, prefer integer
};

function parseOptionsObject(objText) {
  // Very light parser for { length: 255 } or { precision: 10, scale: 2 }
  const out = {};
  (objText || '').split(',').forEach(pair => {
    const m = pair.trim().match(/(\w+)\s*:\s*([0-9]+)/);
    if (m) out[m[1]] = Number(m[2]);
  });
  return out;
}

function parseDrizzleFiles(text, filePath) {
  const tables = []; // { varName, tableName, columns: [{name, typeFn, sqlType, notNull, defaultTag}] }
  const enums = []; // { name, labels: [] }

  // pgEnum('name', [ 'a','b' ])
  const enumRe = /pgEnum\(\s*['"]([\w_]+)['"]\s*,\s*\[([\s\S]*?)\]\s*\)/g;
  for (const m of text.matchAll(enumRe)) {
    const name = m[1];
    const labelsRaw = m[2];
    const labels = Array.from(labelsRaw.matchAll(/['"]([^'"]+)['"]/g)).map(x => x[1]);
    enums.push({ name, labels });
  }

  // export const xyz = pgTable('table_name', { ...columns... })
  const tableRe = /export\s+const\s+(\w+)\s*=\s*pgTable\(\s*['"]([\w_]+)['"]\s*,\s*\{([\s\S]*?)\}\s*\)/g;
  for (const m of text.matchAll(tableRe)) {
    const varName = m[1];
    const tableName = m[2];
    const body = m[3];

    const columns = [];
    // Match lines like: email: varchar('email', { length: 255 }).notNull().unique(),
    const colRe = /(\w+)\s*:\s*(\w+)\(\s*['"]([\w_]+)['"]\s*(?:,\s*\{([\s\S]*?)\})?\)\s*([^,]*),?/g;
    for (const c of body.matchAll(colRe)) {
      const prop = c[1];
      const typeFn = c[2];
      const colName = c[3];
      const optsText = c[4];
      const chain = c[5] || '';
      const opts = parseOptionsObject(optsText);
      const notNull = /\.notNull\(\)/.test(chain);
      const hasDefaultNow = /\.defaultNow\(\)/.test(chain);
      const hasDefaultRandom = /\.defaultRandom\(\)/.test(chain);
      const defaultStrMatch = chain.match(/\.default\(([^\)]*)\)/);
      const defaultRaw = defaultStrMatch ? defaultStrMatch[1].trim() : null;
      const defaultTag = hasDefaultNow ? 'now()' : hasDefaultRandom ? 'gen_random_uuid()' : defaultRaw;

      const sqlTypeFn = DRIZZLE_TYPE_SQL[typeFn];
      const sqlType = sqlTypeFn ? sqlTypeFn(opts) : null;
      columns.push({ prop, name: colName, typeFn, sqlType, notNull, defaultTag });
    }

    tables.push({ varName, tableName, columns });
  }

  return { tables, enums };
}

async function parseProjectDrizzleSchema() {
  const schemaMain = path.join(projectRoot, 'lib', 'db', 'schema.ts');
  const schemaDir = path.join(projectRoot, 'lib', 'db', 'schema');

  const results = { tables: [], enums: [] };
  if (fs.existsSync(schemaMain)) {
    const text = await readFileSafe(schemaMain);
    const { tables, enums } = parseDrizzleFiles(text, schemaMain);
    results.tables.push(...tables);
    results.enums.push(...enums);
  }
  if (fs.existsSync(schemaDir)) {
    const files = (await fsp.readdir(schemaDir)).filter(f => f.endsWith('.ts'));
    for (const f of files) {
      const fp = path.join(schemaDir, f);
      const text = await readFileSafe(fp);
      const { tables, enums } = parseDrizzleFiles(text, fp);
      results.tables.push(...tables);
      results.enums.push(...enums);
    }
  }
  return results;
}

// -----------------------------
// Scan code for Drizzle and raw SQL usage
// -----------------------------

const IMPORT_SCHEMA_RE = /from\s+['"][^'"]*\/lib\/db\/schema['"]/;

function parseImportsForSchema(content) {
  const namespace = []; // [{ ns: 'schema' }]
  const named = []; // [{ local: 'bookings', export: 'bookings' }]
  const importRe = /import\s+([^;]+?)\s+from\s+['"][^'"]*\/lib\/db\/schema['"]/g;
  for (const m of content.matchAll(importRe)) {
    const spec = m[1].trim();
    // namespace: * as schema
    const ns = spec.match(/\*\s+as\s+(\w+)/);
    if (ns) namespace.push({ ns: ns[1] });
    // named: { a, b as c }
    const ni = spec.match(/\{([\s\S]*?)\}/);
    if (ni) {
      const items = ni[1].split(',').map(s => s.trim()).filter(Boolean);
      for (const it of items) {
        const mm = it.match(/(\w+)\s+as\s+(\w+)/) || it.match(/^(\w+)$/);
        if (mm) {
          const exp = mm[1];
          const loc = mm[2] || mm[1];
          named.push({ export: exp, local: loc });
        }
      }
    }
  }
  return { namespace, named };
}

function extractNsUsages(content, ns, drizzleTablesByVar) {
  const out = [];
  const re = new RegExp(`\\b${ns}\\.(\\w+)\\.(\\w+)\\b`, 'g');
  for (const m of content.matchAll(re)) {
    const tableVar = m[1];
    const col = m[2];
    if (!drizzleTablesByVar[tableVar]) continue;
    out.push({ tableVar, column: col, index: m.index || 0 });
  }
  return out;
}

function extractNamedUsages(content, namedArr, drizzleTablesByVar) {
  const out = [];
  for (const { export: exp, local } of namedArr) {
    if (!drizzleTablesByVar[exp]) continue; // ensure it's a table var
    const colsSet = new Set(drizzleTablesByVar[exp].columns.map(c => c.name));
    const re = new RegExp(`\\b${local}\\.(\\w+)\\b`, 'g');
    for (const m of content.matchAll(re)) {
      const col = m[1];
      if (!colsSet.has(col)) continue; // filter out methods like .select
      out.push({ tableVar: exp, column: col, index: m.index || 0 });
    }
  }
  return out;
}

function extractRawSql(content) {
  const out = [];
  // Mask non-template noise while preserving string length so indices remain valid
  function maskNonTemplateNoise(src) {
    let s = src;
    // Block comments
    s = s.replace(/\/\*[\s\S]*?\*\//g, (m) => ' '.repeat(m.length));
    // Line comments
    s = s.replace(/\/\/[^\n]*/g, (m) => ' '.repeat(m.length));
    // Regex literals (best-effort)
    s = s.replace(/\/(?!\/|\*)[^\/\n\\]*(?:\\.[^\/\n\\]*)*\/[gimsuy]*/g, (m) => ' '.repeat(m.length));
    // Quoted strings
    s = s.replace(/'([^'\\]|\\.)*'/g, (m) => ' '.repeat(m.length));
    s = s.replace(/"([^"\\]|\\.)*"/g, (m) => ' '.repeat(m.length));
    return s;
  }

  const masked = maskNonTemplateNoise(content);
  const re = /\bsql`([\s\S]*?)`/g;
  for (const m of masked.matchAll(re)) {
    const sql = m[1];
    out.push({ sql, index: m.index || 0 });
  }
  return out;
}

function analyzeSqlAgainstDb(sql, dbTablesSet, dbColsByTable) {
  const issues = [];

  // Preprocess: remove JS interpolations and strip quoted strings
  let s = sql.replace(/\$\{[\s\S]*?\}/g, '');
  s = s.replace(/'([^']|''|\\')*'/g, "''");
  s = s.replace(/"([^"]|""|\\")*"/g, '""');

  const isSystem = (name) => {
    if (!name) return false;
    const n = name.toLowerCase();
    return n === 'information_schema' || n === 'pg_catalog' || n.startsWith('pg_') || n === 'excluded';
  };

  // Detect table aliases: FROM table AS t or FROM table t
  const alias = {};
  const fromJoinRe = /(from|join)\s+([a-zA-Z_][\w]*)\s*(?:as\s+([a-zA-Z_][\w]*)|\s+([a-zA-Z_][\w]*))?/gi;
  for (const m of s.matchAll(fromJoinRe)) {
    const table = m[2];
    const a = m[3] || m[4];
    if (a) alias[a] = table;
    if (!dbTablesSet.has(table) && !isSystem(table)) {
      issues.push({ kind: 'missing_table', table, where: 'FROM/JOIN' });
    }
  }

  // Qualified columns t.col or table.col
  const qualColRe = /([a-zA-Z_][\w]*)\.([a-zA-Z_][\w]*)/g;
  for (const m of s.matchAll(qualColRe)) {
    const tOrAlias = m[1];
    const col = m[2];
    if (isSystem(tOrAlias)) continue; // e.g., information_schema.columns, EXCLUDED.value

    const lhsIsAlias = Object.prototype.hasOwnProperty.call(alias, tOrAlias);
    const lhsIsTable = dbTablesSet.has(tOrAlias);
    if (!lhsIsAlias && !lhsIsTable) {
      // Unknown LHS (likely a JS placeholder, string artifact, or non-table token). Ignore.
      continue;
    }

    const table = lhsIsAlias ? alias[tOrAlias] : tOrAlias;
    if (!dbTablesSet.has(table)) {
      issues.push({ kind: 'missing_table_for_column', table: table, column: col });
    } else {
      const cols = dbColsByTable[table] || [];
      if (!cols.some(c => c.name === col)) {
        issues.push({ kind: 'missing_column', table, column: col });
      }
    }
  }

  return issues;
}

// -----------------------------
// Main
// -----------------------------

(async function main() {
  console.log('Analyzing DB schema vs code...');

  const [db, drizzle] = await Promise.all([
    introspectDb(),
    parseProjectDrizzleSchema(),
  ]);

  const dbTablesSet = new Set(db.tables);
  const dbColsByTable = db.columnsByTable;

  const drizzleTablesByVar = Object.fromEntries(drizzle.tables.map(t => [t.varName, t]));
  const drizzleEnumsByName = Object.fromEntries(drizzle.enums.map(e => [e.name, e.labels]));

  // Compare Drizzle vs DB (columns)
  const drift = [];
  for (const t of drizzle.tables) {
    const liveCols = new Set((dbColsByTable[t.tableName] || []).map(c => c.name));
    for (const c of t.columns) {
      if (!liveCols.has(c.name)) {
        drift.push({ kind: 'column_missing_in_db', tableVar: t.varName, table: t.tableName, column: c.name, sqlType: c.sqlType, notNull: c.notNull, defaultTag: c.defaultTag });
      }
    }
  }

  // Compare Enums
  const enumIssues = [];
  for (const [enumName, labels] of Object.entries(drizzleEnumsByName)) {
    const live = db.enumsByName[enumName];
    if (!live) {
      enumIssues.push({ kind: 'enum_missing', enumName, expected: labels });
    } else {
      for (const lab of labels) {
        if (!live.includes(lab)) enumIssues.push({ kind: 'enum_label_missing', enumName, label: lab });
      }
    }
  }

  // Scan code usage
  const ignores = [
    'node_modules', '.git', '.next', 'public', 'drizzle/meta', 'logs', 'dist', 'build', 'drizzle', 'vendor', 'ckeditor'
  ];
  const rootFiles = await walk(projectRoot, ignores);
  const tsFiles = rootFiles.filter(f => /\.(ts|tsx|js|mjs|cjs)$/.test(f));

  const codeIssues = [];
  const rawSqlIssues = [];
  const codeSnippets = []; // { file, index, excerpt }

  for (const f of tsFiles) {
    const content = await readFileSafe(f);
    if (!content) continue;

    // Collect code excerpts map helper
    function excerptAt(idx) {
      const start = Math.max(0, idx - 200);
      const end = Math.min(content.length, idx + 200);
      return content.slice(start, end);
    }

    // Imports
    if (IMPORT_SCHEMA_RE.test(content)) {
      const { namespace, named } = parseImportsForSchema(content);

      for (const ns of namespace) {
        const usages = extractNsUsages(content, ns.ns, drizzleTablesByVar);
        for (const u of usages) {
          const table = drizzleTablesByVar[u.tableVar]?.tableName;
          const liveCols = new Set((dbColsByTable[table] || []).map(c => c.name));
          if (!liveCols.has(u.column)) {
            codeIssues.push({ kind: 'code_uses_missing_column', file: f, tableVar: u.tableVar, table, column: u.column });
            codeSnippets.push({ file: f, index: u.index, excerpt: excerptAt(u.index) });
          }
        }
      }

      const usagesNamed = extractNamedUsages(content, named, drizzleTablesByVar);
      for (const u of usagesNamed) {
        const table = drizzleTablesByVar[u.tableVar]?.tableName;
        const liveCols = new Set((dbColsByTable[table] || []).map(c => c.name));
        if (!liveCols.has(u.column)) {
          codeIssues.push({ kind: 'code_uses_missing_column', file: f, tableVar: u.tableVar, table, column: u.column });
          codeSnippets.push({ file: f, index: u.index, excerpt: excerptAt(u.index) });
        }
      }
    }

    // Raw SQL
    if (content.includes('sql`')) {
      const raws = extractRawSql(content);
      for (const r of raws) {
        const issues = analyzeSqlAgainstDb(r.sql, dbTablesSet, dbColsByTable);
        for (const is of issues) {
          rawSqlIssues.push({ file: f, issue: is });
          codeSnippets.push({ file: f, index: r.index, excerpt: excerptAt(r.index) });
        }
      }
    }
  }

  // Consolidate missing columns (unique)
  function uniqKey(x) { return `${x.table}:${x.column}`; }
  const missingColumns = new Map();
  for (const d of drift.filter(x => x.kind === 'column_missing_in_db')) missingColumns.set(uniqKey(d), d);
  for (const c of codeIssues.filter(x => x.kind === 'code_uses_missing_column')) missingColumns.set(uniqKey(c), {
    kind: 'column_missing_in_db',
    tableVar: c.tableVar,
    table: c.table,
    column: c.column,
    sqlType: drizzleTablesByVar[c.tableVar]?.columns.find(cc => cc.name === c.column)?.sqlType || null,
    notNull: drizzleTablesByVar[c.tableVar]?.columns.find(cc => cc.name === c.column)?.notNull || false,
    defaultTag: drizzleTablesByVar[c.tableVar]?.columns.find(cc => cc.name === c.column)?.defaultTag || null,
  });

  // Generate migration SQL (best-effort)
  const migrationStatements = [];

  // Enums first
  for (const ei of enumIssues) {
    if (ei.kind === 'enum_missing') {
      const values = ei.expected.map(v => `'${v.replace(/'/g, "''")}'`).join(', ');
      migrationStatements.push(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = '${ei.enumName}') THEN CREATE TYPE "${ei.enumName}" AS ENUM (${values}); END IF; END $$;`);
    } else if (ei.kind === 'enum_label_missing') {
      migrationStatements.push(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid=e.enumtypid WHERE t.typname='${ei.enumName}' AND e.enumlabel='${ei.label}') THEN ALTER TYPE "${ei.enumName}" ADD VALUE '${ei.label.replace(/'/g, "''")}'; END IF; END $$;`);
    }
  }

  for (const m of missingColumns.values()) {
    if (!m.sqlType) {
      // Unknown type; leave as TODO
      migrationStatements.push(`-- TODO: Column ${m.table}.${m.column} type unknown from Drizzle parse. Please set correct type.`);
      migrationStatements.push(`ALTER TABLE "${m.table}" ADD COLUMN IF NOT EXISTS "${m.column}" text;`);
      continue;
    }
    const pieces = [`ALTER TABLE "${m.table}" ADD COLUMN IF NOT EXISTS "${m.column}" ${m.sqlType}`];
    if (m.defaultTag && /\(\)$/.test(m.defaultTag)) {
      // function default like now() or gen_random_uuid()
      pieces.push(`DEFAULT ${m.defaultTag}`);
    } else if (m.defaultTag && /^['"0-9]/.test(m.defaultTag)) {
      pieces.push(`DEFAULT ${m.defaultTag}`);
    }
    // Not setting NOT NULL directly to avoid failing on existing rows. Suggest follow-up.
    migrationStatements.push(pieces.join(' ') + ';');
    if (m.notNull) {
      migrationStatements.push(`-- Optional follow-up once backfilled: ALTER TABLE "${m.table}" ALTER COLUMN "${m.column}" SET NOT NULL;`);
    }
  }

  const hadMigrations = migrationStatements.length > 0;

  let migrationFilePath = null;
  if (WRITE_MIGRATION && hadMigrations && TRUTH !== 'db') {
    const outDir = path.join(projectRoot, 'lib', 'db', 'migrations');
    ensureDirSync(outDir);
    migrationFilePath = path.join(outDir, `auto-missing-columns-${ts()}.sql`);
    await fsp.writeFile(migrationFilePath, migrationStatements.join('\n') + '\n', 'utf8');
    console.log('Wrote migration SQL to', migrationFilePath);
  }

  // AI Prompt generation
  const issuesList = [];

  // Prioritize: (1) columns used in code missing in DB, (2) Drizzle->DB missing, (3) raw SQL missing tables/columns, (4) enums
  const codeMissing = codeIssues.filter(x => x.kind === 'code_uses_missing_column');
  for (const c of codeMissing) {
    issuesList.push(`- Code uses missing column: ${c.table}.${c.column} in ${path.relative(projectRoot, c.file)}`);
  }
  for (const d of drift.filter(x => x.kind === 'column_missing_in_db')) {
    issuesList.push(`- Drizzle declares column missing in DB: ${d.table}.${d.column}`);
  }
  for (const r of rawSqlIssues) {
    const is = r.issue;
    if (is.kind === 'missing_table') {
      issuesList.push(`- Raw SQL references missing table ${is.table} (${path.relative(projectRoot, r.file)})`);
    } else if (is.kind === 'missing_column' || is.kind === 'missing_table_for_column') {
      issuesList.push(`- Raw SQL references missing ${is.table}.${is.column} (${path.relative(projectRoot, r.file)})`);
    }
  }
  for (const ei of enumIssues) {
    if (ei.kind === 'enum_missing') issuesList.push(`- Enum type missing in DB: ${ei.enumName}`);
    if (ei.kind === 'enum_label_missing') issuesList.push(`- Enum value missing: ${ei.enumName} -> ${ei.label}`);
  }

  const snippetsByFile = new Map();
  for (const s of codeSnippets) {
    const rel = path.relative(projectRoot, s.file).replace(/\\/g, '/');
    const arr = snippetsByFile.get(rel) || [];
    arr.push(s.excerpt);
    snippetsByFile.set(rel, arr);
  }

  const promptLines = [];
  promptLines.push('# Task: Fix DB schema vs code mismatches (Drizzle + Neon)');
  promptLines.push('');
  promptLines.push('## Context');
  promptLines.push('- Project uses Drizzle ORM with Neon Postgres.');
  promptLines.push('- Do not change dependencies. Use Drizzle for CRUD and Drizzle/SQL migrations.');
  promptLines.push('- App Router (Next.js).');
  if (TRUTH === 'code') {
    promptLines.push('- Source of truth: code (Drizzle schema)');
  } else if (TRUTH === 'db') {
    promptLines.push('- Source of truth: live DB');
  } else {
    promptLines.push('- Source of truth: not specified. Action needed: choose code or db.');
  }
  promptLines.push('');
  promptLines.push('## Findings (prioritized)');
  if (issuesList.length === 0) {
    promptLines.push('- No critical mismatches found.');
  } else {
    promptLines.push(...issuesList);
  }
  promptLines.push('');
  promptLines.push('## Proposed Actions');
  if (issuesList.length === 0) {
    promptLines.push('- No migration generated. No critical mismatches found.');
  } else if (TRUTH === 'code') {
    if (hadMigrations) {
      promptLines.push('- Apply generated migration SQL to align DB with Drizzle.');
      promptLines.push(`- Migration file: ${migrationFilePath ? path.relative(projectRoot, migrationFilePath) : '(not written; rerun with --write)'}`);
    } else {
      promptLines.push('- Align DB to match Drizzle (generate migrations or add columns/types).');
    }
  } else if (TRUTH === 'db') {
    promptLines.push('- Align code to match DB: update Drizzle schema in lib/db/schema/ and fix code paths that reference missing columns.');
    promptLines.push('- Migrations suppressed because source of truth is DB.');
  } else {
    promptLines.push('- Choose source of truth:');
    promptLines.push('  - If code is truth: run with --truth=code and optionally --write to generate migrations.');
    promptLines.push('  - If DB is truth: run with --truth=db and update code/Drizzle schema to match DB.');
  }
  promptLines.push('- For NOT NULL columns added, backfill data and then set NOT NULL.');
  promptLines.push('- For enum issues, create enum type if missing or add missing labels (migration includes DO blocks).');
  promptLines.push('');
  promptLines.push('## Code Excerpts');
  for (const [file, arr] of snippetsByFile) {
    promptLines.push(`- ${file}`);
    for (const ex of arr.slice(0, 3)) { // limit per file
      const cleaned = ex.replace(/\u0000/g, '');
      promptLines.push('```');
      promptLines.push(cleaned);
      promptLines.push('```');
    }
  }
  promptLines.push('');
  promptLines.push('## Safety & Constraints');
  promptLines.push('- Keep UI/design unchanged.');
  promptLines.push('- Use Drizzle ORM types and patterns.');
  promptLines.push('- Neon-compatible SQL only.');
  promptLines.push('');
  promptLines.push('## Next Steps');
  promptLines.push('- If migration file exists, run it using:');
  promptLines.push('  node apply-migration.js <path-to-sql>');
  promptLines.push('- Otherwise, update Drizzle schema or code to stop referencing non-existent columns/tables.');

  const promptText = promptLines.join('\n');

  if (WRITE_PROMPT) {
    const logsDir = path.join(projectRoot, 'logs');
    ensureDirSync(logsDir);
    const out = path.join(logsDir, 'db-schema-analysis-prompt.md');
    await fsp.writeFile(out, promptText, 'utf8');
    console.log('Wrote AI prompt to', out);
  }

  // Summary to console
  const issuesCount = missingColumns.size + enumIssues.length + rawSqlIssues.length;
  console.log('Summary:');
  console.log(`  Drizzle tables parsed: ${drizzle.tables.length}`);
  console.log(`  Enums parsed: ${drizzle.enums.length}`);
  console.log(`  DB tables: ${db.tables.length}`);
  console.log(`  Missing columns detected: ${missingColumns.size}`);
  console.log(`  Enum issues: ${enumIssues.length}`);
  console.log(`  Raw SQL issues: ${rawSqlIssues.length}`);
  if (CI_MODE && issuesCount > 0) {
    console.error('CI: Issues detected. Set --truth=code|db to guide remediation.');
    process.exit(2);
  }
})();
