/**
 * Display status for an SDK build/target.
 *
 * A generated-but-unpublished build reads "built", not "ready" — "ready" is
 * reserved for a target that is live on a package registry (publishing stamps
 * `lastPublishedAt`/`registryUrl` on the target, `publishedAt`/`registryUrl` on
 * a version). Other statuses (building/error/draft) pass through unchanged.
 */
export function sdkBuildStatus(x: {
  status: string;
  lastPublishedAt?: string;
  publishedAt?: string;
  registryUrl?: string;
}): string {
  const published = Boolean(
    x.lastPublishedAt || x.publishedAt || x.registryUrl,
  );
  return x.status === "ready" && !published ? "built" : x.status;
}
