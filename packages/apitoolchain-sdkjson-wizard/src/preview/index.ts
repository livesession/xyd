/**
 * Preview backend (NODE-ONLY): runs the REAL opensdk emitters on a bundled
 * sample spec + the wizard's sdk.json options and returns the generated files +
 * the `generateUsage` snippet. Reparameterization of `generateSdkFileMap`
 * (`apps/apitoolchain-api/genframework/sdk.ts`) — in-memory, no disk.
 *
 * This module (and everything under `src/preview/`) loads the native addon and MUST
 * NEVER be imported by the UI barrel (`src/index.ts`). It runs only in the
 * Storybook dev middleware / a web server route.
 */
import { createRequire } from "node:module";

import type {
  PreviewFile,
  PreviewOperation,
  PreviewRequest,
  PreviewResult,
} from "../model/types";
import { LANGUAGE_META } from "../model/types";
import { formatCode } from "./format";
import { SAMPLE_SPECS } from "./specs/petstore";

/**
 * This module is deliberately NATIVE-ONLY. It used to import four `@xyd-js/*`
 * TypeScript packages (openapi2opensdk, opensdk-cli, opensdk-core, opensdk-framework);
 * those are being retired, so the preview now calls the Rust core directly.
 *
 * Consequence worth knowing: unlike every other native call site in this repo, there is
 * no JS fallback here, so `XYD_NATIVE=0` does not work for this surface. Keeping one
 * would mean keeping the TypeScript dependency, which is the thing being removed.
 *
 * `createRequire` rather than a static import: a static import makes the bundler try to
 * resolve the platform-specific `.node`, whereas this form survives verbatim into the
 * SSR bundle.
 */
let nativeCache: Record<string, unknown> | null | undefined;
function loadNative(): Record<string, unknown> {
  // Honoured only to say clearly that it does NOT work here. Elsewhere XYD_NATIVE=0
  // selects a JS implementation; this surface has none, so silently ignoring the flag
  // would mislead whoever set it.
  if (process.env.XYD_NATIVE === "0") {
    throw new Error(
      "XYD_NATIVE=0 is not supported by the SDK preview: it has no JS fallback, " +
        "because the TypeScript opensdk emitters it used to depend on are being retired.",
    );
  }
  if (nativeCache === undefined) {
    const embedded = (globalThis as Record<string, unknown>).__xydNativeCore as
      | Record<string, unknown>
      | undefined;
    if (embedded?.openapi2opensdk) {
      nativeCache = embedded;
    } else {
      try {
        nativeCache = createRequire(import.meta.url)("@xyd-js/native");
      } catch {
        nativeCache = null;
      }
    }
  }
  if (!nativeCache) {
    throw new Error(
      "@xyd-js/native is required by the SDK preview and could not be resolved. " +
        "Build it with `pnpm --filter @xyd-js/native build:native`, and make sure the " +
        "deployed image ships packages/xyd-native including its platform .node binary.",
    );
  }
  return nativeCache;
}

// Same six ids as the wizard's SdkLanguage union. `rust` is absent from both tables,
// matching the framework: it implements neither docs capability.
const GEN_FN_BY_LANG: Record<string, string> = {
  go: "opensdkGenerateGo",
  node: "opensdkGenerateNode",
  python: "opensdkGeneratePython",
  ruby: "opensdkGenerateRuby",
  java: "opensdkGenerateJava",
  dotnet: "opensdkGenerateDotnet",
};
const DOCS_FN_BY_LANG: Record<string, string> = {
  go: "opensdkDocsGo",
  node: "opensdkDocsNode",
  python: "opensdkDocsPython",
  ruby: "opensdkDocsRuby",
  java: "opensdkDocsJava",
  dotnet: "opensdkDocsDotnet",
};

// --- inlined from @xyd-js/opensdk-core (pure, no imports) ------------------------
// Objects merge recursively; arrays and scalars replace. Matches behavior.ts exactly.
function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
function deepMerge(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...target };
  for (const [k, v] of Object.entries(source)) {
    if (v === undefined) continue;
    const prev = out[k];
    out[k] = isPlainObject(prev) && isPlainObject(v) ? deepMerge(prev, v) : v;
  }
  return out;
}
function mergeBehaviorOverrides(
  ...layers: (Record<string, unknown> | undefined)[]
): Record<string, unknown> | undefined {
  const present = layers.filter(isPlainObject);
  if (present.length === 0) return undefined;
  return present.reduce((acc, l) => deepMerge(acc, l), {});
}

/** Walk the resource tree, yielding each method with its resource CHAIN (root -> owner).
 * Only `{path, method}` is needed here; the preview never reads the resource itself. */
function walkMethods(spec: {
  resources?: unknown[];
}): { path: string[]; method: Record<string, unknown> }[] {
  const out: { path: string[]; method: Record<string, unknown> }[] = [];
  const visit = (resources: unknown[], chain: string[]): void => {
    for (const r of resources) {
      const res = r as {
        name?: string;
        methods?: unknown[];
        resources?: unknown[];
      };
      const next = [...chain, res.name ?? ""];
      for (const m of res.methods ?? [])
        out.push({ path: next, method: m as Record<string, unknown> });
      if (res.resources?.length) visit(res.resources, next);
    }
  };
  visit(spec.resources ?? [], []);
  return out;
}
// --------------------------------------------------------------------------------

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
    const native = loadNative();
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

    // deep-merge global + per-language behavior (over the converter's defaults). The
    // fold stays caller-side because the native converter takes ONE already-merged
    // `sdkBehavior` value.
    const behavior = mergeBehaviorOverrides(
      sdk.behavior as unknown as Record<string, unknown> | undefined,
      section.behavior as unknown as Record<string, unknown> | undefined,
    );

    // The RAW, un-dereferenced doc is passed deliberately: the JSON transport needs an
    // acyclic document, and the converter relies on `$ref` identity for nominal types.
    const ir = JSON.parse(
      (native.openapi2opensdk as (d: string, o?: string) => string)(
        JSON.stringify(doc),
        JSON.stringify({
          sdkName: sdk.sdkName,
          sdkBehavior: behavior,
          mountRules: sdk.grouping?.mountRules,
          operationHints: sdk.grouping?.operationHints,
        }),
      ),
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

    const genFn = GEN_FN_BY_LANG[req.language];
    const docsFn = DOCS_FN_BY_LANG[req.language];
    if (!genFn) throw new Error(`unsupported SDK language: ${req.language}`);

    // every non-reserved section key is an emitter option (packageName,
    // exportDefault, exportPackage, busybox, modulePath, namespace, …).
    const emitterOptions: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(section)) {
      if (!RESERVED_SECTION_KEYS.has(k) && v !== undefined && v !== "")
        emitterOptions[k] = v;
    }

    const irJson = JSON.stringify(ir);
    const optionsJson = Object.keys(emitterOptions).length
      ? JSON.stringify(emitterOptions)
      : undefined;

    // The native generator returns `path -> {content, writeMode}` (or a bare string).
    // `materializeProject`'s extra work is a no-op for a preview: its only non-trivial
    // step is canonicalizing mergeJson files, and the emitters already emit those as
    // `JSON.stringify(x, null, 2) + "\n"`. The `.sdk/` lock it would add is filtered
    // out below anyway.
    const project = JSON.parse(
      (native[genFn] as (s: string, o?: string) => string)(irJson, optionsJson),
    ) as Record<string, string | { content: string }>;
    const files: Record<string, string> = {};
    for (const [p, entry] of Object.entries(project))
      files[p] = typeof entry === "string" ? entry : entry.content;

    // Real SDK usage for EVERY operation (the endpoint switcher), mirroring the
    // editor's `attachSdkExamples`: walkMethods → generateUsage per method for the
    // active language. `fm.path` is the resource CHAIN (root→owner), which is both
    // the `generateUsage` `chain` arg and the stable-id prefix (NOT the HTTP path,
    // that's `fm.method.path`).
    const operations: PreviewOperation[] = [];
    if (docsFn) {
      // ONE crossing for every operation, rather than one per operation. Wrapped so a
      // docs failure still returns the files, mirroring the old per-op `catch continue`.
      let docs: Record<string, { usage?: string }> = {};
      try {
        docs = JSON.parse(
          (native[docsFn] as (s: string, o?: string) => string)(
            irJson,
            optionsJson,
          ),
        );
      } catch {
        docs = {};
      }

      const methods = walkMethods(ir);
      const docKey = (m: Record<string, unknown>): string =>
        `${String(m.httpMethod ?? "").toLowerCase()} ${String(m.path ?? "")}`;

      // The docs map is keyed by (httpMethod, path), which is COARSER than the resource
      // chain: if two chains ever shared one endpoint they would collapse last-writer-
      // wins, and we would confidently render one chain's snippet under the other's id.
      // No reachable OpenAPI input produces that today, so this is defensive — but a
      // missing switcher entry beats a wrong code sample. See __oracle__/guard.test.ts.
      const keyCounts = new Map<string, number>();
      for (const fm of methods)
        keyCounts.set(docKey(fm.method), (keyCounts.get(docKey(fm.method)) ?? 0) + 1);

      const seen = new Map<string, number>();
      for (const fm of methods) {
        const base = `${fm.path.join(".")}.${fm.method.action}`;
        const n = seen.get(base) ?? 0;
        seen.set(base, n + 1);
        const id = n === 0 ? base : `${base}#${n}`; // dedupe defensive collisions
        const key = docKey(fm.method);
        if ((keyCounts.get(key) ?? 0) > 1) continue; // ambiguous — skip, never guess
        const code = docs[key]?.usage;
        if (!code) continue;
        operations.push({
          id,
          action: fm.method.action as string,
          httpMethod: String(fm.method.httpMethod ?? "").toUpperCase(),
          path: (fm.method.path as string) ?? "",
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
