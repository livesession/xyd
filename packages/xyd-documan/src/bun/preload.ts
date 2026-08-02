import { plugin } from "bun";
import * as path from "node:path";

/**
 * Bun runtime plugins for the S1 dev server. Loaded via
 * `bun --preload ./preload.ts` so it runs BEFORE the first react-router / react
 * / @xyd-js / .css import in the render graph.
 *
 * - Alias `react-router(-dom)` → the local shim (no RR at runtime).
 * - Resolve `react`/`react-dom`/`@xyd-js/*` from the on-disk host tree
 *   (`.xyd/host`) so the render, the theme, and the framework all share ONE
 *   react instance (React context requires it). appInit-only packages that the
 *   host tree lacks (plugin-docs, uniform) fall through to default resolution.
 * - Stub `.css` side-effect imports to an empty module; real CSS is served as <link>.
 */
const HOST =
  process.env.XYD_HOST || path.resolve(import.meta.dir, "../../../../.xyd/host");

plugin({
  name: "xyd-render-shims",
  setup(b) {
    b.onResolve({ filter: /^react-router(-dom)?$/ }, () => ({
      path: import.meta.dir + "/rr-shim.tsx",
    }));

    b.onResolve({ filter: /^(react$|react\/|react-dom$|react-dom\/|@xyd-js\/)/ }, (args) => {
      try {
        return { path: Bun.resolveSync(args.path, HOST) };
      } catch {
        return undefined; // e.g. @xyd-js/plugin-docs, @xyd-js/uniform → documan tree
      }
    });

    b.onLoad({ filter: /\.css(\?.*)?$/ }, () => ({
      contents: "export default {};",
      loader: "js",
    }));
  },
});
