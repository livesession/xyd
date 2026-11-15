/** The `react/jsx-dev-runtime` a federated user-components chunk gets from the
 *  registry (federationRegistry.ts). React's development build is used as it
 *  is. Its production build, which the prebuilt clients bundle, exports
 *  `jsxDEV` as undefined, so a chunk that calls it would throw on hydration and
 *  React would unmount the page. For that build, `jsxDEV` stands in for
 *  `jsx`/`jsxs` (its fourth argument says which). */
export function jsxDevRuntimeFor(devRuntime: any, runtime: any): any {
    if (typeof devRuntime?.jsxDEV === "function") return devRuntime;
    return {
        ...devRuntime,
        Fragment: devRuntime?.Fragment ?? runtime.Fragment,
        jsxDEV: (type: any, props: any, key?: any, isStaticChildren?: boolean) =>
            (isStaticChildren ? runtime.jsxs : runtime.jsx)(type, props, key),
    };
}
