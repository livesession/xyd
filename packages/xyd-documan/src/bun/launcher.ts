import { startDevServer } from "./startDevServer";

/**
 * Standalone entry for the Bun dev server (S1). Kept as a thin shim so
 *   cd <docs-project> && XYD_DEV_MODE=1 bun <repo>/packages/xyd-documan/src/bun/launcher.ts
 * still works; the real logic lives in `startDevServer`, which the CLI's `dev`
 * command (behind XYD_BUN) also calls.
 */
await startDevServer(process.cwd());
