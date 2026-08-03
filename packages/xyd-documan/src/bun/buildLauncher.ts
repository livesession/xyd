import { buildStatic } from "./buildStatic";

/**
 * Standalone entry for the Bun static build (S3). Mirrors launcher.ts. The CLI's
 * `build` command (behind XYD_BUN) spawns `bun` on this via the
 * `@xyd-js/documan/bun-build-launcher` export.
 */
await buildStatic(process.cwd());
