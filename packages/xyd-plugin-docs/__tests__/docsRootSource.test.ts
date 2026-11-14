import path from "node:path";

import { describe, expect, it } from "vitest";

import { docsRootSource } from "../src/presets/uniform";

// The source a generated page names in its frontmatter is published with the
// page (its HTML payload and its `.md` twin): it must never be the build
// machine's absolute path, only the docs-root-relative `~/` form the page step
// expands back against the docs root.
describe("docsRootSource", () => {
    const ROOT = path.resolve("/work/site");

    it("writes a local source relative to the docs root, in the ~/ notation", () => {
        expect(docsRootSource("./acme.opencli.json", ROOT)).toBe("~/acme.opencli.json");
        expect(docsRootSource("acme.opencli.json", ROOT)).toBe("~/acme.opencli.json");
        expect(docsRootSource("specs/cli/acme.opencli.json", ROOT)).toBe("~/specs/cli/acme.opencli.json");
        expect(docsRootSource(path.join(ROOT, "specs", "acme.opencli.json"), ROOT)).toBe("~/specs/acme.opencli.json");
    });

    it("keeps a source outside the docs root relative to it", () => {
        expect(docsRootSource("../shared/acme.opencli.json", ROOT)).toBe("~/../shared/acme.opencli.json");
    });

    it("never carries the docs root itself", () => {
        for (const source of ["./acme.opencli.json", path.join(ROOT, "acme.opencli.json"), "../shared/acme.opencli.json"]) {
            expect(docsRootSource(source, ROOT)).not.toContain(ROOT);
            expect(path.isAbsolute(docsRootSource(source, ROOT).slice(2))).toBe(false);
        }
    });

    it("keeps a URL as is", () => {
        expect(docsRootSource("https://example.com/acme.opencli.json", ROOT)).toBe("https://example.com/acme.opencli.json");
        expect(docsRootSource("HTTP://example.com/acme.opencli.json", ROOT)).toBe("HTTP://example.com/acme.opencli.json");
    });
});
