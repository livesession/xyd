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

/** Language display label — mirrors the web's SDK_LANG_LABEL. */
const LANG_LABEL: Record<string, string> = {
  node: "Node",
  python: "Python",
  go: "Go",
  ruby: "Ruby",
  java: "Java",
  dotnet: "C#",
};

/** The human display title stored on a target at creation: `<API title>
 * <language>` (e.g. "LiveSession OpenAPI Python"). Decoupled from the slug id
 * and the published package name. */
export function targetTitle(apiTitle: string, language: string): string {
  return `${apiTitle} ${LANG_LABEL[language] ?? language}`.trim();
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
