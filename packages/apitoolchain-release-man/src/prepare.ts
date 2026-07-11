import { bumpTypeFromChanges } from "./bump";
import { renderChangelogEntry } from "./changelog";
import { renderPrBody } from "./prbody";
import { renderReleasesFile } from "./releases-file";
import type { PreparedRelease, ReleaseChange } from "./types";
import { nextVersion, parseVersionOverride } from "./version";

/**
 * Turn a diff-derived change list into everything a release cycle needs: the
 * bump, the resolved version (auto or overridden), and the rendered
 * CHANGELOG entry / PR body / RELEASES.md block. Pure and deterministic.
 */
export function prepareRelease(i: {
  fromVersion: string;
  changes: readonly ReleaseChange[];
  apiName: string;
  language: string;
  headSpecVersion: string;
  baseSpecVersion: string;
  date: string;
  /** Free-form override source (e.g. an edited PR title). */
  versionOverride?: string;
  /** First release for the target: publish `fromVersion` as-is (no bump) — every
   * change is a fresh addition, so there's nothing to bump against. */
  initial?: boolean;
}): PreparedRelease {
  const bump = i.initial ? "none" : bumpTypeFromChanges(i.changes);
  const auto = nextVersion(i.fromVersion, bump);
  const override = i.versionOverride
    ? parseVersionOverride(i.versionOverride)
    : null;
  const toVersion = override ?? auto;
  const breakingCount = i.changes.filter(
    (c) => c.severity === "breaking",
  ).length;

  return {
    bump,
    toVersion,
    breakingCount,
    changelogEntry: renderChangelogEntry({
      version: toVersion,
      date: i.date,
      changes: i.changes,
    }),
    prBody: renderPrBody({
      apiName: i.apiName,
      language: i.language,
      fromVersion: i.fromVersion,
      toVersion,
      bump,
      headSpecVersion: i.headSpecVersion,
      baseSpecVersion: i.baseSpecVersion,
      changes: i.changes,
      overridden: !!override,
    }),
    releasesFile: renderReleasesFile({
      version: toVersion,
      date: i.date,
      bump,
      changeCount: i.changes.length,
      language: i.language,
    }),
  };
}
