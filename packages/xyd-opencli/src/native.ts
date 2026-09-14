// Loader for the Rust core. Resolution order mirrors the sibling packages':
//   1. XYD_NATIVE=0 → null (force the JS impl — test/incident hatch)
//   2. globalThis.__xydNativeCore — the embedded core.node inside the
//      bun-compiled binary (set by xyd-cli's native-boot)
//   3. @xyd-js/native — the napi package
//   4. null → callers keep the TypeScript converter
import { createRequire } from 'node:module';

function load(): any | null {
  if (process.env.XYD_NATIVE === '0') return null;
  const embedded = (globalThis as any).__xydNativeCore;
  if (embedded?.opencliToReferences) return embedded;
  try {
    const require = createRequire(import.meta.url);
    return require('@xyd-js/native');
  } catch {
    return null;
  }
}

const native = load();

/**
 * The native `opencliToReferences`, or null when unavailable.
 *
 * Takes the PARSED spec rather than a path: the JS loader also fetches
 * `http(s)` sources and resolves relative paths against a caller-supplied cwd,
 * and duplicating that in Rust would mean an HTTP client in the cdylib. Real
 * OpenCLI documents are 4–27 KB, so handing the parsed object across costs
 * nothing measurable — unlike the multi-MB OpenAPI specs, where the fused
 * path's take-a-path design earns its keep.
 */
export function nativeOpencliToReferences():
  | ((specJson: string, optionsJson?: string) => string)
  | null {
  if (!native || typeof native.opencliToReferences !== 'function') return null;
  return (specJson: string, optionsJson?: string) => native.opencliToReferences(specJson, optionsJson);
}
