import type { ApiVersion, SdkTarget, TargetVersion } from "./types";

/**
 * The version history for a single SDK target, in order of preference:
 *  1. a stored per-build history (once the release pipeline records one);
 *  2. the API's spec versions the SDK tracks — each spec version implies an SDK
 *     build (mirrors the release model), used when the API is versioned;
 *  3. the target's single current version.
 *
 * Shared by the SDK detail page (all targets × versions) and the SDK target
 * page (one target's versions) so both agree on the same list.
 */
export function deriveTargetVersions(
  target: SdkTarget,
  apiVersions: ApiVersion[],
  stored: TargetVersion[] = [],
): TargetVersion[] {
  if (stored.length) return stored;
  if (apiVersions.length > 1) {
    return apiVersions.map((v) => ({
      id: `${target.id}_${v.version}`,
      targetId: target.id,
      version: v.version,
      status: v.current ? target.status : "ready",
      createdAt: v.updatedAt ?? "",
      publishedAt: v.current
        ? (target.lastPublishedAt ?? undefined)
        : v.updatedAt,
      registryUrl: v.current ? target.registryUrl : undefined,
    }));
  }
  return [
    {
      id: `${target.id}_current`,
      targetId: target.id,
      version: target.version,
      status: target.status,
      createdAt: target.lastPublishedAt ?? "",
      publishedAt: target.lastPublishedAt,
      registryUrl: target.registryUrl,
    },
  ];
}
