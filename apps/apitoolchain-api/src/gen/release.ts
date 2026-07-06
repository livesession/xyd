import {
  DEFAULT_RELEASE_CONFIG,
  prepareRelease,
  type ReleaseChange,
  renderChangelogFromHistory,
  renderReleaseManifest,
} from "@apitoolchain/release-man";
import {
  diffIR,
  type OpensdkSpecJson,
  openapi2opensdk,
} from "@apitoolchain/xyd-bridge";
import { load as yamlLoad } from "js-yaml";
import { type GpFile, gitProviderClient } from "../clients/gitprovider";
import { registryClient } from "../clients/registry";
import * as gitQ from "../db/generated/git_sql";
import * as jobQ from "../db/generated/jobs_sql";
import * as notifQ from "../db/generated/notifications_sql";
import * as releaseQ from "../db/generated/releases_sql";
import * as sdkQ from "../db/generated/sdk_targets_sql";
import * as sdksQ from "../db/generated/sdks_sql";
import { pool } from "../db/pool";
import { storage } from "../storage";
import { currentVersion, randomId } from "../util";
import { generateSdkFileMap } from "./sdk";

const BOT = { name: "apitoolchain", email: "bot@apitoolchain.dev" };

/** UTC date (YYYY-MM-DD) for changelog/release entries. */
function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Stable rolling regen branch for an SDK target — same name every cycle → one PR. */
export function releaseHeadBranch(sdkTargetId: string): string {
  return `apitoolchain/release/${sdkTargetId}`;
}

function providerCreds(p: {
  kind: string;
  baseUrl: string;
  token: string;
  connectedAs: string;
}) {
  return {
    kind: p.kind,
    baseUrl: p.baseUrl,
    token: p.token,
    login: p.connectedAs,
  };
}

function parseSpec(text: string, contentType: string): Record<string, unknown> {
  return contentType.includes("json")
    ? JSON.parse(text)
    : (yamlLoad(text) as Record<string, unknown>);
}

const EMPTY_IR: OpensdkSpecJson = {
  info: { title: "sdk", version: "0.0.0" },
  types: [],
  resources: [],
};

const b64 = (s: string): string => Buffer.from(s, "utf8").toString("base64");
const baseSnapshotKey = (connId: string) =>
  `releases/${connId}/base/openapi.json`;

/**
 * Run one release cycle for an SDK connection: fetch the head spec + the last
 * released base, diff them, compute the bump + changelog, regenerate the SDK,
 * and open/force-update the rolling PR. Fire-and-forget (mirrors runGitSync).
 */
export async function runRelease(o: {
  releaseId: string;
  connectionId: string;
  jobId: string;
  projectId: string;
}): Promise<void> {
  const { releaseId, connectionId, jobId, projectId } = o;
  try {
    const release = await releaseQ.getRelease(pool, { id: releaseId });
    if (!release) throw new Error("release not found");
    const conn = await gitQ.getRepoConnection(pool, { id: connectionId });
    if (!conn) throw new Error("connection not found");
    const provider = await gitQ.getGitProvider(pool, { id: conn.providerId });
    if (!provider) throw new Error("git provider not found");

    // A connection releases either an SDK target (regenerate + commit the code)
    // or a raw API spec (commit the versioned spec document). Both diff the spec
    // the same way — only the committed file set + PR title differ.
    const isSdk = conn.targetKind === "sdk";
    const target = isSdk
      ? await sdkQ.getSdkTarget(pool, { id: conn.targetId })
      : null;
    if (isSdk && !target) throw new Error("sdk target not found");
    const apiId = target ? target.apiId : conn.targetId;
    const sdk = target ? await sdksQ.getSdk(pool, { id: target.sdkId }) : null;

    // Resolve the head (incoming) + base (last released) spec versions.
    const core = await registryClient.getApi(apiId);
    if (!core) throw new Error(`api ${apiId} not found`);
    const headSpecVersion = release.headSpecVersion || currentVersion(core);
    const baseSpecVersion = conn.lastReleasedSpecVersion;

    const headSpec = await registryClient.fetchSpecRaw(apiId, headSpecVersion);
    if (!headSpec) throw new Error("head spec not found in registry");
    const headDoc = parseSpec(headSpec.text, headSpec.contentType);
    const headIr = openapi2opensdk(headDoc);

    const baseIr = await loadBaseIr(connectionId, apiId, baseSpecVersion);
    const changes = diffIR(baseIr, headIr)
      .changes as unknown as ReleaseChange[];

    const apiName = headIr.info.title ?? sdk?.name ?? core.name ?? "API";
    const fromVersion =
      conn.lastReleasedVersion || headIr.info.version || "0.0.0";
    const date = today();
    const prepared = prepareRelease({
      fromVersion,
      changes,
      apiName,
      language: target ? target.language : "spec",
      headSpecVersion,
      baseSpecVersion,
      date,
      versionOverride: release.versionOverride || undefined,
    });

    // The committed file set: regenerated SDK code, or the versioned spec doc.
    let files: Record<string, string>;
    let title: string;
    if (target) {
      const gen = generateSdkFileMap({
        doc: headDoc,
        language: target.language,
        namespace: sdk?.namespace ?? "",
      });
      files = gen.files;
      title = `release: ${gen.packageName} v${prepared.toVersion}`;
    } else {
      const specFile = headSpec.contentType.includes("json")
        ? "openapi.json"
        : "openapi.yaml";
      files = { [specFile]: headSpec.text };
      title = `release: ${apiName} spec v${prepared.toVersion}`;
    }

    // History for a full CHANGELOG.md (newest first): this cycle + prior releases.
    const priorReleased = (
      await releaseQ.listReleasesByConnection(pool, { connectionId })
    )
      .filter((r) => r.state === "released" && r.id !== releaseId)
      .map((r) => ({
        version: r.toVersion,
        date: iso(r.updatedAt),
        body: r.changelog,
      }));
    const changelogMd = renderChangelogFromHistory([
      { version: prepared.toVersion, date, body: prepared.changelogEntry },
      ...priorReleased,
    ]);

    const manifest = renderReleaseManifest({
      config: {
        ...DEFAULT_RELEASE_CONFIG,
        autoRelease: conn.autoRelease,
        baseBranch: conn.baseBranch,
        prerelease: conn.prerelease,
      },
      files,
      generator: "apitoolchain-release-man",
      version: prepared.toVersion,
    });

    const gpFiles: GpFile[] = [
      ...Object.entries(files).map(([path, content]) => ({
        path,
        contentBase64: b64(content),
      })),
      { path: "CHANGELOG.md", contentBase64: b64(changelogMd) },
      { path: "RELEASES.md", contentBase64: b64(prepared.releasesFile) },
      { path: ".apitoolchain/release.json", contentBase64: b64(manifest) },
    ];

    const headBranch = release.headBranch || releaseHeadBranch(conn.targetId);
    const res = await gitProviderClient.upsertPr({
      ...providerCreds(provider),
      repo: conn.repo,
      headBranch,
      baseBranch: conn.baseBranch,
      prefix: conn.prefix,
      title,
      body: prepared.prBody,
      author: BOT,
      files: gpFiles,
      replaceSubtree: conn.prefix !== "",
    });

    await releaseQ.updateReleasePrOpen(pool, {
      id: releaseId,
      bumpType: prepared.bump,
      fromVersion,
      toVersion: prepared.toVersion,
      changelog: prepared.changelogEntry,
      changeCount: changes.length,
      breakingCount: prepared.breakingCount,
      prNumber: res.number,
      prUrl: res.url,
      headBranch,
      baseBranch: conn.baseBranch,
    });
    await jobQ.updateJobStatus(pool, {
      id: jobId,
      status: "done",
      error: null,
    });
    await notifQ.insertNotification(pool, {
      id: randomId("ntf"),
      severity: "success",
      title: `Release PR ${res.created ? "opened" : "updated"}: ${conn.repo}`,
      body: `v${prepared.toVersion} (${prepared.bump}) — ${changes.length} change(s)`,
      source: "git",
      apiId,
      projectId,
    });
  } catch (e) {
    const message = (e as Error).message;
    await releaseQ.markReleaseFailed(pool, { id: releaseId, error: message });
    await jobQ.updateJobStatus(pool, {
      id: jobId,
      status: "error",
      error: message,
    });
    await notifQ.insertNotification(pool, {
      id: randomId("ntf"),
      severity: "error",
      title: "Release preparation failed",
      body: message,
      source: "git",
      apiId: null,
      projectId,
    });
  }
}

/** Base IR = the stored released-spec snapshot, else the registry version, else empty. */
async function loadBaseIr(
  connectionId: string,
  apiId: string,
  baseSpecVersion: string,
): Promise<OpensdkSpecJson> {
  try {
    const buf = await storage.readToBuffer(baseSnapshotKey(connectionId));
    return openapi2opensdk(JSON.parse(buf.toString("utf8")));
  } catch {
    // no snapshot yet
  }
  if (baseSpecVersion) {
    const base = await registryClient.fetchSpecRaw(apiId, baseSpecVersion);
    if (base) return openapi2opensdk(parseSpec(base.text, base.contentType));
  }
  return EMPTY_IR;
}

/** Publish a merged release: tag + provider Release, then snapshot the base. */
export async function runPublishRelease(o: {
  releaseId: string;
  projectId: string;
}): Promise<void> {
  const { releaseId, projectId } = o;
  try {
    const release = await releaseQ.markReleaseMerging(pool, { id: releaseId });
    if (!release) throw new Error("release not found");
    const conn = await gitQ.getRepoConnection(pool, {
      id: release.connectionId,
    });
    if (!conn) throw new Error("connection not found");
    const provider = await gitQ.getGitProvider(pool, { id: conn.providerId });
    if (!provider) throw new Error("git provider not found");
    const target =
      conn.targetKind === "sdk"
        ? await sdkQ.getSdkTarget(pool, { id: conn.targetId })
        : null;
    const apiId = target ? target.apiId : conn.targetId;

    const tag = `v${release.toVersion}`;
    const creds = providerCreds(provider);
    await gitProviderClient.createTag({
      ...creds,
      repo: conn.repo,
      tag,
      ref: release.baseBranch || conn.baseBranch,
      author: BOT,
    });
    const rel = await gitProviderClient.createRelease({
      ...creds,
      repo: conn.repo,
      tag,
      name: tag,
      body: release.changelog,
      commitish: release.baseBranch || conn.baseBranch,
      prerelease: conn.prerelease,
    });

    await releaseQ.markReleased(pool, {
      id: releaseId,
      tag,
      releaseUrl: rel.url,
    });
    await releaseQ.markConnectionReleased(pool, {
      id: conn.id,
      lastReleasedVersion: release.toVersion,
      lastReleasedSpecVersion: release.headSpecVersion,
    });

    // Snapshot the released spec as the next diff base (defends against a
    // registry version label being overwritten).
    if (apiId) {
      const head = await registryClient.fetchSpecRaw(
        apiId,
        release.headSpecVersion,
      );
      if (head) {
        const doc = parseSpec(head.text, head.contentType);
        await storage.write(
          baseSnapshotKey(conn.id),
          Buffer.from(JSON.stringify(doc), "utf8"),
          { mimeType: "application/json" },
        );
      }
    }

    await notifQ.insertNotification(pool, {
      id: randomId("ntf"),
      severity: "success",
      title: `Released ${tag}: ${conn.repo}`,
      body: rel.url || tag,
      source: "git",
      apiId: apiId || null,
      projectId,
    });
  } catch (e) {
    const message = (e as Error).message;
    await releaseQ.markReleaseFailed(pool, { id: releaseId, error: message });
    await notifQ.insertNotification(pool, {
      id: randomId("ntf"),
      severity: "error",
      title: "Release publish failed",
      body: message,
      source: "git",
      apiId: null,
      projectId,
    });
  }
}

/**
 * Event-driven trigger: a new spec version landed for an API → open/force-update
 * the rolling release PR for every auto-release SDK connection of that API.
 */
export async function enqueueReleasesForApi(
  apiId: string,
  version: string,
  projectId: string,
): Promise<void> {
  const conns = await releaseQ.listReleaseConnectionsForApi(pool, { apiId });
  for (const conn of conns) {
    try {
      await prepareReleaseForConnection({
        connectionId: conn.id,
        projectId,
        headSpecVersion: version,
      });
    } catch {
      // one bad connection shouldn't block the others
    }
  }
}

/**
 * Upsert the active release row for a connection (reuse the open one → force
 * update; else insert a fresh `preparing`) + a job, then kick runRelease.
 * Shared by the spec-version trigger and the manual "Prepare release" action.
 */
export async function prepareReleaseForConnection(o: {
  connectionId: string;
  projectId: string;
  headSpecVersion?: string;
  versionOverride?: string;
}): Promise<string> {
  const conn = await gitQ.getRepoConnection(pool, { id: o.connectionId });
  if (!conn) throw new Error("connection not found");
  const target =
    conn.targetKind === "sdk"
      ? await sdkQ.getSdkTarget(pool, { id: conn.targetId })
      : null;
  const apiId = target ? target.apiId : conn.targetId;
  const headBranch = releaseHeadBranch(conn.targetId);

  let active = await releaseQ.getActiveReleaseByConnection(pool, {
    connectionId: o.connectionId,
  });
  if (!active) {
    active = await releaseQ.insertRelease(pool, {
      id: randomId("rel"),
      projectId: o.projectId,
      connectionId: o.connectionId,
      baseSpecVersion: conn.lastReleasedSpecVersion,
      headSpecVersion: o.headSpecVersion ?? "",
      fromVersion: conn.lastReleasedVersion,
      baseBranch: conn.baseBranch,
      headBranch,
    });
  }
  if (!active) throw new Error("could not create release");
  if (o.versionOverride) {
    await releaseQ.setReleaseVersionOverride(pool, {
      id: active.id,
      versionOverride: o.versionOverride,
    });
  }

  const job = await jobQ.insertJob(pool, {
    id: randomId("job"),
    kind: "git.release",
    targetRef: active.id,
    status: "running",
    payload: { repo: conn.repo, apiId },
  });
  void runRelease({
    releaseId: active.id,
    connectionId: o.connectionId,
    jobId: job?.id ?? "",
    projectId: o.projectId,
  });
  return active.id;
}

/** ISO date (YYYY-MM-DD) from a nullable timestamp. */
function iso(d: Date | null): string {
  return d ? d.toISOString().slice(0, 10) : today();
}
