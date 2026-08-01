import type { ReleaseConfig } from "./types";

export const DEFAULT_RELEASE_CONFIG: ReleaseConfig = {
  autoRelease: false,
  baseBranch: "",
  prerelease: false,
  versioning: "auto",
};

/** Coerce arbitrary JSON into a valid ReleaseConfig, filling defaults. */
export function parseReleaseConfig(json: unknown): ReleaseConfig {
  const o = (json && typeof json === "object" ? json : {}) as Record<
    string,
    unknown
  >;
  const versioning = o.versioning === "manual" ? "manual" : "auto";
  return {
    autoRelease: o.autoRelease === true,
    baseBranch: typeof o.baseBranch === "string" ? o.baseBranch : "",
    prerelease: o.prerelease === true,
    versioning,
  };
}

/** Render a ReleaseConfig as pretty JSON (standalone config file). */
export function renderReleaseConfig(c: ReleaseConfig): string {
  return `${JSON.stringify(parseReleaseConfig(c), null, 2)}\n`;
}
