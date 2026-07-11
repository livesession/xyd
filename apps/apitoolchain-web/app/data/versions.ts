import type { ApiVersion, DistTag, SdkTarget, TargetVersion } from "./types";

/**
 * The version history for a single SDK target, in order of preference:
 *  1. a stored per-build history (once the release pipeline records one);
 *  2. the API's spec versions the SDK tracks — each spec version implies an SDK
 *     build (mirrors the release model), used when the API is versioned;
 *  3. the target's single current version.
 *
 * Each version also carries the parent spec's dist-tags that point at the same
 * version — the SDK tracks the spec, so its versions inherit `@latest`/`@beta`
 * etc. (dist-tags are managed on the spec).
 *
 * Shared by the SDK detail page (all targets × versions) and the SDK target
 * page (one target's versions) so both agree on the same list.
 */
export function deriveTargetVersions(
  target: SdkTarget,
  apiVersions: ApiVersion[],
  stored: TargetVersion[] = [],
  apiDistTags: DistTag[] = [],
): TargetVersion[] {
  const tagsFor = (version: string) =>
    apiDistTags.filter((t) => t.version === version).map((t) => t.tag);

  if (stored.length) {
    return stored.map((v) => ({ ...v, tags: tagsFor(v.version) }));
  }
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
      tags: tagsFor(v.version),
    }));
  }
  // A single-build SDK tracks the spec's current version, so it inherits that
  // version's dist-tags (the SDK's own semver rarely equals the spec version).
  const currentSpecVersion =
    apiVersions.find((v) => v.current)?.version ?? apiVersions[0]?.version;
  return [
    {
      id: `${target.id}_current`,
      targetId: target.id,
      version: target.version,
      status: target.status,
      createdAt: target.lastPublishedAt ?? "",
      publishedAt: target.lastPublishedAt,
      registryUrl: target.registryUrl,
      tags: currentSpecVersion ? tagsFor(currentSpecVersion) : [],
    },
  ];
}
