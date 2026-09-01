import path from "node:path";
import { expect, test } from "@playwright/test";

import { CompatServer } from "../utils/compat-server";

// @xyd-js/next-plugin: `next build` merges the docs into public/ (+ afterFiles
// rewrites for extensionless URLs, honored by `next start`); `next dev` spawns
// `xyd dev` and proxies the mount via rewrites — app and docs on one origin.
test.describe.configure({ mode: "serial" });

const FIXTURE = {
    dir: path.join(__dirname, "1.next-latest"),
    build: { serveScript: "start" },
    dev: { portEnvVar: "PORT" },
};

test.describe("next-plugin — build + start", () => {
    let server: CompatServer;

    test.beforeAll(async () => {
        test.setTimeout(20 * 60 * 1000);
        server = new CompatServer(FIXTURE);
        await server.startBuild();
    });

    test.afterAll(async () => {
        await server?.stop();
    });

    test("host page renders", async ({ page }) => {
        await page.goto(server.getUrl("/"));
        await expect(page.locator("#host-marker")).toHaveText("Host Next App");
    });

    test("docs pages render under /docs (incl. the bare mount)", async ({ page }) => {
        await page.goto(server.getUrl("/docs/overview"));
        await expect(page.locator("h1").first()).toHaveText("Docs Overview");

        await page.goto(server.getUrl("/docs/quickstart"));
        await expect(page.locator("h1").first()).toHaveText("Quickstart");

        // bare mount → the docs index page via the afterFiles rewrite
        await page.goto(server.getUrl("/docs"));
        await expect(page.locator("h1").first()).toHaveText("Docs Home");
    });

    test("docs assets + public files resolve", async ({ page }) => {
        const notFound: string[] = [];
        page.on("response", (res) => {
            if (res.status() === 404 && new URL(res.url()).pathname.startsWith("/assets/")) {
                notFound.push(res.url());
            }
        });
        await page.goto(server.getUrl("/docs/overview"), { waitUntil: "networkidle" });
        expect(notFound).toEqual([]);

        const pub = await page.request.get(server.getUrl("/docs/public/sample.txt"));
        expect(pub.status()).toBe(200);
        const hostPub = await page.request.get(server.getUrl("/host-public.txt"));
        expect(hostPub.status()).toBe(200);
    });
});

test.describe("next-plugin — dev", () => {
    let server: CompatServer;

    test.beforeAll(async () => {
        test.setTimeout(20 * 60 * 1000);
        server = new CompatServer(FIXTURE);
        await server.startDev();
    });

    test.afterAll(async () => {
        await server?.stop();
    });

    test("host + docs share one origin in dev", async ({ page }) => {
        test.setTimeout(6 * 60 * 1000);
        await page.goto(server.getUrl("/"));
        await expect(page.locator("#host-marker")).toHaveText("Host Next App");

        // no gate middleware in Next — poll until the spawned xyd dev is warm
        await expect
            .poll(async () => (await page.request.get(server.getUrl("/docs/overview"))).status(), {
                timeout: 5 * 60 * 1000,
            })
            .toBe(200);

        await page.goto(server.getUrl("/docs/overview"));
        await expect(page.locator("h1").first()).toHaveText("Docs Overview");

        const theme = await page.request.get(server.getUrl("/_xyd/theme.css"));
        expect(theme.status()).toBe(200);
    });
});
