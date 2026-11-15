import { describe, expect, it } from "vitest";

import { trailingSlashTarget } from "@xyd-js/core";

import { notFoundPageHtml, trailingSlashScript } from "../src/bun/trailingSlash";

// Runs the inline script against a fake address and returns where it sent the
// browser (null when it stayed).
function runScript(script: string, href: string): string | null {
    const url = new URL(href);
    let replaced: string | null = null;
    const location = {
        pathname: url.pathname,
        search: url.search,
        hash: url.hash,
        replace: (to: string) => {
            replaced = to;
        },
    };
    new Function("location", script)(location);
    return replaced;
}

describe("the not-found page's script", () => {
    it("moves a trailing-slash address on to the page, query and fragment kept", () => {
        const script = trailingSlashScript();
        expect(runScript(script, "https://example.com/cli/deploy/")).toBe("/cli/deploy");
        expect(runScript(script, "https://example.com/cli/deploy/?tab=1#options")).toBe("/cli/deploy?tab=1#options");
    });

    it("follows the same rule as the dev server", () => {
        for (const [basename, pathnames] of [
            ["", ["/", "/cli/deploy/", "/cli/deploy", "//example.com/", "/a//b//"]],
            ["/docs", ["/docs/", "/docs/cli/deploy/", "/docs", "/other/"]],
        ] as const) {
            const script = trailingSlashScript(basename);
            for (const pathname of pathnames) {
                expect(runScript(script, "https://example.com" + pathname), `${basename} ${pathname}`).toBe(
                    trailingSlashTarget(pathname, basename)
                );
            }
        }
    });

    it("is in the page, which links home under the basename", () => {
        const html = notFoundPageHtml("/docs");
        expect(html).toContain(`<script>${trailingSlashScript("/docs")}</script>`);
        expect(html).toContain('<a href="/docs/">');
        expect(html).toContain('<meta name="robots" content="noindex">');
        expect(notFoundPageHtml()).toContain('<a href="/">');
    });
});
