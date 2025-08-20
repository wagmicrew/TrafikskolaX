# TypeScript Analyzer (TS + EnhancedEmailService checks)

This repository includes a TypeScript analyzer that:
- Runs `tsc --noEmit` and ranks top errors for quick triage.
- Optionally applies a few safe, targeted fixers.
- Adds custom static checks for EnhancedEmailService usage.
- Can emit an AI-friendly prompt with file/line excerpts for assisted fixing.

Location: `scripts/ts-analyze-fix.mjs`

## What it detects
- TypeScript errors from `tsc --noEmit`, summarized by priority and file.
- EnhancedEmailService misuse patterns:
  - Calls to non-existent `sendTemplatedEmail(...)`.
  - Accidental instantiation: `new EnhancedEmailService(...)`.
  - Unknown trigger strings in `EnhancedEmailService.sendTriggeredEmail('<trigger>', ...)` when not present in `EmailTriggerType` union from `lib/email/enhanced-email-service.ts`.

## NPM scripts
- `npm run ts:analyze` — Run analyzer, summarize top errors.
- `npm run ts:analyze:prompt` — Print AI prompt with context and findings.
- `npm run ts:analyze:apply` — Apply safe, targeted auto-fixes, then re-run.
- `npm run ts:analyze:ci` — CI mode: non-zero exit if TS errors or EnhancedEmailService issues are detected.
- `npm run ts:analyze:ci:prompt` — CI + prompt output for logs.

## Usage examples
- Local quick check:
  ```bash
  npm run ts:analyze
  ```
- With AI prompt for deeper context:
  ```bash
  npm run ts:analyze:prompt
  ```
- CI enforcement (recommended):
  ```bash
  npm run ts:analyze:ci
  # or for more context in CI logs
  npm run ts:analyze:ci:prompt
  ```

## How to fix common findings
- "sendTemplatedEmail does not exist":
  - Replace with `EnhancedEmailService.sendTriggeredEmail(<EmailTriggerType>, <EmailContext>)` for templated sends.
  - Or use `EnhancedEmailService.sendEmail({ to, subject, html/text, ... })` for raw content.
- "Avoid instantiating EnhancedEmailService":
  - Use static methods only, e.g. `EnhancedEmailService.sendTriggeredEmail(...)`.
- "Unknown email trigger '<x>'":
  - Ensure the trigger is defined in `EmailTriggerType` in `lib/email/enhanced-email-service.ts`, or use an existing trigger.

## Extending the analyzer
- All logic lives in `scripts/ts-analyze-fix.mjs`.
- Custom checks:
  - `parseEmailTriggerTypes()` reads `EmailTriggerType` union.
  - `analyzeEnhancedEmailUsage()` scans all `.ts/.tsx` files for misuse patterns.
- The analyzer prints a dedicated section: "Custom Analyzer Findings (EnhancedEmailService)" when issues are found.

## Notes
- No dependency changes are required to use this tool.
- It respects project conventions: Next.js App Router, Drizzle ORM, Neon, JWT, Tailwind/Shadcn/Radix.
- Use alongside the DB analyzer documented in `Documentation_new/ai/db-schema-analyzer.md`.
