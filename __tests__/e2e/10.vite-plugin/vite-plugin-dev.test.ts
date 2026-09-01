import path from "node:path";
import { expect, test } from "@playwright/test";

import { createViteDevServer, ViteDevServer } from "../utils/vite-build-server";

// One shared dev server per describe; fullyParallel would re-run beforeAll per
// worker and race on the shared monorepo .xyd/host in dev mode.
test.describe.configure({ mode: "serial" });

const FIXTURES = [
    { name: "plain vite", dir: "1.vite" },
    { name: "react-router", dir: "2.react-router" },
];

for (const fixture of FIXTURES) {
    test.describe(`vite-plugin dev — ${fixture.name} host`, () => {
        let server: ViteDevServer;

        test.beforeAll(async () => {
            test.setTimeout(15 * 60 * 1000);
            server = await createViteDevServer(path.join(__dirname, fixture.dir));
        });

        test.afterAll(async () => {
            await server?.stop();
        });

        test("host page renders on the shared origin", async ({ page }) => {
            await page.goto(server.getUrl("/"));
            await expect(page.locator("#host-marker")).toBeVisible();
        });

        test("docs pages render on the SAME port (proxied xyd dev)", async ({ page }) => {
            // generous timeout: the first request is gated until the spawned
            // `xyd dev` finishes its cold start (.xyd/host install)
            test.setTimeout(6 * 60 * 1000);
            await page.goto(server.getUrl("/docs/overview"), { timeout: 5 * 60 * 1000 });
            await expect(page.locator("h1").first()).toHaveText("Docs Overview");

            await page.goto(server.getUrl("/docs/quickstart"));
            await expect(page.locator("h1").first()).toHaveText("Quickstart");
        });

        test("xyd dev internals are proxied (styles, client bundle)", async ({ page }) => {
            const theme = await page.request.get(server.getUrl("/_xyd/theme.css"));
            expect(theme.status()).toBe(200);
            const client = await page.request.get(server.getUrl("/_bun/client.js"));
            expect(client.status()).toBe(200);
        });

        test("host dev module serving is unaffected by the proxy", async ({ page }) => {
            // a full host page load through the dev server exercises its own
            // module pipeline; no /docs or /_xyd path may shadow it
            const failures: string[] = [];
            page.on("response", (res) => {
                if (res.status() >= 500) failures.push(`${res.status()} ${res.url()}`);
            });
            await page.goto(server.getUrl("/"), { waitUntil: "networkidle" });
            await expect(page.locator("#host-marker")).toBeVisible();
            expect(failures).toEqual([]);
        });
    });
}
