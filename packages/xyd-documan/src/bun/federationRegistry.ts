// Module-federation registry for project-local user components in the compiled
// node-free binary.
//
// The compiled binary has no on-disk framework source / node_modules, so a
// project's own components (sidebar `{ component }` items, MDX components) cannot
// be bundled into the same graph as React/@xyd-js the way the dev/vite path does.
// Instead we bundle them at `xyd build`/`dev` time as a SEPARATE chunk whose
// `react` / `@xyd-js/*` imports are rewritten to read this registry at runtime
// (see userComponentsFederation.ts). This module is imported by BOTH embedded
// bundles (the prebuilt multi-theme server entry and the per-theme client entry
// via bootClient), so the shared modules are bundled ONCE and exposed for the
// federated component chunk to consume — server via globalThis, browser via
// window (=== globalThis).
//
// Keep this list to the stable, client-safe surface a user component is likely to
// import. Subpath imports not listed here resolve to `{}` in the federated chunk;
// add them here (and they'll be bundled) if a real component needs them.

import * as React from "react";
import * as ReactJsxRuntime from "react/jsx-runtime";
// The unminified SERVER federated chunk emits jsxDEV (dev automatic runtime); the
// minified CLIENT chunk emits jsx/jsxs. Register BOTH real runtimes so either
// resolves regardless of how the chunk was built.
import * as ReactJsxDevRuntime from "react/jsx-dev-runtime";
import * as FrameworkReact from "@xyd-js/framework/react";
import * as Framework from "@xyd-js/framework";
import * as Components from "@xyd-js/components";

export function registerFederatedModules(): void {
    const g = globalThis as any;
    g.__xydModules = Object.assign(g.__xydModules || {}, {
        "react": React,
        "react/jsx-runtime": ReactJsxRuntime,
        "react/jsx-dev-runtime": ReactJsxDevRuntime,
        "@xyd-js/framework/react": FrameworkReact,
        "@xyd-js/framework": Framework,
        "@xyd-js/components": Components,
    });
}
