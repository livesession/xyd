import { describe, expect, it } from "vitest";

import { llmsTxtLinkUrl } from "../src/llmsTxtLinks";

describe("llmsTxtLinkUrl", () => {
    it("keeps the page path when the site has no basename and no baseUrl", () => {
        expect(llmsTxtLinkUrl("/cli/init.md")).toBe("/cli/init.md");
        expect(llmsTxtLinkUrl("/cli/init.md", "", "")).toBe("/cli/init.md");
        expect(llmsTxtLinkUrl("/cli/init.md", "/")).toBe("/cli/init.md");
    });

    it("prefixes the basename, however it is written", () => {
        for (const basename of ["/docs", "/docs/", "docs", "docs/"]) {
            expect(llmsTxtLinkUrl("/cli/init.md", basename), basename).toBe("/docs/cli/init.md");
        }
        expect(llmsTxtLinkUrl("/cli/init.md", "/reference/v2")).toBe("/reference/v2/cli/init.md");
    });

    it("puts the baseUrl (the origin) in front of the basename", () => {
        expect(llmsTxtLinkUrl("/cli/init.md", undefined, "https://docs.example.com")).toBe("https://docs.example.com/cli/init.md");
        expect(llmsTxtLinkUrl("/cli/init.md", undefined, "https://docs.example.com/")).toBe("https://docs.example.com/cli/init.md");
        expect(llmsTxtLinkUrl("/cli/init.md", "/docs", "https://example.com")).toBe("https://example.com/docs/cli/init.md");
    });

    it("does not repeat a basename the baseUrl already ends with", () => {
        expect(llmsTxtLinkUrl("/cli/init.md", "/docs", "https://example.com/docs")).toBe("https://example.com/docs/cli/init.md");
        expect(llmsTxtLinkUrl("/cli/init.md", "/docs", "https://example.com/docs/")).toBe("https://example.com/docs/cli/init.md");
        // a host that happens to be named like the basename is still an origin
        expect(llmsTxtLinkUrl("/cli/init.md", "/docs", "https://docs")).toBe("https://docs/docs/cli/init.md");
    });

    it("keeps an absolute page URL as is", () => {
        expect(llmsTxtLinkUrl("https://example.com/x.md", "/docs", "https://acme.dev")).toBe("https://example.com/x.md");
    });
});
