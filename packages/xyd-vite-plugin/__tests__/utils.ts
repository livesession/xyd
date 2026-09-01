import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { expect } from "vitest";

import { mergeDocsBuild, MergeOptions } from "../src/merge";

const FIXTURES = path.join(__dirname, "..", "__fixtures__");

/** Deterministic recursive listing: `relpath :: content` per file, sorted. */
function listTree(root: string): string {
    const lines: string[] = [];
    const walk = (dir: string) => {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            const abs = path.join(dir, entry.name);
            if (entry.isDirectory()) walk(abs);
            else {
                const rel = path.relative(root, abs).split(path.sep).join("/");
                lines.push(`${rel} :: ${fs.readFileSync(abs, "utf-8").trim()}`);
            }
        }
    };
    walk(root);
    return lines.sort().join("\n") + "\n";
}

/**
 * Data-driven fixture runner (repo convention): copy input/host-out to a scratch
 * dir, run mergeDocsBuild against input/docs-client, then either
 *  - error.txt exists  -> assert the merge throws with that substring, or
 *  - regenerate output.txt (snapshot) and compare against the previous content.
 */
export function testMerge(name: string) {
    const fixture = path.join(FIXTURES, name);
    const docsClient = path.join(fixture, "input", "docs-client");
    const hostOut = path.join(fixture, "input", "host-out");

    const optionsPath = path.join(fixture, "options.json");
    const fileOptions = fs.existsSync(optionsPath) ? JSON.parse(fs.readFileSync(optionsPath, "utf-8")) : {};
    const options: MergeOptions = { sitemap: "skip", robots: "skip", ...fileOptions };

    const scratch = fs.mkdtempSync(path.join(os.tmpdir(), `xyd-vite-plugin-${name.replace(/[^a-z0-9]/gi, "_")}-`));
    try {
        fs.cpSync(hostOut, scratch, { recursive: true });

        const errorPath = path.join(fixture, "error.txt");
        if (fs.existsSync(errorPath)) {
            const expected = fs.readFileSync(errorPath, "utf-8").trim();
            expect(() => mergeDocsBuild(docsClient, scratch, options)).toThrowError(
                expect.objectContaining({ message: expect.stringContaining(expected) })
            );
            return;
        }

        mergeDocsBuild(docsClient, scratch, options);

        const actual = listTree(scratch);
        const outputPath = path.join(fixture, "output.txt");
        const previous = fs.existsSync(outputPath) ? fs.readFileSync(outputPath, "utf-8") : null;
        fs.writeFileSync(outputPath, actual); // snapshot regeneration
        if (previous !== null) {
            expect(actual).toBe(previous);
        }
    } finally {
        fs.rmSync(scratch, { recursive: true, force: true });
    }
}
