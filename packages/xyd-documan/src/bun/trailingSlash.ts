/** A page's trailing-slash form (`/cli/deploy/`) and the page it stands for
 *  (`/cli/deploy`), for the static build. The rule itself is core's
 *  `trailingSlashTarget`, which the dev servers redirect with; the build's
 *  not-found page carries the same rule as a script. */

function normalizeBasename(basename: string): string {
  const trimmed = basename.replace(/^\/+|\/+$/g, "");
  return trimmed ? "/" + trimmed : "/";
}

/** core's `trailingSlashTarget` as an inline script for a static page: when
 *  the address ends with a slash, replace it with the page (query and fragment
 *  kept). */
export function trailingSlashScript(basename = ""): string {
  const base = JSON.stringify(normalizeBasename(basename));
  return (
    `(function(){var p=location.pathname;if(!/\\/$/.test(p))return;` +
    `var t="/"+p.replace(/^\\/+/,"").replace(/\\/+$/,"");if(t==="/"||t===${base})return;` +
    `location.replace(t+location.search+location.hash)})();`
  );
}

/** A standalone not-found page for the static output. A host that answers a
 *  missing path with `404.html` (most static hosts, and object stores set up as
 *  websites) sends a page's trailing-slash form here, and the script moves the
 *  browser on to the page itself. Any other miss shows the message. */
export function notFoundPageHtml(basename = ""): string {
  const home = normalizeBasename(basename);
  const homeHref = home === "/" ? "/" : home + "/";
  return (
    `<!doctype html><html lang="en"><head><meta charset="utf-8">` +
    `<meta name="viewport" content="width=device-width, initial-scale=1">` +
    `<meta name="robots" content="noindex"><title>Page not found</title>` +
    `<script>${trailingSlashScript(basename)}</script>` +
    `<style>:root{color-scheme:light dark}body{margin:0;font:16px/1.5 system-ui,sans-serif;` +
    `background:#fff;color:#1f2328}main{max-width:36rem;margin:15vh auto;padding:0 16px}` +
    `a{color:#0a58ca}@media (prefers-color-scheme:dark){body{background:#0e0e10;color:#e6e6e6}a{color:#8ab4f8}}</style>` +
    `</head><body><main><h1>Page not found</h1><p>There is no page at this address.</p>` +
    `<p><a href="${homeHref}">Go to the home page</a></p></main></body></html>`
  );
}
