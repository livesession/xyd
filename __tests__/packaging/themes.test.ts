// Packs every built-in theme the way a release publishes it (`npm pack`),
// unpacks the tarball into a node_modules of its own and resolves the entry the
// bundler imports — the "." export (and the CSS export) must be files in the
// tarball. Needs the themes built (`pnpm build`); a theme without a dist skips.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterAll, describe, expect, it } from "vitest";

const PACKAGES = path.resolve(__dirname, "../../packages");
const THEMES = readdirSync(PACKAGES).filter((name) => /^xyd-theme-[a-z]+$/.test(name));
const work = mkdtempSync(path.join(tmpdir(), "xyd-theme-pack-"));

afterAll(() => {
    rmSync(work, { recursive: true, force: true });
});

/** The file an import of `subpath` resolves to through `exports` (import condition). */
function exportTarget(exports: unknown, subpath: string): string | undefined {
    const entry = exports && typeof exports === "object" ? (exports as Record<string, unknown>)[subpath] : undefined;
    if (typeof entry === "string") return entry;
    if (entry && typeof entry === "object") {
        const conditions = entry as Record<string, unknown>;
        for (const condition of ["import", "module", "default"]) {
            if (typeof conditions[condition] === "string") return conditions[condition] as string;
        }
    }
    return undefined;
}

describe("built-in themes, as published", () => {
    it("finds the themes", () => {
        expect(THEMES.length).toBeGreaterThan(0);
    });

    for (const theme of THEMES) {
        const dir = path.join(PACKAGES, theme);
        const built = existsSync(path.join(dir, "dist", "index.js"));

        it.skipIf(!built)(`${theme}: the packed tarball resolves its entry`, () => {
            const out = path.join(work, theme);
            mkdirSync(out, { recursive: true });
            const [packed] = JSON.parse(
                execFileSync("npm", ["pack", "--json", "--ignore-scripts", "--pack-destination", out], {
                    cwd: dir,
                    encoding: "utf8",
                    stdio: ["ignore", "pipe", "ignore"],
                })
            );
            const manifest = JSON.parse(readFileSync(path.join(dir, "package.json"), "utf8"));
            const installed = path.join(out, "node_modules", ...manifest.name.split("/"));
            mkdirSync(installed, { recursive: true });
            execFileSync("tar", ["-xzf", path.join(out, packed.filename), "-C", installed, "--strip-components=1"]);

            const unpacked = JSON.parse(readFileSync(path.join(installed, "package.json"), "utf8"));
            const entry = exportTarget(unpacked.exports, ".") ?? unpacked.module ?? unpacked.main;
            expect(entry, `${manifest.name} names no entry`).toBeTruthy();
            expect(existsSync(path.join(installed, entry)), `${manifest.name}: ${entry} is not in the tarball`).toBe(true);

            const css = exportTarget(unpacked.exports, "./index.css");
            if (css) {
                expect(existsSync(path.join(installed, css)), `${manifest.name}: ${css} is not in the tarball`).toBe(true);
            }
        }, 60_000);
    }
});
