import { randomUUID } from "node:crypto";
import { gitProviderClient } from "../../../clients/gitprovider";
import { config } from "../../../config";
import { pool } from "../../../dbnode/pool";
import * as releaseQ from "../../../dbnode/releases";

interface ProviderCreds {
  kind: string;
  baseUrl: string;
  token: string;
  connectedAs: string;
}

export interface ReleaseConfigInput {
  releaseMode: string; // push | release
  autoRelease: boolean;
  baseBranch?: string;
  prerelease?: boolean;
  /** Comma-separated dist-tags this connection reacts to (default `latest`;
   * `*` = all). */
  distTags?: string;
}

/**
 * Persist a connection's release config and — when enabling release mode with a
 * public gateway URL configured — register the merge webhook (idempotent,
 * best-effort; the manual "Publish" covers webhook-unreachable setups). Shared
 * by the connect flow (pick a default mode) and the release-settings editor.
 */
export async function applyReleaseConfig(
  connectionId: string,
  provider: ProviderCreds,
  input: ReleaseConfigInput,
) {
  const updated = await releaseQ.setConnectionReleaseConfig(pool, {
    id: connectionId,
    releaseMode: input.releaseMode,
    autoRelease: input.autoRelease,
    baseBranch: input.baseBranch ?? "",
    prerelease: input.prerelease ?? false,
    distTags: (input.distTags ?? "").trim() || "latest",
  });
  if (
    input.releaseMode === "release" &&
    config.platformPublicUrl &&
    updated &&
    !updated.webhookId
  ) {
    try {
      const secret = randomUUID().replace(/-/g, "");
      const target = `${config.platformPublicUrl.replace(/\/$/, "")}/webhooks/git/${connectionId}`;
      const hook = await gitProviderClient.registerWebhook({
        kind: provider.kind,
        baseUrl: provider.baseUrl,
        token: provider.token,
        login: provider.connectedAs,
        repo: updated.repo,
        target,
        secret,
      });
      await releaseQ.setConnectionWebhook(pool, {
        id: connectionId,
        webhookId: hook.id,
        webhookSecret: secret,
      });
    } catch {
      // best-effort: manual "Publish" still works without a webhook
    }
  }
  return updated;
}
