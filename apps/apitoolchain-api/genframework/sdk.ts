import { openapi2opensdk } from "@xyd-js/openapi2opensdk";
import { registerBuiltinEmitters } from "@xyd-js/opensdk-cli";
import { mergeBehaviorOverrides } from "@xyd-js/opensdk-core";
import {
  generateFileMap,
  getEmitter,
  materializeProject,
} from "@xyd-js/opensdk-framework";
import { load as yamlLoad } from "js-yaml";
import JSZip from "jszip";
import { registryClient } from "../clients/registry";
import { config } from "../config";
import * as jobQ from "../dbnode/jobs";
import * as notifQ from "../dbnode/notifications";
import { pool } from "../dbnode/pool";
import * as buildQ from "../dbnode/sdk_builds";
import * as sdkQ from "../dbnode/sdk_targets";
import { storage } from "../storage";
import { randomId } from "../util";

let registered = false;
function ensureEmitters(): void {
  if (!registered) {
    registerBuiltinEmitters();
    registered = true;
  }
}

/** Canonical language → the sdk.json section key (aliases the emitters accept).
 * Mirrors the wizard's LANGUAGE_META. `go`/`python`/`ruby`/`java` are identity. */
const SECTION_KEY: Record<string, string> = {
  node: "typescript",
  dotnet: "csharp",
};
/** Section keys that are NOT emitter options (they configure output/behavior/publish). */
const RESERVED_SECTION_KEYS = new Set(["output", "behavior", "publish"]);

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
 * The name is `<base>-<language>` (base collapsed on separators, so the brand
 * stays intact): e.g. "livesession-api-sdk" → `livesession-api-sdk-node`,
 * `livesession-api-sdk-go`, `livesession-api-sdk-python`. Languages whose
 * identifiers forbid dashes (Java packages, .NET namespaces) use the idiomatic
 * dotted form.
 */
function sdkPackageIdentity(
  language: string,
  namespace: string,
  base: string,
): { packageName: string; options: Record<string, unknown> } {
  // The base is the SDK's OWN id (a deliberate slug like "livesession-api-sdk"),
  // honored verbatim — no "sdk"-token stripping — so the package matches the
  // target id (`<sdk-id>-<language>`, e.g. livesession-api-sdk-node).
  const tokens = titleTokens(base);
  const dash = tokens.join("-") || "sdk"; // livesession-api-sdk
  const snake = tokens.join("_") || "sdk"; // livesession_api_sdk
  const squash = tokens.join("") || "sdk"; // livesessionapisdk
  const pascal = tokens.map(capitalize).join("") || "Sdk"; // LivesessionApiSdk
  const nsIdent = identSeg(namespace); // livesession
  const nsPascal = capitalize(nsIdent); // Livesession

  switch (language) {
    case "node": {
      const p = `${dash}-node`; // livesession-api-sdk-node
      return { packageName: p, options: { packageName: p } };
    }
    case "ruby": {
      const p = `${dash}-ruby`; // livesession-api-sdk-ruby
      return { packageName: p, options: { packageName: p } };
    }
    case "go": {
      const p = `${dash}-go`; // livesession-api-sdk-go
      return { packageName: p, options: { modulePath: p } };
    }
    case "python": {
      // The Python emitter's packageName IS the import module (underscores); it
      // derives the pip/dist name as that with "_"→"-". Pass the module, store
      // the dist name so the UI shows what you `pip install`.
      const module = `${snake}_python`; // livesession_api_sdk_python
      return {
        packageName: `${dash}-python`, // livesession-api-sdk-python
        options: { packageName: module },
      };
    }
    case "java": {
      // Java packages can't contain dashes; use the idiomatic dotted form.
      const p = `com.${nsIdent}.${squash}`; // com.livesession.livesessionapisdk
      return {
        packageName: p,
        options: { packageName: squash, basePackage: `com.${nsIdent}` },
      };
    }
    case "dotnet": {
      // .NET namespaces can't contain dashes; use the idiomatic dotted form.
      const p = `${nsPascal}.${pascal}`; // Livesession.LivesessionApiSdk
      return { packageName: p, options: { namespace: p } };
    }
    default:
      return { packageName: `${dash}-${language}`, options: {} };
  }
}

/**
 * Substitute an explicit package name (the source-of-truth name, e.g. a connected
 * publisher's `@livesession/livesession-node`) into a language's emitter options,
 * so the generated manifest + README use it verbatim. Mirrors the option KEYS in
 * `sdkPackageIdentity` (packageName / modulePath / namespace); other derived
 * options (java `basePackage`, …) are preserved.
 */
function applyOverridePackageName(
  language: string,
  name: string,
  derived: Record<string, unknown>,
): Record<string, unknown> {
  const p = name.trim();
  switch (language) {
    case "go":
      return { ...derived, modulePath: p };
    case "python":
      // The python emitter's `packageName` IS the import module (underscores) —
      // coerce the dist name (scope/dashes) into a module id.
      return {
        ...derived,
        packageName: p
          .replace(/^@/, "")
          .replace(/[^a-zA-Z0-9]+/g, "_")
          .toLowerCase(),
      };
    case "dotnet":
      return { ...derived, namespace: p };
    default:
      // node / ruby / java and any future language key on `packageName`.
      return { ...derived, packageName: p };
  }
}

/**
 * Coerce a spec `info.version` into a valid semver for the SDK package version
 * (npm/gems reject non-semver). "v1"→"1.0.0", "1.2"→"1.2.0", "1.2.3"→"1.2.3",
 * anything without leading digits → "0.0.0".
 */
function toSemver(v: string): string {
  const s = (v || "").trim().replace(/^v/i, "");
  const parts = s.split(".").filter((p) => /^\d+$/.test(p));
  if (parts.length === 0) return "0.0.0";
  while (parts.length < 3) parts.push("0");
  return parts.slice(0, 3).join(".");
}

/**
 * A registry REFERENCE — a package/image-style ref, not a raw URL, so it stays
 * stable and portable (no ephemeral dev host/port). Shape:
 * `[<host>/]<kind>/<ns>/<name>@<ver>` (`kind` = `apis` for a spec, `sdks` for a
 * generated package). The host comes from PLATFORM_REGISTRY_HOST — empty in dev
 * → a clean host-less ref; prepend a scheme to resolve it (the registry serves
 * `/<kind>/<ns>/<name>@<ver>`).
 */
function registryRef(
  kind: "apis" | "sdks",
  namespace: string,
  name: string,
  version: string,
): string {
  const v = version || "current";
  const ref = `${kind}/${namespace ? `${namespace}/` : ""}${name}@${v}`;
  const host = config.platformRegistryHost.replace(/\/+$/, "");
  return host ? `${host}/${ref}` : ref;
}

/**
 * The registry ref for an API SPEC (`apis/<ns>/<api>@<ver>`) — baked into an
 * SDK's `sdk.json` `spec` (the source it's generated from). E.g.
 * `registry.apitoolchain.dev/apis/livesession/livesession-public-api@v1`.
 */
export function registrySpecRef(
  namespace: string,
  apiId: string,
  version: string,
): string {
  return registryRef("apis", namespace, apiId, version);
}

/**
 * The registry ref for a generated SDK PACKAGE (`sdks/<ns>/<package>@<ver>`) —
 * baked into `sdk.json` `sdk` (this SDK's own registry identity). E.g.
 * `registry.apitoolchain.dev/sdks/livesession/openai-node@2.3.0`.
 */
export function registrySdkRef(
  namespace: string,
  packageName: string,
  version: string,
): string {
  return registryRef("sdks", namespace, packageName, version);
}

/**
 * RAW spec doc → OpenSDK IR → per-language file map + the package identity and
 * version. The single spec→SDK code path, shared by `runSdkGeneration` (zips it)
 * and `runRelease` (commits it into a PR). Ships a root `sdk.json` (regen config,
 * `spec` → the registry) and the opensdk `.sdk/sdk.lock` manifest, so the SDK is
 * self-describing + regenerable with a bare `opensdk generate` — same as the CLI.
 */
export async function generateSdkFileMap(o: {
  doc: Record<string, unknown>;
  language: string;
  namespace: string;
  /** The SDK's display name (the `sdks` row's `name`, e.g. "openai SDK") — drives
   * the package identity, so the generated package is named after the SDK, not
   * the source spec's `info.title`. */
  sdkName?: string;
  /** Registry ref of the API this SDK is generated FROM — baked into sdk.json's
   * `api` (see `registrySpecRef`, e.g. `apis/livesession/livesession-public-api@v1`). */
  api?: string;
  /** This SDK's OWN registry id + version — baked into sdk.json's `sdk` ref
   * (`sdks/<ns>/<sdk-id>@<ver>`), the user-named SDK, NOT the per-language
   * package. Falls back to the package identity + IR version. */
  sdkId?: string;
  sdkVersion?: string;
  /** Explicit package name (the source of truth — e.g. from a connected
   * publisher, `@livesession/livesession-node`). Used VERBATIM in sdk.json + the
   * emitter's manifest/README, overriding the id-derived default. */
  packageName?: string;
  /** A parsed custom sdk.json (behavior + per-language emitter options) — the
   * "wizard" flow. When set, it's applied over the derived defaults. */
  sdkJson?: Record<string, unknown>;
}): Promise<{
  files: Record<string, string>;
  packageName: string;
  version: string;
  /** The generated `sdk.json` content — stored standalone so the dashboard can
   * read it without pulling (and unzipping) the whole artifact. */
  sdkJson: string;
}> {
  ensureEmitters();
  // The custom sdk.json (wizard flow), if any: pull the per-language section +
  // the global behavior/publish/grouping — mirrors the wizard's runOpensdkPreview.
  const config = o.sdkJson;
  const sectionKey = SECTION_KEY[o.language] ?? o.language;
  const section =
    (config?.[sectionKey] as Record<string, unknown> | undefined) ?? {};

  // Custom runtime behavior (global deep-merged with the per-language override)
  // → the converter, alongside grouping.
  const behavior = config
    ? mergeBehaviorOverrides(
        config.behavior as Parameters<typeof mergeBehaviorOverrides>[0],
        section.behavior as Parameters<typeof mergeBehaviorOverrides>[0],
      )
    : undefined;
  const ir = openapi2opensdk(
    o.doc as unknown as Parameters<typeof openapi2opensdk>[0],
    config
      ? {
          sdkName: (config.sdkName as string | undefined) ?? o.sdkName,
          sdkBehavior: behavior as never,
          mountRules: (
            config.grouping as { mountRules?: Record<string, string> }
          )?.mountRules,
          operationHints: (config.grouping as { operationHints?: unknown })
            ?.operationHints as never,
        }
      : undefined,
  );
  // The SDK's PACKAGE version must be valid semver — a spec `info.version` like
  // "v1" bakes an unpublishable version into the manifest (npm/gems reject it).
  ir.info.version = toSemver(ir.info.version ?? "");

  // Custom publish identity → the manifest/README (author/license/version).
  if (config) {
    const pub = {
      ...((config.publish as Record<string, unknown>) ?? {}),
      ...((section.publish as Record<string, unknown>) ?? {}),
    };
    if (pub.version) ir.info.version = toSemver(String(pub.version));
    if (pub.author)
      ir.info.contact = { ...ir.info.contact, name: String(pub.author) };
    if (pub.license)
      ir.info.license = {
        ...ir.info.license,
        identifier: String(pub.license),
      } as never;
  }

  const emitter = getEmitter(o.language);
  // The generated package is named after the SDK's OWN id (the user's deliberate
  // slug, e.g. "livesession-api-sdk"), so it matches the target id
  // (`<sdk-id>-<language>`). Fall back to the display name / spec title for
  // legacy callers that don't pass an id.
  const base = o.sdkId?.trim() || o.sdkName?.trim() || ir.info.title || "sdk";
  const derived = sdkPackageIdentity(o.language, o.namespace, base);
  // An explicit package name (the source of truth, e.g. a connected publisher's)
  // wins over the derived default; then the wizard's per-language emitter options
  // (exportDefault / exportPackage / busybox / packageName / modulePath / …) layer on top.
  const override = o.packageName?.trim();
  const packageName = override || derived.packageName;
  const options: Record<string, unknown> = override
    ? applyOverridePackageName(o.language, override, derived.options)
    : { ...derived.options };
  if (config) {
    for (const [k, v] of Object.entries(section)) {
      if (!RESERVED_SECTION_KEYS.has(k) && v !== undefined && v !== "")
        options[k] = v;
    }
  }

  // The SAME opensdk flow the CLI uses — the framework owns the generation + the
  // `.sdk/sdk.lock` regen manifest (via materializeProject, the disk-less
  // writeProject). apitoolchain adds only a root `sdk.json` (regen config; `spec`
  // → the live registry), then hands the file map to opensdk.
  const project = generateFileMap(ir, emitter, options);
  const sdkJsonDoc: Record<string, unknown> = {
    $schema: "https://unpkg.com/@xyd-js/opensdk-cli/sdk.schema.json",
    version: 1,
    ...(config?.sdkName ? { sdkName: config.sdkName } : {}),
    // `api` = the API spec this SDK is generated FROM (apis/…); `sdk` = this
    // SDK's OWN registry identity (sdks/…) — the user-named SDK id + its version,
    // NOT the per-language package. Same ref shape, different registry kind.
    ...(o.api ? { api: o.api } : {}),
    sdk: registrySdkRef(
      o.namespace,
      o.sdkId ?? packageName,
      o.sdkVersion ?? ir.info.version ?? "0.1.0",
    ),
    // Reflect the applied custom config so the stored sdk.json regenerates it.
    ...(config?.behavior ? { behavior: config.behavior } : {}),
    ...(config?.publish ? { publish: config.publish } : {}),
    ...(config?.grouping ? { grouping: config.grouping } : {}),
    [config ? sectionKey : o.language]: {
      ...(config ? section : {}),
      ...options,
      output: ".",
    },
  };
  project["sdk.json"] = {
    content: `${JSON.stringify(sdkJsonDoc, null, 2)}\n`,
    writeMode: "skipIfExists",
  };

  const files = await materializeProject(project, { generator: "opensdk" });
  return {
    files,
    packageName,
    version: ir.info.version ?? "0.1.0",
    sdkJson: files["sdk.json"] ?? "",
  };
}

/** Object-storage keys for a target's build outputs. */
export const sdkArtifactKey = (targetId: string) =>
  `artifacts/sdk/${targetId}/sdk.zip`;
/** The `sdk.json` stored STANDALONE (not just inside the zip) so the dashboard
 * can read it without downloading + unzipping the whole artifact. */
export const sdkJsonKey = (targetId: string) =>
  `artifacts/sdk/${targetId}/sdk.json`;

/**
 * Wired SDK generation: RAW spec → OpenSDK IR → per-language file map → zip in
 * object storage (+ a standalone `sdk.json`) → mark the target ready + notify.
 * Runs off the request path (fire-and-forget); the `jobs` row is the queue seam.
 */
export async function runSdkGeneration(opts: {
  targetId: string;
  jobId: string;
  apiId: string;
  version: string;
  language: string;
  namespace: string;
  /** The SDK's display name (`sdks.name`) — drives the generated package identity. */
  sdkName: string;
  /** This SDK's OWN registry id (`sdks.id`) + version (`sdks.version`) → sdk.json's
   * `sdk` ref. Decoupled from the API id and the per-language package name. */
  sdkId?: string;
  sdkVersion?: string;
  /** Explicit package name (source of truth — e.g. a connected publisher's), baked
   * verbatim into sdk.json + the manifest/README. Empty → id-derived default. */
  packageName?: string;
  projectId: string;
  /** The SDK build this generation belongs to — its logs are appended here. */
  buildId?: string;
  /** The custom sdk.json (wizard flow) to apply — serialized; empty → derived. */
  sdkJson?: string;
}): Promise<void> {
  const {
    targetId,
    jobId,
    apiId,
    version,
    language,
    namespace,
    sdkName,
    sdkId,
    sdkVersion,
    packageName: packageNameOverride,
    projectId,
    buildId,
    sdkJson: sdkJsonRaw,
  } = opts;
  // Append a build-log line (prefixed by language), best-effort — a logging
  // hiccup must never fail the generation itself.
  const log = async (msg: string): Promise<void> => {
    const line = `[${language}] ${msg}\n`;
    // Per-target stream (ALWAYS) — reset each build (markSdkTargetBuilding / a
    // fresh insert) and tailed live by the dashboard, so every generation path
    // (add target, build, new version, connect-publisher regen) is visible.
    try {
      await sdkQ.appendSdkTargetBuildLog(pool, {
        id: targetId,
        buildLogs: line,
      });
    } catch {
      // ignore — logs are advisory
    }
    // Plus the shared SDK-build log, when this generation belongs to a version.
    if (buildId) {
      try {
        await buildQ.appendSdkBuildLog(pool, { id: buildId, logs: line });
      } catch {
        // ignore — logs are advisory
      }
    }
  };
  try {
    await log(`generating from ${apiId}@${version || "current"}…`);
    const spec = await registryClient.fetchSpecRaw(apiId, version || "current");
    if (!spec)
      throw new Error(
        `spec not found in registry for ${apiId}@${version || "current"} (check the version exists + its spec is stored)`,
      );
    const doc = spec.contentType.includes("json")
      ? JSON.parse(spec.text)
      : (yamlLoad(spec.text) as Record<string, unknown>);

    // One source of truth: the package identity drives BOTH the emitter (so the
    // generated manifest + README use this name) and what we store below.
    // The custom sdk.json config (wizard flow), if the target carries one.
    let customSdkJson: Record<string, unknown> | undefined;
    if (sdkJsonRaw) {
      try {
        customSdkJson = JSON.parse(sdkJsonRaw) as Record<string, unknown>;
      } catch {
        await log("custom sdk.json is invalid JSON — using the derived config");
      }
    }
    const {
      files,
      packageName,
      version: ver,
      sdkJson,
    } = await generateSdkFileMap({
      doc,
      language,
      namespace,
      sdkName,
      api: registrySpecRef(namespace, apiId, version),
      sdkId,
      sdkVersion,
      packageName: packageNameOverride,
      sdkJson: customSdkJson,
    });
    await log(`generated ${Object.keys(files).length} files (${packageName})`);

    const zip = new JSZip();
    for (const [path, content] of Object.entries(files))
      zip.file(path, content);
    const buf = await zip.generateAsync({ type: "nodebuffer" });

    const key = sdkArtifactKey(targetId);
    await storage.write(key, buf, { mimeType: "application/zip" });
    // Also persist sdk.json on its own — served directly to the dashboard so it
    // never has to pull the whole artifact zip just to show the config.
    await storage.write(sdkJsonKey(targetId), sdkJson, {
      mimeType: "application/json",
    });

    await sdkQ.markSdkTargetReady(pool, {
      id: targetId,
      artifactRef: key,
      packageName,
      version: ver,
    });
    await log(`✓ ready — ${packageName}@${ver}`);
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
    await log(`✗ error — ${message}`);
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
