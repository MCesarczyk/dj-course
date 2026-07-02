// Drizzle wraps driver errors in a DrizzleQueryError, so the Postgres error
// code (e.g. 23505 unique_violation, 23503 foreign_key_violation,
// 23514 check_violation) lives on `error.cause` — walk the chain to find it.
export const pgErrorCode = (error: unknown): string | undefined => {
  let current: unknown = error;
  const seen = new Set<unknown>();
  while (current && typeof current === 'object' && !seen.has(current)) {
    seen.add(current);
    const code = (current as { code?: unknown }).code;
    if (typeof code === 'string') return code;
    current = (current as { cause?: unknown }).cause;
  }
  return undefined;
};
