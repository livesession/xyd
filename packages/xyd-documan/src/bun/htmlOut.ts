import * as path from "node:path";
import * as fs from "node:fs";

/** '/' → index.html, else <slug>.html (mkdir -p parents), matching the Vite
 *  build's flattened output. Pages nest under the basename dir (docs/…) when
 *  `advanced.basename` is set — parity with the Vite build; assets stay at root.
 *
 *  Lives here (not inline in buildStatic) so the main thread AND the prerender
 *  worker (prerenderWorker.ts) share ONE definition — they must write pages to
 *  byte-identical paths or a parallel build would diverge from the serial one. */
export function writeHtml(clientDir: string, slug: string, html: string) {
  const base = ((globalThis as any).__xydSettings?.advanced?.basename || "").replace(/^\/+|\/+$/g, "");
  const rel0 = slug === "index" || slug === "" ? "index.html" : `${slug}.html`;
  const rel = base ? path.join(base, rel0) : rel0;
  const abs = path.join(clientDir, rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, html);
}
