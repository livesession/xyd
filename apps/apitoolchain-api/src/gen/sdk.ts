import {
  generate,
  getEmitter,
  openapi2opensdk,
  registerBuiltinEmitters,
} from "@apitoolchain/xyd-bridge";
import { load as yamlLoad } from "js-yaml";
import JSZip from "jszip";
import { registryClient } from "../clients/registry";
import * as jobQ from "../db/generated/jobs_sql";
import * as notifQ from "../db/generated/notifications_sql";
import * as sdkQ from "../db/generated/sdk_targets_sql";
import { pool } from "../db/pool";
import { storage } from "../storage";
import { randomId, slugify } from "../util";

let registered = false;
function ensureEmitters(): void {
  if (!registered) {
    registerBuiltinEmitters();
    registered = true;
  }
}

const PACKAGE_NAME: Record<string, (slug: string) => string> = {
  go: (s) => s,
  node: (s) => `@acme/${s}`,
  python: (s) => s,
  ruby: (s) => s,
  java: (s) => `com.acme.${s}`,
  dotnet: (s) =>
    `Acme.${s.replace(/(^|-)([a-z])/g, (_m, _p, c: string) => c.toUpperCase())}`,
};

export const SDK_OUTPUT: Record<string, string> = {
  go: "./sdk/go",
  node: "./sdk/node",
  python: "./sdk/python",
  ruby: "./sdk/ruby",
  java: "./sdk/java",
  dotnet: "./sdk/dotnet",
};

/**
 * Wired SDK generation: RAW spec → OpenSDK IR → per-language file map (bridge) →
 * zip in object storage → mark the target ready + notify. Runs off the request
 * path (fire-and-forget); the `jobs` row is the queue-ready seam.
 */
export async function runSdkGeneration(opts: {
  targetId: string;
  jobId: string;
  apiId: string;
  version: string;
  language: string;
}): Promise<void> {
  const { targetId, jobId, apiId, version, language } = opts;
  try {
    const spec = await registryClient.fetchSpecRaw(apiId, version || "current");
    if (!spec) throw new Error("spec not found in registry");
    const doc = spec.contentType.includes("json")
      ? JSON.parse(spec.text)
      : (yamlLoad(spec.text) as Record<string, unknown>);

    ensureEmitters();
    const ir = openapi2opensdk(doc);
    const emitter = getEmitter(language);
    const files = generate(ir, emitter, {});

    const zip = new JSZip();
    for (const [path, content] of Object.entries(files))
      zip.file(path, content);
    const buf = await zip.generateAsync({ type: "nodebuffer" });

    const key = `artifacts/sdk/${targetId}/sdk.zip`;
    await storage.write(key, buf, { mimeType: "application/zip" });

    const slug = slugify(ir.info.title ?? "sdk");
    const packageName = (PACKAGE_NAME[language] ?? ((s) => s))(slug);
    const ver = ir.info.version ?? "0.1.0";

    await sdkQ.markSdkTargetReady(pool, {
      id: targetId,
      artifactRef: key,
      packageName,
      version: ver,
    });
    await jobQ.updateJobStatus(pool, {
      id: jobId,
      status: "done",
      error: null,
    });
    await notifQ.insertNotification(pool, {
      id: randomId("ntf"),
      severity: "success",
      title: `SDK ready: ${language}`,
      body: `${packageName}@${ver}`,
      source: "sdk",
      apiId,
    });
  } catch (e) {
    const message = (e as Error).message;
    await sdkQ.markSdkTargetError(pool, {
      id: targetId,
      errorMessage: message,
    });
    await jobQ.updateJobStatus(pool, {
      id: jobId,
      status: "error",
      error: message,
    });
    await notifQ.insertNotification(pool, {
      id: randomId("ntf"),
      severity: "error",
      title: `SDK generation failed: ${language}`,
      body: message,
      source: "sdk",
      apiId,
    });
  }
}
