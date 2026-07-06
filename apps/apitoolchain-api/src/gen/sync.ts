import JSZip from "jszip";
import { type GpFile, gitProviderClient } from "../clients/gitprovider";
import { registryClient } from "../clients/registry";
import * as gitQ from "../db/generated/git_sql";
import * as jobQ from "../db/generated/jobs_sql";
import * as notifQ from "../db/generated/notifications_sql";
import * as sdkQ from "../db/generated/sdk_targets_sql";
import { pool } from "../db/pool";
import { storage } from "../storage";
import { randomId } from "../util";

/** Spec target → the raw registry document as one file. */
async function collectSpecFiles(apiId: string, ref: string): Promise<GpFile[]> {
  const spec = await registryClient.fetchSpecRaw(apiId, ref || "current");
  if (!spec) throw new Error("spec not found in registry");
  const name = spec.contentType.includes("json")
    ? "openapi.json"
    : "openapi.yaml";
  return [
    {
      path: name,
      contentBase64: Buffer.from(spec.text, "utf8").toString("base64"),
    },
  ];
}

/** SDK target → the whole generated file map (unzipped from the stored artifact). */
async function collectSdkFiles(targetId: string): Promise<GpFile[]> {
  const row = await sdkQ.getSdkTarget(pool, { id: targetId });
  if (!row) throw new Error("sdk target not found");
  if (!row.artifactRef)
    throw new Error("SDK not built yet — generate it first");
  const buf = await storage.readToBuffer(row.artifactRef);
  const zip = await JSZip.loadAsync(buf);
  const files: GpFile[] = [];
  for (const entry of Object.values(zip.files)) {
    if (entry.dir) continue;
    files.push({
      path: entry.name,
      contentBase64: await entry.async("base64"),
    });
  }
  return files;
}

/**
 * Push a repo connection's artifact into its repo via gitproviderd. Runs off the
 * request path (fire-and-forget); the `jobs` row is the queue-ready seam.
 * Mirrors runSdkGeneration's shape (job + notification + status transitions).
 */
export async function runGitSync(opts: {
  connectionId: string;
  jobId: string;
  projectId: string;
}): Promise<void> {
  const { connectionId, jobId, projectId } = opts;
  try {
    const conn = await gitQ.getRepoConnection(pool, { id: connectionId });
    if (!conn) throw new Error("connection not found");
    const provider = await gitQ.getGitProvider(pool, { id: conn.providerId });
    if (!provider) throw new Error("git provider not found");

    const files =
      conn.targetKind === "sdk"
        ? await collectSdkFiles(conn.targetId)
        : await collectSpecFiles(conn.targetId, conn.ref);

    const res = await gitProviderClient.sync({
      kind: provider.kind,
      baseUrl: provider.baseUrl,
      token: provider.token,
      login: provider.connectedAs,
      repo: conn.repo,
      branch: conn.branch,
      prefix: conn.prefix,
      message: `apitoolchain: sync ${conn.targetKind} ${conn.targetId}`,
      author: { name: "apitoolchain", email: "bot@apitoolchain.dev" },
      files,
    });

    await gitQ.markRepoConnectionSynced(pool, { id: connectionId });
    await jobQ.updateJobStatus(pool, {
      id: jobId,
      status: "done",
      error: null,
    });
    await notifQ.insertNotification(pool, {
      id: randomId("ntf"),
      severity: "success",
      title: `Synced to ${conn.repo}`,
      body: res.noChanges
        ? "No changes to push"
        : `${res.commit.slice(0, 7)} on ${res.branch}`,
      source: "git",
      apiId: conn.targetKind === "spec" ? conn.targetId : null,
      projectId,
    });
  } catch (e) {
    const message = (e as Error).message;
    await gitQ.markRepoConnectionError(pool, {
      id: connectionId,
      lastSyncError: message,
    });
    await jobQ.updateJobStatus(pool, {
      id: jobId,
      status: "error",
      error: message,
    });
    await notifQ.insertNotification(pool, {
      id: randomId("ntf"),
      severity: "error",
      title: "Git sync failed",
      body: message,
      source: "git",
      apiId: null,
      projectId,
    });
  }
}
