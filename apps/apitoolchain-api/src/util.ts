import { randomUUID } from "node:crypto";

export function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "sdk"
  );
}

export function randomId(prefix: string): string {
  return `${prefix}_${randomUUID().replace(/-/g, "").slice(0, 12)}`;
}

/** The current version of a registry entry (falls back to first / "current"). */
export function currentVersion(core: {
  versions: { version: string; current: boolean }[];
}): string {
  return (
    core.versions.find((v) => v.current)?.version ??
    core.versions[0]?.version ??
    "current"
  );
}
