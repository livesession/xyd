/**
 * @apitoolchain/release-man — pure release-management logic.
 *
 * Spec-diff → semver bump, changelog / PR-body / RELEASES.md rendering, and the
 * `.apitoolchain/release.json` manifest. No DB/HTTP/IO deps: the gateway
 * computes `diffIR(base, head).changes` (via @xyd-js/opensdk-core) and pipes
 * the change list through `prepareRelease`, then commits the rendered artifacts.
 */

export { bumpTypeFromChanges, isAdditive } from "./bump";
export {
  type ChangelogHistoryEntry,
  renderChangelogEntry,
  renderChangelogFromHistory,
} from "./changelog";
export {
  DEFAULT_RELEASE_CONFIG,
  parseReleaseConfig,
  renderReleaseConfig,
} from "./config";
export { groupChanges } from "./group";
export {
  buildReleaseLock,
  type ReleaseLock,
  renderReleaseLock,
  renderReleaseManifest,
} from "./lock";
export { renderPrBody } from "./prbody";
export { prepareRelease } from "./prepare";
export { renderReleasesFile } from "./releases-file";
export type {
  BumpType,
  ChangeSeverity,
  PreparedRelease,
  ReleaseChange,
  ReleaseConfig,
} from "./types";
export { nextVersion, parseSemver, parseVersionOverride } from "./version";
