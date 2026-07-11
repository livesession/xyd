import { gitProviderClient } from "../../../clients/gitprovider";
import * as gitQ from "../../../dbnode/git";
import { pool } from "../../../dbnode/pool";
import * as releaseQ from "../../../dbnode/releases";
import { runPublishRelease } from "../../../genframework/release";
import type { Releases } from "../../openapi/v1/src/generated/models/all/platform-api";
import { toRelease } from "../__kit/mappers";

type ReconcileRow = {
  id: string;
  state: string;
  prNumber: number;
  connectionId: string;
  projectId: string;
};

/**
 * Reconcile open release PRs against the git provider on read. The merge webhook
 * may never reach the gateway (e.g. local Gitea), leaving a release stuck at
 * `pr_open` after its PR is merged; here we check `prStatus` for any `pr_open`
 * release and, when it's actually merged, kick the publish (tag + Release). It's
 * self-limiting — only `pr_open` releases hit the provider, so once everything is
 * released there's no extra work. Best-effort: failures are swallowed (the manual
 * "Publish" still covers it). Returns true if any release transitioned.
 */
async function reconcileMergedPrs(rows: ReconcileRow[]): Promise<boolean> {
  const open = rows.filter((r) => r.state === "pr_open" && r.prNumber > 0);
  if (open.length === 0) return false;
  const results = await Promise.all(
    open.map(async (r) => {
      try {
        const conn = await gitQ.getRepoConnection(pool, {
          id: r.connectionId,
        });
        if (!conn) return false;
        const provider = await gitQ.getGitProvider(pool, {
          id: conn.providerId,
        });
        if (!provider) return false;
        const status = await gitProviderClient.prStatus({
          kind: provider.kind,
          baseUrl: provider.baseUrl,
          token: provider.token,
          login: provider.connectedAs,
          repo: conn.repo,
          number: r.prNumber,
        });
        if (!status.merged) return false;
        // Atomically claim the transition (pr_open → merging) so concurrent list
        // calls (e.g. the sync chip + the releases page) don't double-fire the
        // publish — only the request that flips it kicks the tag + Release.
        const claim = await pool.query({
          text: "UPDATE releases SET state = 'merging', updated_at = now() WHERE id = $1 AND state = 'pr_open'",
          values: [r.id],
        });
        if ((claim.rowCount ?? 0) === 0) return false;
        void runPublishRelease({ releaseId: r.id, projectId: r.projectId });
        return true;
      } catch {
        return false;
      }
    }),
  );
  return results.some(Boolean);
}

export const list: Releases["list"] = async (_ctx, options) => {
  const query = () =>
    options?.connectionId
      ? releaseQ.listReleasesByConnection(pool, {
          connectionId: options.connectionId,
        })
      : releaseQ.listReleases(pool);
  let rows = await query();
  if (await reconcileMergedPrs(rows)) rows = await query();
  return rows.map(toRelease);
};
