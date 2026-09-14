// Loader for the Rust core (S6+ W7 wiring). The opensdk emitters dispatch to
// their per-language native generator when @xyd-js/native is present, else drive
// the JS Emitter capabilities. Resolution order:
//   1. XYD_NATIVE=0 → null (force the frozen JS emitters)
//   2. globalThis.__xydNativeCore — the embedded core.node inside the binary
//   3. @xyd-js/native — the napi package
//   4. null → the orchestrator runs the JS capability methods
import { createRequire } from "node:module";

function load(): any | null {
  if (process.env.XYD_NATIVE === "0") return null;
  const embedded = (globalThis as any).__xydNativeCore;
  if (embedded?.opensdkGenerateGo) return embedded;
  try {
    const require = createRequire(import.meta.url);
    return require("@xyd-js/native");
  } catch {
    return null;
  }
}

const native = load();

// Canonical language id (the registry key = emitter.language) → native js_name.
const FN_BY_LANG: Record<string, string> = {
  go: "opensdkGenerateGo",
  node: "opensdkGenerateNode",
  python: "opensdkGeneratePython",
  ruby: "opensdkGenerateRuby",
  java: "opensdkGenerateJava",
  dotnet: "opensdkGenerateDotnet",
  rust: "opensdkGenerateRust",
};

/**
 * The native generator for a canonical language id, or null when unavailable.
 * The native fn takes the OpenSDK IR as a JSON string and returns the FULL SDK
 * file tree as a `path -> { content, writeMode? }` JSON object (ownership header
 * already baked, byte-identical to the JS emitter). `writeMode` is carried
 * across, so the orchestrator no longer rebuilds it from generateProject.
 */
export function nativeOpensdkGenerate(
  language: string,
): ((specJson: string, optionsJson?: string) => string) | null {
  if (!native) return null;
  const name = FN_BY_LANG[language];
  if (!name || typeof native[name] !== "function") return null;
  // `optionsJson` is the ctx.emitterOptions bag as JSON. Omitted and `{}` behave
  // identically on the Rust side — every field keeps its spec-derived default.
  return (specJson: string, optionsJson?: string) =>
    native[name](specJson, optionsJson);
}

// Canonical language id → native DOCS js_name. The Rust TARGET is absent: it
// implements neither docs capability and is not in SDK_LANGS.
const DOCS_FN_BY_LANG: Record<string, string> = {
  go: "opensdkDocsGo",
  node: "opensdkDocsNode",
  python: "opensdkDocsPython",
  ruby: "opensdkDocsRuby",
  java: "opensdkDocsJava",
  dotnet: "opensdkDocsDotnet",
};

/** One operation's docs payload, as the native surface returns it. */
export interface NativeOperationDocs {
  usage: string;
  // Structurally a RenderedTypeReference; kept loose here so this loader stays
  // dependency-free.
  typeReference: unknown;
}

/**
 * The native DOCS generator for a canonical language id, or null when
 * unavailable.
 *
 * BATCH: one call per (language, spec) returns EVERY operation's usage snippet
 * and type reference, keyed `"<httpmethod-lowercase> <path>"` — the same key
 * `prepareFromIr` indexes by. The docs pipeline needs one entry per operation
 * per language (242 × 6 for the OpenAI spec), so a per-operation surface would
 * cost ~1450 boundary crossings per build.
 *
 * The returned fn yields `null` for a language the native side has no
 * capabilities for, so callers fall back to the JS emitter.
 */
export function nativeOpensdkDocs(
  language: string,
): ((specJson: string, optionsJson?: string) => Record<string, NativeOperationDocs> | null) | null {
  if (!native) return null;
  const name = DOCS_FN_BY_LANG[language];
  if (!name || typeof native[name] !== "function") return null;
  return (specJson: string, optionsJson?: string) => {
    const raw = native[name](specJson, optionsJson);
    return raw === "null" ? null : (JSON.parse(raw) as Record<string, NativeOperationDocs>);
  };
}
