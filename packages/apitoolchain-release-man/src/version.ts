import type { BumpType } from "./types";

interface Semver {
  major: number;
  minor: number;
  patch: number;
  pre: string;
}

/** Parse `X.Y.Z` / `vX.Y.Z` / `X.Y.Z-pre`. Returns null if unparseable. */
export function parseSemver(v: string): Semver | null {
  const m = (v ?? "")
    .trim()
    .match(/^v?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/);
  if (!m) return null;
  return {
    major: Number(m[1]),
    minor: Number(m[2]),
    patch: Number(m[3]),
    pre: m[4] ?? "",
  };
}

/** Extract a semver from a free-form string (e.g. a PR title). Null if none. */
export function parseVersionOverride(input: string): string | null {
  if (!input) return null;
  const m = input.match(/v?(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)/);
  return m ? m[1] : null;
}

/**
 * Compute the next version from the current one and a bump.
 *
 * - First release (empty / `0.0.0`) → `0.1.0` for any real bump.
 * - Pre-1.0 published (`0.x.y`, not `0.0.0`) softens one level so an unstable
 *   SDK never auto-jumps to `1.0.0`: major→minor, minor→patch, patch→patch.
 * - Stable (`>=1.0.0`) → standard major/minor/patch.
 * - `none` leaves the version unchanged.
 */
export function nextVersion(current: string, bump: BumpType): string {
  const p = parseSemver(current);
  if (!p || (p.major === 0 && p.minor === 0 && p.patch === 0)) {
    return bump === "none" ? current || "0.0.0" : "0.1.0";
  }
  const eff = effectiveBump(p, bump);
  switch (eff) {
    case "major":
      return `${p.major + 1}.0.0`;
    case "minor":
      return `${p.major}.${p.minor + 1}.0`;
    case "patch":
      return `${p.major}.${p.minor}.${p.patch + 1}`;
    default:
      return `${p.major}.${p.minor}.${p.patch}`;
  }
}

/** Pre-1.0 softening (bump-minor-pre-major family). */
function effectiveBump(p: Semver, bump: BumpType): BumpType {
  if (p.major === 0) {
    if (bump === "major") return "minor";
    if (bump === "minor") return "patch";
  }
  return bump;
}
