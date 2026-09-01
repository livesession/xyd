import path from "node:path";
import { expect, test } from "@playwright/test";

import { CompatServer, CompatFixture } from "../utils/compat-server";

// Compat matrix for @xyd-js/vite-plugin across the Vite ecosystem: framework ×
// vite-version combinations, incl. the official Vite SSR setup (custom express
// server, middlewareMode dev). Fixtures pin their OWN deps (npm-installed on
// first run) — see utils/compat-server.ts.
test.describe.configure({ mode: "serial" });

interface Matrix extends CompatFixture {
    name: string;
    hostMarker: string;
}

const MATRIX: Matrix[] = [
    {
        name: "vanilla + vite latest (SPA)",
        dir: path.join(__dirname, "1.vanilla-vite-latest"),
        hostMarker: "Host Vanilla App",
        build: { outDir: "dist" },
        dev: {},
    },
    {
        name: "react-router latest + vite latest (ssr + prerender)",
        dir: path.join(__dirname, "2.react-router-latest"),
        hostMarker: "Host RR App",
        build: { outDir: "build/client" },
        dev: {},
    },
    {
        name: "react-router latest + vite 7",
        dir: path.join(__dirname, "3.vite7-react-router-latest"),
        hostMarker: "Host RR App",
        build: { outDir: "build/client" },
        dev: {},
    },
    {
        name: "vite SSR guide — vanilla (custom express server)",
        dir: path.join(__dirname, "4.ssr-vanilla"),
        hostMarker: "Host SSR Vanilla App",
        build: { serveScript: "preview", serveEnv: { NODE_ENV: "production" } },
        dev: { portEnvVar: "PORT" },
    },
    {
        name: "vite SSR guide — vue (custom express server)",
        dir: path.join(__dirname, "5.ssr-vue"),
        hostMarker: "Host SSR Vue App",
        build: { serveScript: "preview", serveEnv: { NODE_ENV: "production" } },
        dev: { portEnvVar: "PORT" },
    },
    {
        name: "astro latest (static)",
        dir: path.join(__dirname, "6.astro"),
        hostMarker: "Host Astro App",
        build: { outDir: "dist" },
        dev: {},
    },
    {
        name: "sveltekit latest + adapter-static",
        dir: path.join(__dirname, "7.sveltekit"),
        hostMarker: "Host SvelteKit App",
        build: { outDir: "build" },
        dev: {},
    },
    {
        name: "solid latest (SPA)",
        dir: path.join(__dirname, "8.solid"),
        hostMarker: "Host Solid App",
        build: { outDir: "dist" },
        dev: {},
    },
    {
        name: "vue latest (SPA)",
        dir: path.join(__dirname, "9.vue-spa"),
        hostMarker: "Host Vue SPA App",
        build: { outDir: "dist" },
        dev: {},
    },
    {
        name: "nuxt latest (generate)",
        dir: path.join(__dirname, "10.nuxt"),
        hostMarker: "Host Nuxt App",
        build: { outDir: ".output/public" },
        dev: { portEnvVar: "PORT" },
    },
];

for (const fixture of MATRIX) {
    test.describe(`compat build — ${fixture.name}`, () => {
        let server: CompatServer;

        test.beforeAll(async () => {
            test.setTimeout(20 * 60 * 1000); // first run npm-installs the fixture + builds docs
            server = new CompatServer(fixture);
            await server.startBuild();
        });

        test.afterAll(async () => {
            await server?.stop();
        });

        test("host page renders", async ({ page }) => {
            await page.goto(server.getUrl("/"));
            await expect(page.locator("#host-marker")).toHaveText(fixture.hostMarker);
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

    test.describe(`compat dev — ${fixture.name}`, () => {
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

            // gated until the spawned xyd dev finishes its cold start
            await page.goto(server.getUrl("/docs/overview"), { timeout: 5 * 60 * 1000 });
            await expect(page.locator("h1").first()).toHaveText("Docs Overview");

            const theme = await page.request.get(server.getUrl("/_xyd/theme.css"));
            expect(theme.status()).toBe(200);
        });
    });
}
