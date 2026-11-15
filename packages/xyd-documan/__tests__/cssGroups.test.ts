import { describe, expect, it } from "vitest";

import { CSS_GROUP_ORDER, cssGroupSources, devCssLinksHtml, resolveCssGroups } from "../src/bun/cssGroups";

describe("the bun engine's stylesheet groups", () => {
    it("link the theme last, after the shared groups it bundles", () => {
        expect(CSS_GROUP_ORDER).toEqual(["components", "atlas", "ui", "theme"]);
    });

    it("resolve in that order, through the package export first and then the package's dist file", () => {
        const exported = new Set(["@xyd-js/components/index.css", "@xyd-js/atlas/index.css", "@acme/theme/index.css"]);
        const groups = resolveCssGroups(
            "@acme/theme",
            (spec) => (exported.has(spec) ? `/export/${spec}` : null),
            (pkg, file) => (pkg === "@xyd-js/ui" ? null : `/pkg/${pkg}/${file}`)
        );

        expect(groups.map(([label]) => label)).toEqual([...CSS_GROUP_ORDER]);
        expect(Object.fromEntries(groups)).toEqual({
            components: ["/export/@xyd-js/components/index.css"],
            atlas: [
                "/export/@xyd-js/atlas/index.css",
                "/pkg/@xyd-js/atlas/dist/tokens.css",
                "/pkg/@xyd-js/atlas/dist/styles.css",
            ],
            ui: [null],
            theme: ["/export/@acme/theme/index.css"],
        });
    });

    it("name the theme's own package", () => {
        expect(cssGroupSources("@xyd-js/theme-gusto").theme).toEqual([
            { spec: "@xyd-js/theme-gusto/index.css", pkg: "@xyd-js/theme-gusto", file: "dist/index.css" },
        ]);
    });

    it("give the dev page shell one link per group, in the same order", () => {
        const hrefs = [...devCssLinksHtml().matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
        expect(hrefs).toEqual(["/_xyd/components.css", "/_xyd/atlas.css", "/_xyd/ui.css", "/_xyd/theme.css"]);
    });
});
