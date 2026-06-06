/**
 * Helpers for parsing unified-contract JSON-string responses.
 */

export function safeJsonParse<T>(value: unknown, fallback: T): T {
  if (value === null || value === undefined) return fallback;
  if (typeof value !== "string") {
    // Already an object; return as-is for convenience
    return value as T;
  }
  const trimmed = value.trim();
  if (trimmed === "" || trimmed === "{}" || trimmed === "[]") {
    return fallback;
  }
  try {
    return JSON.parse(trimmed) as T;
  } catch (e) {
    if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
      console.warn("[safeJsonParse] could not parse value:", value, e);
    }
    return fallback;
  }
}

/** True if the raw contract response represents an empty/missing report. */
export function isEmptyReport(parsed: unknown): boolean {
  if (parsed === null || parsed === undefined) return true;
  if (typeof parsed !== "object") return true;
  const keys = Object.keys(parsed as Record<string, unknown>);
  if (keys.length === 0) return true;
  const reportId = (parsed as { report_id?: unknown }).report_id;
  return !reportId || reportId === "";
}
