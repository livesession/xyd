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
import { randomId } from "../util";

let registered = false;
function ensureEmitters(): void {
  if (!registered) {
    registerBuiltinEmitters();
    registered = true;
  }
}

/**
 * Split a title into lowercase tokens on word SEPARATORS only (space, dash,
 * dot, …) — a brand like "LiveSession" stays ONE token (not "live-session"),
 * so "LiveSession API" → ["livesession", "api"].
 */
function titleTokens(input: string): string[] {
  return input
    .split(/[^a-zA-Z0-9]+/)
    .map((w) => w.trim().toLowerCase())
    .filter(Boolean);
}

const capitalize = (w: string): string =>
  w.charAt(0).toUpperCase() + w.slice(1);
/** identifier segment: lowercase alphanumerics, non-empty. */
const identSeg = (s: string): string =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "") || "sdk";

/**
 * The package identity for a generated SDK: the string we store on the target
 * AND the emitter option that bakes the *same* name into the SDK's manifest and
 * README — so the "package" shown in the UI can never diverge from what the
 * generated README tells users to install/import.
 *
 * The name is `<title>-<language>` (title collapsed on separators, so the brand
 * stays intact): e.g. "LiveSession API" → `livesession-api-node`,
 * `livesession-api-go`, `livesession-api-python`. Languages whose identifiers
 * forbid dashes (Java packages, .NET namespaces) use the idiomatic dotted form.
 */
function sdkPackageIdentity(
  language: string,
  namespace: string,
  title: string,
): { packageName: string; options: Record<string, unknown> } {
  const tokens = titleTokens(title);
  const dash = tokens.join("-") || "sdk"; // livesession-api
  const snake = tokens.join("_") || "sdk"; // livesession_api
  const squash = tokens.join("") || "sdk"; // livesessionapi
  const pascal = tokens.map(capitalize).join("") || "Sdk"; // LivesessionApi
  const nsIdent = identSeg(namespace); // livesession
  const nsPascal = capitalize(nsIdent); // Livesession

  switch (language) {
    case "node": {
      const p = `${dash}-node`; // livesession-api-node
      return { packageName: p, options: { packageName: p } };
    }
    case "ruby": {
      const p = `${dash}-ruby`; // livesession-api-ruby
      return { packageName: p, options: { packageName: p } };
    }
    case "go": {
      const p = `${dash}-go`; // livesession-api-go
      return { packageName: p, options: { modulePath: p } };
    }
    case "python": {
      // The Python emitter's packageName IS the import module (underscores); it
      // derives the pip/dist name as that with "_"→"-". Pass the module, store
      // the dist name so the UI shows what you `pip install`.
      const module = `${snake}_python`; // livesession_api_python
      return {
        packageName: `${dash}-python`, // livesession-api-python
        options: { packageName: module },
      };
    }
    case "java": {
      // Java packages can't contain dashes; use the idiomatic dotted form.
      const p = `com.${nsIdent}.${squash}`; // com.livesession.livesessionapi
      return {
        packageName: p,
        options: { packageName: squash, basePackage: `com.${nsIdent}` },
      };
    }
    case "dotnet": {
      // .NET namespaces can't contain dashes; use the idiomatic dotted form.
      const p = `${nsPascal}.${pascal}`; // Livesession.LivesessionApi
      return { packageName: p, options: { namespace: p } };
    }
    default:
      return { packageName: `${dash}-${language}`, options: {} };
  }
}

export const SDK_OUTPUT: Record<string, string> = {
  go: "./sdk/go",
  node: "./sdk/node",
  python: "./sdk/python",
  ruby: "./sdk/ruby",
  java: "./sdk/java",
  dotnet: "./sdk/dotnet",
};

/**
 * RAW spec doc → OpenSDK IR → per-language file map + the package identity and
 * version. The single spec→SDK code path, shared by `runSdkGeneration` (zips it)
 * and `runRelease` (commits it into a PR).
 */
export function generateSdkFileMap(o: {
  doc: Record<string, unknown>;
  language: string;
  namespace: string;
  title?: string;
}): { files: Record<string, string>; packageName: string; version: string } {
  ensureEmitters();
  const ir = openapi2opensdk(o.doc);
  const emitter = getEmitter(o.language);
  const { packageName, options } = sdkPackageIdentity(
    o.language,
    o.namespace,
    o.title ?? ir.info.title ?? "sdk",
  );
  const files = generate(ir, emitter, options);
  return { files, packageName, version: ir.info.version ?? "0.1.0" };
}

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
  namespace: string;
  projectId: string;
}): Promise<void> {
  const { targetId, jobId, apiId, version, language, namespace, projectId } =
    opts;
  try {
    const spec = await registryClient.fetchSpecRaw(apiId, version || "current");
    if (!spec) throw new Error("spec not found in registry");
    const doc = spec.contentType.includes("json")
      ? JSON.parse(spec.text)
      : (yamlLoad(spec.text) as Record<string, unknown>);

    // One source of truth: the package identity drives BOTH the emitter (so the
    // generated manifest + README use this name) and what we store below.
    const {
      files,
      packageName,
      version: ver,
    } = generateSdkFileMap({
      doc,
      language,
      namespace,
    });

    const zip = new JSZip();
    for (const [path, content] of Object.entries(files))
      zip.file(path, content);
    const buf = await zip.generateAsync({ type: "nodebuffer" });

    const key = `artifacts/sdk/${targetId}/sdk.zip`;
    await storage.write(key, buf, { mimeType: "application/zip" });

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
      projectId,
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
      projectId,
    });
  }
}
