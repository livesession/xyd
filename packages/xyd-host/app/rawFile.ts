import path from "node:path";
import { rawRouteKey, stripBasename } from "./basename";
import { MIME_TYPES } from "./constants";

// Declare the global property type
declare global {
  var __xydRawRouteFiles: { [path: string]: string };
}

export async function loader({ request }: any) {
  const url = new URL(request.url);
  // Raw routes are registered basename-relative (routes.ts), but request.url
  // carries the full pathname — strip `advanced.basename` before the lookup,
  // or every llms.txt / .md twin 404s on a site mounted under a prefix (and
  // the prerender aborts on the first one). The keys are file paths as
  // written, so the percent-encoded pathname is decoded first: a page named
  // `my page.md` is requested as `my%20page.md`. The pathname as it came is
  // the fallback for a key that holds an escape itself.
  const basename = (globalThis as any).__xydSettings?.advanced?.basename;
  const pathname = rawRouteKey(url.pathname, basename);
  // Get the content from globalThis.__xydRawRouteFiles for this path
  const content =
    globalThis.__xydRawRouteFiles?.[pathname] ??
    globalThis.__xydRawRouteFiles?.[stripBasename(url.pathname, basename)];

  if (!content) {
    throw new Response("Not Found", { status: 404 });
  }

  // Determine content type based on file extension
  const ext = path.extname(pathname).toLowerCase();
  const contentType = MIME_TYPES[ext] || "text/plain";

  return new Response(content, {
    status: 200,
    headers: {
      "Content-Type": `${contentType}; charset=utf-8`,
    },
  });
}
