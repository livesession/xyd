import path from "node:path";
import { expect, test } from "@playwright/test";

import { createViteBuildServer, ViteBuildServer } from "../utils/vite-build-server";

// One shared build+server per file; fullyParallel would re-run beforeAll per
// worker and race on the shared monorepo .xyd/host in dev mode.
test.describe.configure({ mode: "serial" });

test.describe("vite-plugin — react-router 7 host (ssr + prerender)", () => {
    let server: ViteBuildServer;

    test.beforeAll(async () => {
        test.setTimeout(15 * 60 * 1000); // the docs build inside `react-router build` is heavy
        server = await createViteBuildServer(path.join(__dirname, "2.react-router"), { outDir: "build/client" });
    });

    test.afterAll(async () => {
        await server?.stop();
    });

    test("host page renders, hydrates, and its client bundle still executes", async ({ page }) => {
        await page.goto(server.getUrl("/"));
        await expect(page.locator("#host-marker")).toHaveText("Host RR App");
        // hydration proof: the client bundle in the shared assets/ dir loaded + ran
        await expect(page.locator("#host-marker")).toHaveAttribute("data-hydrated", "true");
    });

    test("merged docs pages render under /docs", async ({ page }) => {
        await page.goto(server.getUrl("/docs/overview"));
        await expect(page.locator("h1").first()).toHaveText("Docs Overview");

        await page.goto(server.getUrl("/docs/quickstart"));
        await expect(page.locator("h1").first()).toHaveText("Quickstart");
    });

    test("docs assets resolve from the merged root assets/ dir", async ({ page }) => {
        const notFound: string[] = [];
        page.on("response", (res) => {
            if (res.status() === 404 && new URL(res.url()).pathname.startsWith("/assets/")) {
                notFound.push(res.url());
            }
        });
        await page.goto(server.getUrl("/docs/overview"), { waitUntil: "networkidle" });
        expect(notFound).toEqual([]);

        const cssHrefs = await page.$$eval('link[rel="stylesheet"]', (links) =>
            links.map((l) => l.getAttribute("href")).filter((h): h is string => !!h && h.startsWith("/assets/"))
        );
        expect(cssHrefs.length).toBeGreaterThan(0);
        const res = await page.request.get(server.getUrl(cssHrefs[0]));
        expect(res.status()).toBe(200);
    });

    test("docs public assets are reachable under the mount path", async ({ page }) => {
        // NOTE: only the basename form is asserted — the vite engine nests public/
        // under the basename, while the bun engine ALSO mirrors it at the root.
        // The merge carries whichever shape the docs build produced.
        const viaBasename = await page.request.get(server.getUrl("/docs/public/sample.txt"));
        expect(viaBasename.status()).toBe(200);
        expect(await viaBasename.text()).toContain("docs-public-ok");
    });
});
