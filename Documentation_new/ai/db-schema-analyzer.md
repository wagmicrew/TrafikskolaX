# DB Schema Analyzer (Drizzle + Neon)

This document describes the DB-vs-code analyzer used to keep the Neon Postgres schema in sync with our Drizzle schema and code.

- Location: `scripts/db-schema-analyze.mjs`
- Outputs:
  - Prompt/report: `logs/db-schema-analysis-prompt.md`
  - Draft migration SQL: `lib/db/migrations/auto-missing-columns-<timestamp>.sql` (only when appropriate)

## Purpose
- Detects columns/tables used in code that are missing in DB.
- Detects Drizzle-declared columns that are missing in DB.
- Detects raw SQL references to non-existent tables/columns.
- Detects enum types/labels missing in DB.
- Generates a concise prompt/report and best-effort migration SQL.

## Flags
- `--prompt`: write prompt/report to `logs/db-schema-analysis-prompt.md`.
- `--write`: write migration SQL if there are actionable changes.
- `--ci`: exit non-zero when issues are found (for CI gating).
- `--truth=code|db`:
  - `code`: Drizzle schema is the source of truth; migrations are generated to align DB.
  - `db`: Live DB is the source of truth; migrations are suppressed; fix code/Drizzle instead.

## NPM scripts
Defined in `package.json`:
- `npm run db:analyze` → `--prompt --write --truth=code` (default: code is truth)
- `npm run db:analyze:ci` → `--prompt --ci` (neutral, fails on drift)
- `npm run db:analyze:ci:code` → `--prompt --ci --truth=code --write`
- `npm run db:analyze:ci:db` → `--prompt --ci --truth=db`

## Current policy (Source of Truth)
- Source of truth: **code (Drizzle)**.
- CI should run: `npm run db:analyze:ci:code`
  - On drift, CI fails and a draft migration is generated under `lib/db/migrations/`.

## Applying migrations
- Review the generated file: `lib/db/migrations/auto-missing-columns-<timestamp>.sql`.
- Apply manually when ready:
  - `node apply-migration.js lib/db/migrations/auto-missing-columns-<timestamp>.sql`
- Follow-up for NOT NULL columns: backfill data first, then `ALTER COLUMN ... SET NOT NULL`.

## Analyzer details & false-positive mitigation
- Raw SQL scanning ignores:
  - String literals, comments, regex literals.
  - System schemas/tables (`information_schema`, `pg_catalog`, `pg_*`) and `EXCLUDED` (upserts).
  - Qualified columns are only checked when the LHS is a known alias or an existing table.
- Scans TS/JS project files (excluding `node_modules`, `.next`, `public`, `drizzle/meta`, `logs`, `vendor/ckeditor`).

## Requirements & constraints
- Database: Neon Postgres (env: `DATABASE_URL` in `.env.local`).
- ORM: Drizzle. Do not change dependencies.
- App Router (Next.js). Keep UI/design unchanged.
- Use Drizzle ORM and Neon-compatible SQL only.

## Troubleshooting
- "DATABASE_URL is not set": add `.env.local` with the Neon connection string.
- No migration generated: either no drift or `--truth=db` is set.
- CI failing: open `logs/db-schema-analysis-prompt.md` to see drift and remediation path.

## Examples
- Local analysis (write prompt and migrations):
```bash
npm run db:analyze
```
- CI (code is truth, fail on drift, write migrations):
```bash
npm run db:analyze:ci:code
```
- CI (DB is truth, fail on drift, no migrations):
```bash
npm run db:analyze:ci:db
```
