import * as http from "node:http";
import JSZip from "jszip";
import { gitProviderClient } from "../clients/gitprovider";
import { registryClient } from "../clients/registry";
import { config } from "../config";
import * as gitQ from "../dbnode/git";
import { pool } from "../dbnode/pool";
import * as regQ from "../dbnode/registries";
import * as releaseQ from "../dbnode/releases";
import * as sdkQ from "../dbnode/sdk_targets";
import { runPublishRelease } from "../genframework/release";
import { sdkJsonKey } from "../genframework/sdk";
import { ensureBucket, storage } from "../storage";
import { createPlatformApiRouter } from "./openapi/v1/src/generated/http/router";
import {
  apiKeys,
  apis,
  auth,
  context,
  docsProjects,
  gitProviders,
  mcpServers,
  members,
  notifications,
  overview,
  packageRegistries,
  projects,
  registryConnections,
  releases,
  repoConnections,
  sdks,
  sdkTargets,
  usage,
} from "./v1";

const router = createPlatformApiRouter(
  apis,
  sdks,
  sdkTargets,
  docsProjects,
  mcpServers,
  notifications,
  overview,
  usage,
  auth,
  projects,
  context,
  members,
  gitProviders,
  repoConnections,
  releases,
  packageRegistries,
  registryConnections,
  apiKeys,
);

// Owned binary route: download the generated SDK zip (the future "Download SDK"
// button). Streamed through the service so it works for every storage driver.
const ARTIFACT_RE = /^\/sdk-targets\/([^/]+)\/artifact(?:\?.*)?$/;

async function serveArtifact(
  res: http.ServerResponse,
  targetId: string,
): Promise<void> {
  const row = await sdkQ.getSdkTarget(pool, { id: targetId });
  if (!row?.artifactRef) {
    res
      .writeHead(404, { "content-type": "text/plain" })
      .end("artifact not found");
    return;
  }
  try {
    const buf = await storage.readToBuffer(row.artifactRef);
    res
      .writeHead(200, {
        "content-type": "application/zip",
        "content-disposition": `attachment; filename="${targetId}.zip"`,
      })
      .end(buf);
  } catch {
    res
      .writeHead(500, { "content-type": "text/plain" })
      .end("artifact read error");
  }
}

// Owned route: the generated `sdk.json` (regen config, `spec` → the registry),
// extracted from the artifact zip — so the dashboard can show it without
// downloading + unzipping the whole SDK.
const SDKJSON_RE = /^\/sdk-targets\/([^/]+)\/sdk\.json(?:\?.*)?$/;

async function serveSdkJson(
  res: http.ServerResponse,
  targetId: string,
): Promise<void> {
  const row = await sdkQ.getSdkTarget(pool, { id: targetId });
  if (!row?.artifactRef) {
    res
      .writeHead(404, { "content-type": "text/plain" })
      .end("sdk.json not found");
    return;
  }
  try {
    // Preferred: the standalone sdk.json written at build time — a direct read,
    // no full-artifact download + unzip.
    const key = sdkJsonKey(targetId);
    if (await storage.fileExists(key)) {
      res
        .writeHead(200, { "content-type": "application/json" })
        .end(await storage.readToBuffer(key));
      return;
    }
    // Fallback for artifacts built before the standalone copy existed: extract
    // sdk.json from the zip.
    const zip = await JSZip.loadAsync(
      await storage.readToBuffer(row.artifactRef),
    );
    const text = await zip.file("sdk.json")?.async("string");
    if (text == null) {
      res
        .writeHead(404, { "content-type": "text/plain" })
        .end("sdk.json not in artifact");
      return;
    }
    res.writeHead(200, { "content-type": "application/json" }).end(text);
  } catch {
    res
      .writeHead(500, { "content-type": "text/plain" })
      .end("sdk.json read error");
  }
}

// Owned route: raw spec bytes for the web OpenAPI editor. Proxies the
// lower-layer registry-api's raw-spec route (which lives outside the TypeSpec
// router), so the editor can load the actual stored OpenAPI for an api+version.
const SPEC_RE = /^\/apis\/([^/]+)\/versions\/([^/]+)\/spec(?:\?.*)?$/;

async function serveSpec(
  res: http.ServerResponse,
  apiId: string,
  version: string,
): Promise<void> {
  try {
    const spec = await registryClient.fetchSpecRaw(apiId, version);
    if (!spec) {
      res
        .writeHead(404, { "content-type": "text/plain" })
        .end("spec not found");
      return;
    }
    res.writeHead(200, { "content-type": spec.contentType }).end(spec.text);
  } catch {
    res
      .writeHead(502, { "content-type": "text/plain" })
      .end("spec fetch error");
  }
}

// Registry resolution: turn the sdk.json refs into fetchable content. These make
// `[<host>/]apis/<ns>/<api>@<ver>` and `[<host>/]sdks/<ns>/<pkg>@<ver>` resolve
// (prepend a scheme) — the human-friendly form of the current per-id routes.
const APIS_REF_RE = /^\/apis\/([^/@]+)\/([^/@]+)@([^/?#]+)(?:[?#].*)?$/;
const SDKS_REF_RE = /^\/sdks\/([^/@]+)\/([^/@]+)@([^/?#]+)(?:[?#].*)?$/;

/** `apis/<ns>/<api>@<ver>` → the raw spec bytes (validating the namespace). */
async function serveSpecRef(
  res: http.ServerResponse,
  namespace: string,
  apiId: string,
  version: string,
): Promise<void> {
  try {
    const core = await registryClient.getApi(apiId);
    if (!core || core.ns !== namespace) {
      res.writeHead(404, { "content-type": "text/plain" }).end("api not found");
      return;
    }
    await serveSpec(res, apiId, version);
  } catch {
    res
      .writeHead(502, { "content-type": "text/plain" })
      .end("spec fetch error");
  }
}

/** `sdks/<ns>/<package>@<ver>` → the generated SDK artifact (the zip). */
async function serveSdkRef(
  res: http.ServerResponse,
  namespace: string,
  packageName: string,
  version: string,
): Promise<void> {
  const row = await sdkQ.resolveSdkTargetByRef(pool, {
    namespace,
    packageName,
    version,
  });
  if (!row?.artifactRef) {
    res.writeHead(404, { "content-type": "text/plain" }).end("sdk not found");
    return;
  }
  await serveArtifact(res, row.id);
}

// Owned route: a git provider's merge webhook. Verification is delegated to
// gitproviderd (per-provider signature schemes); a verified merge of the active
// release PR kicks the tag + Release. Event-driven — no polling.
const WEBHOOK_RE = /^\/webhooks\/git\/([^/]+)(?:\?.*)?$/;

function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve) => {
    let raw = "";
    req.on("data", (c) => {
      raw += c;
    });
    req.on("end", () => resolve(raw));
  });
}

async function handleWebhook(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  connectionId: string,
): Promise<void> {
  const raw = await readBody(req);
  // Always ack: the provider must not retry regardless of our internal outcome.
  res.writeHead(200, { "content-type": "application/json" }).end('{"ok":true}');
  try {
    const conn = await gitQ.getRepoConnection(pool, { id: connectionId });
    if (!conn) return;
    const provider = await gitQ.getGitProvider(pool, { id: conn.providerId });
    if (!provider) return;
    const active = await releaseQ.getActiveReleaseByConnection(pool, {
      connectionId,
    });
    if (!active) return;
    const headers: Record<string, string> = {};
    for (const [k, v] of Object.entries(req.headers)) {
      headers[k] = Array.isArray(v) ? v.join(",") : (v ?? "");
    }
    const parsed = await gitProviderClient.parseWebhook({
      kind: provider.kind,
      secret: conn.webhookSecret,
      headers,
      bodyBase64: Buffer.from(raw, "utf8").toString("base64"),
    });
    if (!parsed.verified || parsed.event !== "pull_request") return;
    if (parsed.number !== active.prNumber) return;
    if (parsed.merged) {
      void runPublishRelease({
        releaseId: active.id,
        projectId: active.projectId,
      });
    } else if (parsed.action === "close") {
      await releaseQ.markReleaseSuperseded(pool, { id: active.id });
    }
  } catch {
    // already acked; a bad delivery must not wedge the pipeline
  }
}

const server = http.createServer((req, res) => {
  const url = req.url ?? "/";
  if (url === "/healthz") {
    res.writeHead(200, { "content-type": "text/plain" }).end("ok");
    return;
  }
  const wh = url.match(WEBHOOK_RE);
  if (wh && req.method === "POST") {
    void handleWebhook(req, res, decodeURIComponent(wh[1]));
    return;
  }
  const m = url.match(ARTIFACT_RE);
  if (m && req.method === "GET") {
    void serveArtifact(res, decodeURIComponent(m[1]));
    return;
  }
  const sj = url.match(SDKJSON_RE);
  if (sj && req.method === "GET") {
    void serveSdkJson(res, decodeURIComponent(sj[1]));
    return;
  }
  const sp = url.match(SPEC_RE);
  if (sp && req.method === "GET") {
    void serveSpec(res, decodeURIComponent(sp[1]), decodeURIComponent(sp[2]));
    return;
  }
  const ar = url.match(APIS_REF_RE);
  if (ar && req.method === "GET") {
    void serveSpecRef(
      res,
      decodeURIComponent(ar[1]),
      decodeURIComponent(ar[2]),
      decodeURIComponent(ar[3]),
    );
    return;
  }
  const dr = url.match(SDKS_REF_RE);
  if (dr && req.method === "GET") {
    void serveSdkRef(
      res,
      decodeURIComponent(dr[1]),
      decodeURIComponent(dr[2]),
      decodeURIComponent(dr[3]),
    );
    return;
  }
  router.dispatch(req, res);
});

await ensureBucket();
// Recover orphaned publishes: a `runPublish` is fire-and-forget, so a restart
// mid-publish leaves the connection stuck in `building` forever. Fail those on
// boot so the UI shows an actionable error instead of an eternal spinner.
await regQ.failInterruptedPublishes(pool).catch(() => {});
server.listen(config.port, () => {
  console.log(`[platform-api] listening on http://localhost:${config.port}`);
});
