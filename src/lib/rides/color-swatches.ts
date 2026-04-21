/**
 * Color-name → hex map for the rides vertical swatches.
 *
 * The DB stores paint and interior names as plain strings
 * ("Alpine White", "Obsidian Black", "Macchiato Beige", "Red Suede",
 * etc.). The key-info component needs a hex for the round swatch
 * next to the label. Rather than carrying hex in the DB (Q2 locked
 * decision — presentation concern, not data), this helper maps a
 * name to a hex via a keyword-match strategy.
 *
 * How it works:
 *   1. Normalise the input (lowercase, collapse whitespace).
 *   2. Scan against a BASE_COLORS table of ~20 common paint roots
 *      ('white', 'black', 'silver', 'beige', ...). First hit wins.
 *   3. Fall back to a neutral grey when nothing matches.
 *
 * The hex values are not pure #000 / #fff — they're tuned so the
 * swatch reads correctly on both light and dark backgrounds and
 * doesn't fight the rest of the palette.
 *
 * Reference: planning/PHASE-3B-AUDIT.md §8 Q2 (locked Option D).
 */

/** Fallback when no keyword matches. Neutral mid-grey. */
export const DEFAULT_SWATCH_HEX = '#9ca3af';

/**
 * Base paint / trim keywords → tuned hex values.
 *
 * Order of iteration matters for keyword scanning: longer / more
 * specific roots come before broader ones (e.g. "off-white" is
 * resolved by scanning the parent "white" keyword).
 */
const BASE_COLORS: Readonly<Record<string, string>> = {
  // Whites
  white: '#f5f5f4',
  pearl: '#f8f7f2',
  ivory: '#f8f1dc',
  // Blacks / near-blacks
  black: '#1a1a1a',
  obsidian: '#0b0b0e',
  onyx: '#141417',
  ebony: '#20201e',
  // Neutrals
  silver: '#c4c4c0',
  grey: '#7a7a7a',
  gray: '#7a7a7a',
  graphite: '#3a3a3f',
  gunmetal: '#44474d',
  // Warm neutrals
  beige: '#d6c4a5',
  macchiato: '#d9c6a1',
  cream: '#f3e8c7',
  champagne: '#e6d7b4',
  tan: '#b9956f',
  almond: '#e6d1b1',
  sahara: '#cdb888',
  // Browns
  brown: '#78350f',
  tobacco: '#6b4423',
  chestnut: '#7b3f1d',
  mahogany: '#5b2e1e',
  cognac: '#9b5923',
  // Reds
  red: '#c92c2c',
  racing: '#b30b0b',
  monza: '#c71313',
  jupiter: '#a31515',
  rosso: '#b00020',
  crimson: '#9e1b32',
  // Blues
  blue: '#2563eb',
  marina: '#205691',
  estoril: '#1a4c8c',
  portimao: '#2b6dba',
  sonic: '#225ea8',
  navy: '#1e2a4a',
  pacific: '#1d6ea8',
  // Greens
  green: '#15803d',
  british: '#0e3b22',
  hunter: '#224a2b',
  emerald: '#0f6f4a',
  // Yellows / golds
  yellow: '#eab308',
  gold: '#c9a86a',
  mustard: '#c9a227',
  // Oranges
  orange: '#ea580c',
  copper: '#a55a2f',
  bronze: '#6b4423',
  // Purples / pinks
  purple: '#7c3aed',
  violet: '#6d28d9',
  burgundy: '#5c1a2b',
  pink: '#ec4899',
  rose: '#c04a6c',
};

/** Ordered search — longer/more-specific keys before shorter ones. */
const SEARCH_ORDER: readonly string[] = Object.keys(BASE_COLORS).sort(
  (a, b) => b.length - a.length,
);

/**
 * Resolves a color name to a display hex.
 *
 * @example
 *   getColorSwatch('Alpine White')         // -> '#f5f5f4'
 *   getColorSwatch('Obsidian Black')       // -> '#0b0b0e' (obsidian wins over black)
 *   getColorSwatch('Macchiato Beige')      // -> '#d9c6a1' (macchiato wins over beige)
 *   getColorSwatch('Red Suede')            // -> '#c92c2c'
 *   getColorSwatch(null)                   // -> '#9ca3af'
 *   getColorSwatch('Unicorn Holographic')  // -> '#9ca3af' (fallback)
 */
export function getColorSwatch(
  name: string | null | undefined,
): string {
  if (!name) return DEFAULT_SWATCH_HEX;

  const normalised = name.toLowerCase().replace(/\s+/g, ' ').trim();
  if (normalised.length === 0) return DEFAULT_SWATCH_HEX;

  for (const key of SEARCH_ORDER) {
    if (normalised.includes(key)) {
      return BASE_COLORS[key];
    }
  }

  return DEFAULT_SWATCH_HEX;
}
