import React from "react";
import { renderToString } from "react-dom/server";

import App from "./App";

/**
 * WIP Bun-native dev server (plan S1). This is the seed that will replace the
 * Vite + React-Router dev path: `Bun.serve` handles HTTP, `react-dom/server`
 * renders each route server-side, and `Bun.build` produces the client bundle
 * that hydrates it — no Vite, no React Router. Not yet wired into `xyd dev`;
 * run directly with `bun packages/xyd-documan/src/bun/server.tsx`.
 */

const CLIENT_ENTRY = new URL("./client.tsx", import.meta.url).pathname;

async function buildClient(): Promise<string> {
  const out = await Bun.build({
    entrypoints: [CLIENT_ENTRY],
    target: "browser",
    minify: false,
  });
  if (!out.success) {
    throw new AggregateError(out.logs, "client bundle failed");
  }
  const entry = out.outputs.find((o) => o.kind === "entry-point");
  return await entry!.text();
}

function shell(appHtml: string): string {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>xyd bun dev</title>
  </head>
  <body>
    <div id="root">${appHtml}</div>
    <script type="module" src="/_bun/client.js"></script>
  </body>
</html>`;
}

// Built once at startup; the Rust dev-watch service (S5) will drive rebuilds.
const clientJs = await buildClient();

const server = Bun.serve({
  port: Number(process.env.XYD_PORT ?? 5199),
  development: true,
  async fetch(req) {
    const url = new URL(req.url);
    if (url.pathname === "/_bun/client.js") {
      return new Response(clientJs, {
        headers: { "content-type": "text/javascript; charset=utf-8" },
      });
    }
    const appHtml = renderToString(<App />);
    return new Response(shell(appHtml), {
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  },
});

console.log(`xyd bun dev (S1 spike) → ${server.url}`);
