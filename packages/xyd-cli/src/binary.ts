// The `bun build --compile` entry for the self-contained `xyd` binary (S4).
//
// Unlike the node CLI (index.ts → dist/index.js), this runs INSIDE a Bun
// standalone executable: the whole Bun runtime (incl. Bun.build/Bun.serve) is
// embedded, so dev/build call the Bun engine in-process instead of spawning an
// external bun/node child.
//
// Import order is load-bearing and every edge is STATIC (no `import()`):
//   1) ./native-boot     — embeds the Rust core + handles __nativecheck (may exit).
//   2) ./embed.generated — the S4.3 prebuilt render bundles. Its `with {type:"file"}`
//      imports are followed by --compile ONLY across a static edge (same rule that
//      embeds core.node), physically baking the client/server/css into the exe and
//      setting globalThis.__xydEmbed before any build command runs. Empty stub in a
//      normal build; the prebuild overwrites it before `bun scripts/compile.ts`.
//   3) ./index           — the CLI graph. A static edge makes --compile pull its
//      whole transitive graph (incl. CJS deps like gray-matter) INTO the executable.
import "./native-boot";
import "./embed.generated";
import { cli } from "./index";

cli().then(
  () => process.exit(0),
  (e: any) => {
    if (e) console.error(e);
    process.exit(1);
  }
);
