import { isAdditive } from "./bump";
import type { ReleaseChange } from "./types";

export interface GroupedChanges {
  breaking: ReleaseChange[];
  additive: ReleaseChange[];
  other: ReleaseChange[];
}

/** Deterministic ordering: by path, then kind (stable, timestamp-free output). */
function byPath(a: ReleaseChange, b: ReleaseChange): number {
  return a.path.localeCompare(b.path) || a.kind.localeCompare(b.kind);
}

/** Split changes into breaking / additive / other, each sorted by path. */
export function groupChanges(
  changes: readonly ReleaseChange[],
): GroupedChanges {
  const breaking: ReleaseChange[] = [];
  const additive: ReleaseChange[] = [];
  const other: ReleaseChange[] = [];
  for (const c of changes) {
    if (c.severity === "breaking") breaking.push(c);
    else if (isAdditive(c.kind)) additive.push(c);
    else other.push(c);
  }
  breaking.sort(byPath);
  additive.sort(byPath);
  other.sort(byPath);
  return { breaking, additive, other };
}
