import { mkdtempSync, rmSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { publishTarget } from "@apitoolchain/xyd-bridge";
import JSZip from "jszip";
import * as jobQ from "../db/generated/jobs_sql";
import * as notifQ from "../db/generated/notifications_sql";
import * as regQ from "../db/generated/registries_sql";
import * as sdkQ from "../db/generated/sdk_targets_sql";
import { pool } from "../db/pool";
import { storage } from "../storage";
import { randomId } from "../util";

/**
 * Extract the SDK target's stored artifact zip (the generated file map) into a
 * fresh temp dir whose root IS the SDK package root (package.json / go.mod / …).
 */
async function extractArtifact(artifactRef: string): Promise<string> {
  const buf = await storage.readToBuffer(artifactRef);
  const zip = await JSZip.loadAsync(buf);
  const dir = mkdtempSync(join(tmpdir(), "apitoolchain-publish-"));
  for (const entry of Object.values(zip.files)) {
    if (entry.dir) continue;
    const out = join(dir, entry.name);
    await mkdir(dirname(out), { recursive: true });
    await writeFile(out, await entry.async("nodebuffer"));
  }
  return dir;
}

/**
 * Best-effort: is `packageName@version` already in the (HTTP) registry? npm /
 * verdaccio expose `GET <url>/<pkg>` → `{ versions: { <ver>: … } }`. Local file
 * feeds + unknown/unreachable registries return false (let the publish proceed).
 */
async function alreadyPublished(
  registry: { url: string },
  packageName: string,
  version: string,
): Promise<boolean> {
  if (!/^https?:\/\//.test(registry.url)) return false; // file feed, not HTTP
  try {
    const res = await fetch(
      `${registry.url.replace(/\/$/, "")}/${packageName}`,
      { signal: AbortSignal.timeout(5000) },
    );
    if (!res.ok) return false;
    const doc = (await res.json()) as { versions?: Record<string, unknown> };
    return !!doc.versions?.[version];
  } catch {
    return false;
  }
}

/**
 * Publish a registry connection's SDK to its package registry via the reused
 * opensdk `publishTarget()` (shells out to npm/twine/gem/… on the gateway host).
 * Runs off the request path (fire-and-forget); the `jobs` row is the queue-ready
 * seam. Mirrors runGitSync's shape (job + notification + status transitions).
 *
 * A missing language toolchain surfaces as the connection's `last_publish_error`
 * (publishTarget throws) — no crash, like the publish e2e "skips cleanly".
 */
export async function runPublish(opts: {
  connectionId: string;
  jobId: string;
  projectId: string;
  version?: string;
  tag?: string;
}): Promise<void> {
  const { connectionId, jobId, projectId, version, tag } = opts;
  let workdir: string | undefined;
  try {
    const conn = await regQ.getRegistryConnection(pool, { id: connectionId });
    if (!conn) throw new Error("registry connection not found");
    const registry = await regQ.getPackageRegistry(pool, {
      id: conn.registryId,
    });
    if (!registry) throw new Error("package registry not found");
    const target = await sdkQ.getSdkTarget(pool, { id: conn.targetId });
    if (!target) throw new Error("sdk target not found");
    if (!target.artifactRef)
      throw new Error("SDK not built yet — generate it first");

    const ver = version || target.version || "0.0.0";
    // Idempotent: a registry (verdaccio/npm) rejects publishing over an existing
    // version, so re-publishing the same version (e.g. re-applying a "publish"
    // dev profile) would fail. If it's already in the registry, that IS the
    // desired end state — skip the push and settle as published.
    const already =
      !!registry.url &&
      !!conn.packageName &&
      (await alreadyPublished(registry, conn.packageName, ver));
    if (!already) {
      workdir = await extractArtifact(target.artifactRef);
      // publishTarget picks the per-language publisher and shells out. `registry`
      // is the URL or a local file-feed path; token is undefined for anon/local.
      publishTarget(conn.language, workdir, {
        registry: registry.url || undefined,
        token: registry.token || undefined,
        version: ver,
        tag,
      });
    }

    const registryUrl = conn.packageName
      ? `${registry.url.replace(/\/$/, "")}/${conn.packageName}`
      : registry.url;
    await regQ.markRegistryConnectionPublished(pool, {
      id: connectionId,
      lastPublishedVersion: ver,
    });
    await sdkQ.markSdkTargetPublished(pool, {
      id: conn.targetId,
      registryUrl,
    });
    await jobQ.updateJobStatus(pool, {
      id: jobId,
      status: "done",
      error: null,
    });
    await notifQ.insertNotification(pool, {
      id: randomId("ntf"),
      severity: "success",
      title: `${already ? "Already published" : "Published"} ${conn.packageName || conn.language}@${ver}`,
      body: `${registry.kind} → ${registry.url}`,
      source: "sdk",
      apiId: target.apiId || null,
      projectId,
    });
  } catch (e) {
    const message = (e as Error).message;
    await regQ.markRegistryConnectionError(pool, {
      id: connectionId,
      lastPublishError: message,
    });
    await jobQ.updateJobStatus(pool, {
      id: jobId,
      status: "error",
      error: message,
    });
    await notifQ.insertNotification(pool, {
      id: randomId("ntf"),
      severity: "error",
      title: "Publish failed",
      body: message,
      source: "sdk",
      apiId: null,
      projectId,
    });
  } finally {
    if (workdir) rmSync(workdir, { recursive: true, force: true });
  }
}

/**
 * Enqueue a publish: insert a `sdk.publish` job, mark the connection publishing,
 * and kick `runPublish` off the request path. Returns the job id.
 */
export async function enqueuePublish(opts: {
  connectionId: string;
  projectId: string;
  version?: string;
  tag?: string;
}): Promise<string> {
  const { connectionId, projectId, version, tag } = opts;
  const conn = await regQ.getRegistryConnection(pool, { id: connectionId });
  const job = await jobQ.insertJob(pool, {
    id: randomId("job"),
    kind: "sdk.publish",
    targetRef: connectionId,
    status: "running",
    payload: { targetId: conn?.targetId ?? "", language: conn?.language ?? "" },
  });
  await regQ.markRegistryConnectionPublishing(pool, { id: connectionId });
  void runPublish({
    connectionId,
    jobId: job?.id ?? "",
    projectId,
    version,
    tag,
  });
  return job?.id ?? "";
}

/**
 * Auto-publish every `auto_publish` registry connection of an SDK target — the
 * on-release hook (called from runPublishRelease after the tag/Release is cut).
 */
export async function enqueuePublishForTarget(opts: {
  targetId: string;
  projectId: string;
  version?: string;
  tag?: string;
}): Promise<void> {
  const { targetId, projectId, version, tag } = opts;
  const conns = await regQ.listRegistryConnectionsByTarget(pool, { targetId });
  for (const conn of conns) {
    if (!conn.autoPublish) continue;
    await enqueuePublish({ connectionId: conn.id, projectId, version, tag });
  }
}
