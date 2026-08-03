// The `bun build --compile` entry for the self-contained `xyd` binary (S4).
//
// Unlike the node CLI (index.ts → dist/index.js), this runs INSIDE a Bun
// standalone executable: the whole Bun runtime (incl. Bun.build/Bun.serve) is
// embedded, so dev/build call the Bun engine in-process instead of spawning an
// external bun/node child.

// This file is compiled ONLY by `bun scripts/compile.ts` (Bun runtime: Bun
// global, top-level await, ESM). It is NOT a tsup entry. `export {}` makes it a
// module so top-level await typechecks; `declare const Bun` covers the global
// without pulling @types/bun into the node build.
export {};
declare const Bun: any;

// 1) Embed the Rust addon. A LITERAL require of a fixed path is the one shape
//    Bun's --compile analyzer follows into the binary (the NAPI-generated
//    computed loader that branches on platform/arch/libc is invisible to it).
//    core.node is staged next to this file at build time.
// @ts-ignore - staged at build time; absent in the source tree
const nativeCore = require("./core.node");
(globalThis as any).__xydNativeCore = nativeCore;

// 2) Mark the compiled engine path on: the Bun engine (XYD_BUN gate) is the only
//    render path in the binary (the Vite path needs external node + toolchain).
process.env.XYD_BUN ??= "1";
(globalThis as any).__xydCompiledBinary = true;

// Hidden self-check for the embedded Rust addon (S4.1): proves the .node is
// embedded + callable from a clean dir with node off PATH and the .node absent —
// independent of the full CLI graph (cli is imported lazily below).
if (process.argv.includes("__nativecheck")) {
  console.log("isStandaloneExecutable:", (Bun as any).isStandaloneExecutable);
  console.log("hello:", nativeCore.hello("xyd"));
  console.log("classify(docs.json):", nativeCore.classify("docs.json"));
  console.log("classify(content/x.md):", nativeCore.classify("content/x.md"));
  process.exit(0);
}

// 3) Boot the CLI (lazy import so __nativecheck doesn't need the CLI graph).
const { cli } = await import("./index");
cli().then(
  () => process.exit(0),
  (e: any) => {
    if (e) console.error(e);
    process.exit(1);
  }
);
