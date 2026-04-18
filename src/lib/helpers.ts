/**
 * Utility helpers kept separate from `utils.ts` so that shadcn CLI block
 * installs (which overwrite `utils.ts` with a stock `cn()`) don't wipe them.
 *
 * Import from `@/lib/helpers`. `@/lib/utils` is reserved for `cn` + anything
 * shadcn may generate.
 */

/** Assertion helper for type-narrowing. Throws in dev; logs + returns in prod. */
export function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) {
    if (process.env.NODE_ENV !== 'production') {
      throw new Error(`[Invariant] ${message}`);
    }
    console.error(`[Invariant] ${message}`);
  }
}

/** Sleep helper for testing + delayed actions. */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** Truncate text to a maximum length with ellipsis. */
export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1).trimEnd() + '…';
}

/** Safe JSON parse with fallback. */
export function safeJsonParse<T>(str: string, fallback: T): T {
  try {
    return JSON.parse(str) as T;
  } catch {
    return fallback;
  }
}

/**
 * Deterministic slug from Arabic or English text.
 * Strips diacritics, lowercases, replaces spaces with hyphens.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u064B-\u065F\u0670]/g, '') // Arabic diacritics
    .replace(/[\u0300-\u036f]/g, '') // Latin diacritics
    .replace(/[^\w\s-\u0600-\u06FF]/g, '') // Keep Arabic unicode range
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}
