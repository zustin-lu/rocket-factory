// The brand name: a short label set with `/rocket-factory brand <name>`, painted on a
// plate above the rocket and at the start of the limits band, so two Claude instances
// with the theme on can be told apart at a glance. Kept in `$.store`, which lives in
// each instance's own config folder, so every instance keeps its own brand.

/** Longest brand kept, in characters; the plate above the rocket fits about this many. */
export const BRAND_MAX = 16

/** The `$.store` key the brand is kept under between sessions. */
export const BRAND_STORE_KEY = 'brand'

/**
 * Tidies what the person typed: control characters out, spaces collapsed, trimmed,
 * then cut to BRAND_MAX. `isCut` says the name was longer.
 */
export const cleanBrand = (raw: string): { name: string; isCut: boolean } => {
  const tidy = raw
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  const chars = Array.from(tidy)
  return { name: chars.slice(0, BRAND_MAX).join('').trim(), isCut: chars.length > BRAND_MAX }
}

/** A stored value read back: a string brand, or none. */
export const storedBrand = (value: unknown): string => (typeof value === 'string' ? cleanBrand(value).name : '')
