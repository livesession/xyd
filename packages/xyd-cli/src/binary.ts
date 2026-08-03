// The `bun build --compile` entry for the self-contained `xyd` binary (S4).
//
// Unlike the node CLI (index.ts → dist/index.js), this runs INSIDE a Bun
// standalone executable: the whole Bun runtime (incl. Bun.build/Bun.serve) is
// embedded, so dev/build call the Bun engine in-process instead of spawning an
// external bun/node child.
//
// Import order is load-bearing and both edges are STATIC (no `import()`):
//   1) ./native-boot — embeds the Rust core + handles __nativecheck (may exit).
//   2) ./index       — the CLI graph. A static edge is what makes --compile pull
//      its whole transitive graph (incl. CJS deps like gray-matter) INTO the
//      executable; a dynamic import left them resolving at runtime and failing.
import "./native-boot";
import { cli } from "./index";

cli().then(
  () => process.exit(0),
  (e: any) => {
    if (e) console.error(e);
    process.exit(1);
  }
);
