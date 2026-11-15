import { describe, expect, it } from "vitest";

import { trailingSlashTarget } from "../src/trailingSlash";

describe("trailingSlashTarget", () => {
    it("names the page behind a trailing slash", () => {
        expect(trailingSlashTarget("/cli/deploy/")).toBe("/cli/deploy");
        expect(trailingSlashTarget("/cli/project/list/")).toBe("/cli/project/list");
        expect(trailingSlashTarget("/cli/deploy///")).toBe("/cli/deploy");
    });

    it("leaves a path without a trailing slash alone", () => {
        expect(trailingSlashTarget("/cli/deploy")).toBeNull();
        expect(trailingSlashTarget("/llms.txt")).toBeNull();
    });

    it("keeps the root and the basename's root, which are pages of their own", () => {
        expect(trailingSlashTarget("/")).toBeNull();
        expect(trailingSlashTarget("//")).toBeNull();
        for (const basename of ["/docs", "docs", "/docs/"]) {
            expect(trailingSlashTarget("/docs/", basename), basename).toBeNull();
            expect(trailingSlashTarget("/docs/cli/deploy/", basename), basename).toBe("/docs/cli/deploy");
        }
    });

    it("never returns a protocol-relative URL", () => {
        expect(trailingSlashTarget("//example.com/")).toBe("/example.com");
        expect(trailingSlashTarget("///example.com/path/")).toBe("/example.com/path");
    });
});
