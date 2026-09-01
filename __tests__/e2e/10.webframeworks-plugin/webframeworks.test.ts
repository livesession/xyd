import path from "node:path";
import { expect, test } from "@playwright/test";

import { CompatServer, CompatFixture } from "../utils/compat-server";

// Web-framework matrix for the xyd embed plugins (@xyd-js/vite-plugin +
// @xyd-js/next-plugin): every fixture is a small BRANDED site (framework logo,
// header with a /docs link) with xyd docs mounted at /docs — tested in BUILD
// (dist served the fixture's own way) and DEV (spawned `xyd dev`, one origin).
//
// Naming: <group>.<n>.<framework>.<variant>. Most fixtures pin their own exact
// dep versions (npm-installed on first run); the *-workspace variants are
// dependency-less and resolve everything through the monorepo's shamefully-
// hoisted root node_modules — covering the OLDER hoisted versions (vite 7.3,
// react-router 7.15).
//
// Dev runs BEFORE build per fixture, so a full run leaves every fixture's build
// output on disk for inspection. Rebuild all outputs: pnpm test:e2e:frameworks:build
test.describe.configure({ mode: "serial" });

interface Matrix extends CompatFixture {
    name: string;
    hostMarker: string;
}

const MATRIX: Matrix[] = [
    {
        name: "1.1 vite — vanilla (pinned latest)",
        dir: path.join(__dirname, "1.1.vite.vanilla-latest"),
        hostMarker: "Host Vanilla App",
        build: { outDir: "dist" },
        dev: {},
    },
    {
        name: "1.2 vite — vanilla (workspace-hoisted vite 7)",
        dir: path.join(__dirname, "1.2.vite.vanilla-workspace"),
        hostMarker: "Host Vite App",
        build: { outDir: "dist" },
        dev: {},
    },
    {
        name: "1.3 vite — SSR guide, custom express server",
        dir: path.join(__dirname, "1.3.vite.ssr-vanilla"),
        hostMarker: "Host SSR Vanilla App",
        build: { serveScript: "preview", serveEnv: { NODE_ENV: "production" } },
        dev: { portEnvVar: "PORT" },
    },
    {
        name: "2.1 nextjs — latest (@xyd-js/next-plugin)",
        dir: path.join(__dirname, "2.1.nextjs.latest"),
        hostMarker: "Host Next App",
        build: { serveScript: "start" },
        dev: { portEnvVar: "PORT" },
    },
    {
        name: "3.1 react-router — latest (ssr + prerender)",
        dir: path.join(__dirname, "3.1.react-router.latest"),
        hostMarker: "Host RR App",
        build: { outDir: "build/client" },
        dev: {},
    },
    {
        name: "3.2 react-router — latest on vite 7",
        dir: path.join(__dirname, "3.2.react-router.vite7"),
        hostMarker: "Host RR App",
        build: { outDir: "build/client" },
        dev: {},
    },
    {
        name: "3.3 react-router — v7 (workspace-hoisted)",
        dir: path.join(__dirname, "3.3.react-router.v7-workspace"),
        hostMarker: "Host RR App",
        build: { outDir: "build/client" },
        dev: {},
    },
    {
        name: "4.1 vue — SPA",
        dir: path.join(__dirname, "4.1.vue.spa"),
        hostMarker: "Host Vue SPA App",
        build: { outDir: "dist" },
        dev: {},
    },
    {
        name: "4.2 vue — SSR guide, custom express server",
        dir: path.join(__dirname, "4.2.vue.ssr"),
        hostMarker: "Host SSR Vue App",
        build: { serveScript: "preview", serveEnv: { NODE_ENV: "production" } },
        dev: { portEnvVar: "PORT" },
    },
    {
        name: "5.1 nuxt — generate",
        dir: path.join(__dirname, "5.1.nuxt.latest"),
        hostMarker: "Host Nuxt App",
        build: { outDir: ".output/public" },
        dev: { portEnvVar: "PORT" },
    },
    {
        name: "6.1 astro — static",
        dir: path.join(__dirname, "6.1.astro.latest"),
        hostMarker: "Host Astro App",
        build: { outDir: "dist" },
        dev: {},
    },
    {
        name: "7.1 sveltekit — adapter-static",
        dir: path.join(__dirname, "7.1.sveltekit.latest"),
        hostMarker: "Host SvelteKit App",
        build: { outDir: "build" },
        dev: {},
    },
    {
        name: "8.1 solid — SPA",
        dir: path.join(__dirname, "8.1.solid.latest"),
        hostMarker: "Host Solid App",
        build: { outDir: "dist" },
        dev: {},
    },
];

for (const fixture of MATRIX) {
    test.describe(`webframeworks dev — ${fixture.name}`, () => {
        let server: CompatServer;

        test.beforeAll(async () => {
            test.setTimeout(20 * 60 * 1000);
            server = new CompatServer(fixture);
            await server.startDev();
        });

        test.afterAll(async () => {
            await server?.stop();
        });

        test("host + docs share one origin in dev", async ({ page }) => {
            test.setTimeout(6 * 60 * 1000);
            await page.goto(server.getUrl("/"));
            await expect(page.locator("#host-marker")).toHaveText(fixture.hostMarker);

            // poll until the spawned xyd dev is warm — covers hosts with a
            // readiness gate (vite family) AND without one (next rewrites)
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

    test.describe(`webframeworks build — ${fixture.name}`, () => {
        let server: CompatServer;

        test.beforeAll(async () => {
            test.setTimeout(20 * 60 * 1000); // first run npm-installs the fixture + builds docs
            server = new CompatServer(fixture);
            await server.startBuild();
        });

        test.afterAll(async () => {
            await server?.stop();
        });

        test("host page renders with a header docs link", async ({ page }) => {
            await page.goto(server.getUrl("/"));
            await expect(page.locator("#host-marker")).toHaveText(fixture.hostMarker);
            await expect(page.locator('header a[href="/docs"]')).toBeVisible();
        });

        test("the header docs link lands on the docs", async ({ page }) => {
            await page.goto(server.getUrl("/"));
            await page.locator('header a[href="/docs"]').click();
            await expect(page.locator("h1").first()).toHaveText("Docs Home");
        });

        test("docs pages render under /docs", async ({ page }) => {
            await page.goto(server.getUrl("/docs/overview"));
            await expect(page.locator("h1").first()).toHaveText("Docs Overview");
            await page.goto(server.getUrl("/docs/quickstart"));
            await expect(page.locator("h1").first()).toHaveText("Quickstart");
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
        });
    });
}
