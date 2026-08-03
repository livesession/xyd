// In-process Bun engine entry (S4.2). The standalone `launcher.ts` /
// `buildLauncher.ts` auto-RUN on import (for `bun launcher.ts` spawning); this
// module instead RE-EXPORTS the engine functions so the compiled binary — which
// IS bun and has no external bun to spawn — can call them in-process, gated on
// globalThis.__xydCompiledBinary in the CLI's dev/build commands.
export { startDevServer } from "./startDevServer";
export { buildStatic } from "./buildStatic";
