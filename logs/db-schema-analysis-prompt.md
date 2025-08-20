# Task: Fix DB schema vs code mismatches (Drizzle + Neon)

## Context
- Project uses Drizzle ORM with Neon Postgres.
- Do not change dependencies. Use Drizzle for CRUD and Drizzle/SQL migrations.
- App Router (Next.js).
- Source of truth: code (Drizzle schema)

## Findings (prioritized)
- No critical mismatches found.

## Proposed Actions
- No migration generated. No critical mismatches found.
- For NOT NULL columns added, backfill data and then set NOT NULL.
- For enum issues, create enum type if missing or add missing labels (migration includes DO blocks).

## Code Excerpts

## Safety & Constraints
- Keep UI/design unchanged.
- Use Drizzle ORM types and patterns.
- Neon-compatible SQL only.

## Next Steps
- If migration file exists, run it using:
  node apply-migration.js <path-to-sql>
- Otherwise, update Drizzle schema or code to stop referencing non-existent columns/tables.