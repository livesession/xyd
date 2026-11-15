import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// The self-contained binary's prebuild (packages/xyd-cli/scripts/compile.ts)
// bundles the render with the repository root as its resolve base: makeShims
// resolves every `@xyd-js/*` import with `Bun.resolveSync(spec, root)`. So the
// copy the root node_modules links is the copy the binary ships. When it is not
// the one documan depends on (a published copy hoisted there for another
// package's tests), the binary compiles stale code, or fails to compile once the
// render imports an export the stale copy lacks.

const DOCUMAN = path.resolve(__dirname, "..");
const ROOT = path.resolve(DOCUMAN, "../..");

function workspaceDependencies(): string[] {
    const pkg = JSON.parse(fs.readFileSync(path.join(DOCUMAN, "package.json"), "utf8"));
    return Object.entries<string>(pkg.dependencies || {})
        .filter(([name, spec]) => name.startsWith("@xyd-js/") && spec.startsWith("workspace:"))
        .map(([name]) => name);
}

describe("the repository root resolves documan's own @xyd-js packages", () => {
    const names = workspaceDependencies();

    it("documan has workspace dependencies to check", () => {
        expect(names).toContain("@xyd-js/core");
    });

    it.each(names)("%s at the root is the copy documan links", (name) => {
        const own = path.join(DOCUMAN, "node_modules", name);
        const atRoot = path.join(ROOT, "node_modules", name);
        // Not installed (or not hoisted) here: the bundler falls back to the
        // importer's own resolution, which is documan's.
        if (!fs.existsSync(own) || !fs.existsSync(atRoot)) return;
        expect(fs.realpathSync(atRoot)).toBe(fs.realpathSync(own));
    });
});
