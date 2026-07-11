/**
 * Preview backend (NODE-ONLY): runs the REAL opensdk emitters on a bundled
 * sample spec + the wizard's sdk.json options and returns the generated files +
 * the `generateUsage` snippet. Reparameterization of `generateSdkFileMap`
 * (`apps/apitoolchain-api/genframework/sdk.ts`) — in-memory, no disk.
 *
 * This module (and everything under `src/preview/`) imports `@xyd-js/*` and MUST
 * NEVER be imported by the UI barrel (`src/index.ts`). It runs only in the
 * Storybook dev middleware / a web server route.
 */
import { openapi2opensdk } from "@xyd-js/openapi2opensdk";
import { registerBuiltinEmitters } from "@xyd-js/opensdk-cli";
import { mergeBehaviorOverrides, walkMethods } from "@xyd-js/opensdk-core";
import {
  generateFileMap,
  getEmitter,
  materializeProject,
} from "@xyd-js/opensdk-framework";
import type {
  PreviewFile,
  PreviewOperation,
  PreviewRequest,
  PreviewResult,
} from "../model/types";
import { LANGUAGE_META } from "../model/types";
import { formatCode } from "./format";
import { SAMPLE_SPECS } from "./specs/petstore";

let registered = false;
function ensureEmitters(): void {
  if (!registered) {
    registerBuiltinEmitters();
    registered = true;
  }
}

/** Coerce a spec version into valid semver (npm/gems reject non-semver). */
function toSemver(v: string): string {
  const s = (v || "").trim().replace(/^v/i, "");
  const parts = s.split(".").filter((p) => /^\d+$/.test(p));
  if (parts.length === 0) return "0.0.0";
  while (parts.length < 3) parts.push("0");
  return parts.slice(0, 3).join(".");
}

const EXT_LANG: Record<string, string> = {
  ts: "typescript",
  tsx: "typescript",
  mts: "typescript",
  js: "javascript",
  go: "go",
  py: "python",
  rb: "ruby",
  java: "java",
  cs: "csharp",
  json: "json",
  md: "markdown",
  toml: "toml",
  xml: "xml",
  yaml: "yaml",
  yml: "yaml",
  mod: "go",
  sum: "text",
  gemspec: "ruby",
  lock: "json",
};

function langOfPath(path: string): string {
  const base = path.split("/").pop() ?? path;
  if (base === "go.mod" || base === "go.sum") return "go";
  if (base === "sdk.lock") return "json";
  const ext = base.includes(".") ? (base.split(".").pop() ?? "") : "";
  return EXT_LANG[ext] ?? "text";
}

/** Hero files first (client/index/manifest/busybox), then alphabetical. */
const PRIORITY = [
  /(^|\/)(index|client)\.[a-z]+$/i,
  /Client\.[a-z]+$/,
  /(^|\/)busybox\./i,
  /(package\.json|go\.mod|pyproject\.toml|pom\.xml|\.csproj|\.gemspec|Cargo\.toml)$/i,
  /README/i,
];
function rank(path: string): number {
  for (let i = 0; i < PRIORITY.length; i++)
    if (PRIORITY[i].test(path)) return i;
  return PRIORITY.length;
}

const RESERVED_SECTION_KEYS = new Set(["output", "behavior", "publish"]);

export async function runOpensdkPreview(
  req: PreviewRequest,
): Promise<PreviewResult> {
  try {
    ensureEmitters();
    // The REAL API doc (when the host resolved it from sdk.json's `api` ref) wins
    // so the wizard shows the actual API's SDK code + endpoints; else a bundled
    // sample (Storybook / no backend).
    const doc =
      req.doc ??
      (SAMPLE_SPECS.find((s) => s.id === req.specId) ?? SAMPLE_SPECS[0]).doc;
    const sdk = req.sdkJson;
    const meta = LANGUAGE_META[req.language];
    const section =
      (sdk[meta.sectionKey] as Record<string, unknown> | undefined) ?? {};

    // deep-merge global + per-language behavior (over the converter's defaults).
    // The wizard mirror types are structurally the real DeepPartial<SdkBehavior>;
    // cast via the functions' own parameter types (no @xyd-js named type imports,
    // which the bun/vite runtimes can't erase from the dist).
    type BehaviorArg = Parameters<typeof mergeBehaviorOverrides>[0];
    type ConvertOpts = NonNullable<Parameters<typeof openapi2opensdk>[1]>;
    const behavior = mergeBehaviorOverrides(
      sdk.behavior as unknown as BehaviorArg,
      section.behavior as unknown as BehaviorArg,
    );

    const ir = openapi2opensdk(
      doc as unknown as Parameters<typeof openapi2opensdk>[0],
      {
        sdkName: sdk.sdkName,
        sdkBehavior: behavior,
        mountRules: sdk.grouping?.mountRules,
        operationHints: sdk.grouping
          ?.operationHints as unknown as ConvertOpts["operationHints"],
      },
    );

    // publish identity → the manifest/README (author/license/version).
    const pub = {
      ...(sdk.publish ?? {}),
      ...((section.publish as object) ?? {}),
    };
    if (pub.version) ir.info.version = pub.version;
    if (pub.author) ir.info.contact = { ...ir.info.contact, name: pub.author };
    if (pub.license)
      ir.info.license = {
        ...ir.info.license,
        identifier: pub.license,
      } as never;
    ir.info.version = toSemver(ir.info.version ?? "");

    const emitter = getEmitter(req.language);

    // every non-reserved section key is an emitter option (packageName,
    // exportDefault, exportPackage, busybox, modulePath, namespace, …).
    const emitterOptions: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(section)) {
      if (!RESERVED_SECTION_KEYS.has(k) && v !== undefined && v !== "")
        emitterOptions[k] = v;
    }

    const project = generateFileMap(ir, emitter, emitterOptions);
    const files = await materializeProject(project, { generator: "opensdk" });

    // Real SDK usage for EVERY operation (the endpoint switcher), mirroring the
    // editor's `attachSdkExamples`: walkMethods → generateUsage per method for the
    // active language. `fm.path` is the resource CHAIN (root→owner), which is both
    // the `generateUsage` `chain` arg and the stable-id prefix (NOT the HTTP path,
    // that's `fm.method.path`).
    const types = new Map((ir.types ?? []).map((t) => [t.name, t]));
    const ctx = { spec: ir, types, emitterOptions };
    const operations: PreviewOperation[] = [];
    if (emitter.generateUsage) {
      const seen = new Map<string, number>();
      for (const fm of walkMethods(ir)) {
        const base = `${fm.path.join(".")}.${fm.method.action}`;
        const n = seen.get(base) ?? 0;
        seen.set(base, n + 1);
        const id = n === 0 ? base : `${base}#${n}`; // dedupe defensive collisions
        let code: string | undefined;
        try {
          code = emitter.generateUsage(fm.method, fm.path, ctx);
        } catch {
          continue; // one operation failing must not drop the rest
        }
        if (!code) continue;
        operations.push({
          id,
          action: fm.method.action,
          httpMethod: (fm.method.httpMethod ?? "").toUpperCase(),
          path: fm.method.path ?? "",
          // Pretty-print the snippet (ruff/gofmt/biome/clang) so a many-arg call
          // wraps instead of running off one long line.
          code: formatCode(code, meta.highlight),
        });
      }
    }
    // The default/hero op the switcher opens on (a list reads best), and the
    // `usage` back-compat field the diff baseline compares against.
    const hero =
      operations.find((o) => o.action === "list") ??
      operations.find((o) => o.action === "retrieve") ??
      operations[0];

    const previewFiles: PreviewFile[] = Object.entries(files)
      // `.sdk/sdk.lock` is an internal regen manifest (path→sha) — noise in the
      // preview + diff, so hide it.
      .filter(([path]) => !path.startsWith(".sdk/"))
      .map(([path, code]) => ({ path, code, language: langOfPath(path) }))
      .sort(
        (a, b) => rank(a.path) - rank(b.path) || a.path.localeCompare(b.path),
      );

    return {
      files: previewFiles,
      usage: hero?.code,
      operations,
      defaultOperationId: hero?.id,
    };
  } catch (e) {
    return { files: [], error: e instanceof Error ? e.message : String(e) };
  }
}
