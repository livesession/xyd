// Custom sidebar-item components (`{ component: "./path" }`) — bun parity with the
// Vite `virtual:xyd-user-components` path. At bundle time we read the paths collected
// by appInit (globalThis.__xydSidebarComponentPaths — with ABSOLUTE import paths, since
// this entry is emitted into documan's dir, not the docs project) and generate ESM
// that statically imports each component and registers it on
// globalThis.__xydSidebarComponents keyed by the config path string. The shared render
// tree merges that into the Framework component map so `FwSidebarComponent` resolves
// it via `useComponents()`. Returns "" when a project has no such components (common
// case) → the bundle entries stay byte-identical.

export function sidebarComponentsEntrySrc(): string {
    const items: { path: string; importPath: string }[] =
        (globalThis as any).__xydSidebarComponentPaths || [];
    if (!items.length) return "";

    const imports: string[] = [];
    const reg: string[] = [];
    items.forEach((it, i) => {
        if (!it?.path || !it?.importPath) return;
        imports.push(`import __SC${i} from ${JSON.stringify(it.importPath)};`);
        reg.push(`${JSON.stringify(it.path)}: __SC${i}`);
    });
    if (!reg.length) return "";

    return imports.join("\n") + `\nglobalThis.__xydSidebarComponents = { ${reg.join(", ")} };\n`;
}
