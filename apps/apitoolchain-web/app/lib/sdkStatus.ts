/**
 * Display status for an SDK build/target.
 *
 * A `ready` target reads "built" until it's live on a package registry, then
 * "published" (publishing stamps `lastPublishedAt`/`registryUrl` on the target,
 * `publishedAt`/`registryUrl` on a version) — the raw "ready" is never shown.
 * Other statuses (building/error/draft) pass through unchanged.
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
  if (x.status === "ready") return published ? "published" : "built";
  return x.status;
}
