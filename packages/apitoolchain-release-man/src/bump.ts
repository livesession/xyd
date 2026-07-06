import type { BumpType, ReleaseChange } from "./types";

/**
 * A change is "additive" (a new feature that warrants a minor bump) when its
 * kind adds surface — `method-added`, `type-added`, `param-added`,
 * `field-added`, `enum-value-added`, `union-variant-added`, etc. A deprecation
 * (`deprecated-added`) also ends in `-added` but is metadata, not a feature.
 */
export function isAdditive(kind: string): boolean {
  return kind.endsWith("-added") && kind !== "deprecated-added";
}

/**
 * Map a set of classified changes to a semver bump:
 *   any breaking            → major
 *   else any additive change → minor
 *   else (metadata only)     → patch
 *   no changes               → none
 *
 * Robust to unknown `kind`s: a non-breaking, non-additive change defaults to a
 * patch. `nextVersion` softens pre-1.0 bumps so 0.x SDKs don't jump to 1.0.
 */
export function bumpTypeFromChanges(
  changes: readonly ReleaseChange[],
): BumpType {
  if (changes.length === 0) return "none";
  if (changes.some((c) => c.severity === "breaking")) return "major";
  if (changes.some((c) => isAdditive(c.kind))) return "minor";
  return "patch";
}
