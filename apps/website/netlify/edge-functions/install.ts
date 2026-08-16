import type { Config, Context } from "@netlify/edge-functions";

// Serves the xyd native-CLI installer at:
//   /install            → latest stable  (canary.<domain> → latest canary)
//   /install@<version>  → a specific release (e.g. /install@0.1.0, /install@canary-abc1234)
//
// The channel comes from the request host (a `canary.` subdomain → canary),
// the version from the `@…` path suffix. Both are injected into the static
// public/install.sh (its __XYD_CHANNEL__ / __XYD_VERSION__ placeholders); the
// script then resolves the matching GitHub release + downloads the right binary.
export default async (request: Request, _context: Context): Promise<Response | void> => {
  const url = new URL(request.url);

  // Only /install and /install@<version> are ours; let anything else through
  // (e.g. the static /install.sh, which is also excluded below).
  const rest = url.pathname.slice("/install".length);
  if (rest !== "" && rest !== "/" && !rest.startsWith("@")) return;

  const host = (request.headers.get("host") || url.hostname).toLowerCase();
  const channel = host.startsWith("canary.") ? "canary" : "stable";
  const version = rest.startsWith("@") ? decodeURIComponent(rest.slice(1)).trim() : "";

  const res = await fetch(new URL("/install.sh", url.origin), {
    headers: { "user-agent": "xyd-install-edge" },
  });
  if (!res.ok) {
    return new Response(`# xyd install: could not load the install script (${res.status})\n`, {
      status: 502,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  const script = (await res.text())
    .replaceAll("__XYD_CHANNEL__", channel)
    .replaceAll("__XYD_VERSION__", version);

  return new Response(script, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      // short cache: the resolved tag is picked by the script, not baked in here.
      "cache-control": "public, max-age=300",
    },
  });
};

export const config: Config = {
  path: "/install*",
  excludedPath: "/install.sh",
};
