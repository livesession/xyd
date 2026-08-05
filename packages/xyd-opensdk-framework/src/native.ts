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
 * file tree as a `path -> content` JSON object (ownership header already baked,
 * byte-identical to the JS emitter). writeMode is NOT carried across — callers
 * derive it from the emitter's own generateProject (see orchestrator).
 */
export function nativeOpensdkGenerate(
  language: string,
): ((specJson: string) => string) | null {
  if (!native) return null;
  const name = FN_BY_LANG[language];
  if (!name || typeof native[name] !== "function") return null;
  return (specJson: string) => native[name](specJson);
}
