// Native boot for the `bun --compile` binary (S4). Imported FIRST by binary.ts
// so it fully evaluates — embedding the Rust core and answering __nativecheck —
// before the CLI graph (`./index`) is imported. Kept as a separate module (not a
// dynamic `import()`) precisely so there is NO code-split boundary: --compile
// only bundles a dependency's full graph into the executable across STATIC edges;
// a top-level `await import("./index")` left transitive CJS deps (gray-matter …)
// resolving at runtime against a node_modules the binary doesn't have.
export {};
declare const Bun: any;

// Embed the Rust addon. A LITERAL require of a fixed path is the one shape Bun's
// --compile analyzer follows into the binary (the napi-generated computed loader
// that branches on platform/arch/libc is invisible to it). core.node is staged
// next to this file at build time.
// @ts-ignore - staged at build time; absent in the source tree
const nativeCore = require("./core.node");
(globalThis as any).__xydNativeCore = nativeCore;

// The Bun engine (XYD_BUN gate) is the only render path in the binary — the Vite
// path needs external node + toolchain. __xydCompiledBinary lets the engine take
// its in-process branch instead of spawning a bun child.
process.env.XYD_BUN ??= "1";
(globalThis as any).__xydCompiledBinary = true;

// Hidden self-check for the embedded Rust addon (S4.1): proves the .node is
// embedded + callable from a clean dir with node off PATH and the .node absent —
// independent of the full CLI graph (this runs before `./index` is imported).
if (process.argv.includes("__nativecheck")) {
  console.log("hello:", nativeCore.hello("xyd"));
  console.log("classify(docs.json):", nativeCore.classify("docs.json"));
  console.log("classify(content/x.md):", nativeCore.classify("content/x.md"));
  process.exit(0);
}
