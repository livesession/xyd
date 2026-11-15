import { describe, expect, it } from "vitest";

import { trailingSlashRouteTarget, trailingSlashTarget } from "../src/trailingSlash";

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

describe("trailingSlashRouteTarget", () => {
    it("names the page inside the site, without the basename a router adds itself", () => {
        for (const basename of ["/docs", "docs", "/docs/"]) {
            expect(trailingSlashRouteTarget("/docs/cli/deploy/", basename), basename).toBe("/cli/deploy");
            expect(trailingSlashRouteTarget("/docs/cli/project/list//", basename), basename).toBe("/cli/project/list");
            expect(trailingSlashRouteTarget("/docs/", basename), basename).toBeNull();
            expect(trailingSlashRouteTarget("/docs/cli/deploy", basename), basename).toBeNull();
        }
    });

    it("is trailingSlashTarget without a basename", () => {
        for (const pathname of ["/cli/deploy/", "/", "/cli/deploy", "//example.com/"]) {
            expect(trailingSlashRouteTarget(pathname), pathname).toBe(trailingSlashTarget(pathname));
            expect(trailingSlashRouteTarget(pathname, "/"), pathname).toBe(trailingSlashTarget(pathname, "/"));
        }
    });

    it("keeps a path that only starts like the basename", () => {
        expect(trailingSlashRouteTarget("/docsite/page/", "/docs")).toBe("/docsite/page");
    });
});
