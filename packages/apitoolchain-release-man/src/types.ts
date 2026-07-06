/** Impact of a single change on a generated SDK's consumers. */
export type ChangeSeverity = "breaking" | "risky" | "safe";

/** Semver increment implied by a set of changes. */
export type BumpType = "major" | "minor" | "patch" | "none";

/**
 * A single classified API change. Structurally identical to the OpenSDK
 * `IrChange` (from `diffIR` via `@apitoolchain/xyd-bridge`) — re-declared here
 * so this package has NO runtime dependency on the bridge and stays trivially
 * unit-testable. The gateway passes `diffIR(base, head).changes` straight in.
 */
export interface ReleaseChange {
  severity: ChangeSeverity;
  /** Machine-friendly change class, e.g. `method-added`, `param-removed`. */
  kind: string;
  /** Human-readable location, e.g. `pets.list.queryParams.limit`. */
  path: string;
  detail: string;
}

/** Release settings persisted into `.apitoolchain/release.json` in the repo. */
export interface ReleaseConfig {
  /** Open/force-update a release PR on every new spec version. */
  autoRelease: boolean;
  /** PR target branch (empty → repo default). */
  baseBranch?: string;
  /** Mark provider Releases as pre-releases. */
  prerelease?: boolean;
  /** `auto` = version from the spec diff; `manual` = always human-set. */
  versioning?: "auto" | "manual";
}

/** Everything a single release cycle needs, derived purely from the diff. */
export interface PreparedRelease {
  bump: BumpType;
  toVersion: string;
  changelogEntry: string;
  prBody: string;
  releasesFile: string;
  breakingCount: number;
}
