/**
 * Date utilities shared across booking APIs
 */

/**
 * Normalize various date inputs into a YYYY-MM-DD string.
 * - Accepts strings (e.g., "2025-08-18", ISO strings, etc.), Date objects, or other values.
 * - Returns an empty string if the value cannot be parsed to a valid date.
 */
export function normalizeDateKey(dateValue: unknown): string {
  if (!dateValue) return '';
  const str = String(dateValue);

  // If string starts with YYYY-MM-DD (optionally followed by 'T...'), return first 10 chars
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.slice(0, 10);

  // Try to parse any other format
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const pad2 = (n: number) => String(n).padStart(2, '0');
    const y = parsed.getFullYear();
    const m = pad2(parsed.getMonth() + 1);
    const d = pad2(parsed.getDate());
    return `${y}-${m}-${d}`;
  }

  return '';
}

/**
 * Alias: produce a YYYY-MM-DD string for Drizzle PG "date" columns.
 * Keeps naming intuitive at call sites.
 */
export function toDateKey(dateValue: unknown): string {
  return normalizeDateKey(dateValue);
}

/**
 * Generic alias for clarity when comparing against date columns.
 * Prefer this in API routes: eq(table.pgDateColumn, formatDateForColumn(value)).
 */
export function formatDateForColumn(dateValue: unknown): string {
  return normalizeDateKey(dateValue);
}
