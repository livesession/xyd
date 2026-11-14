/**
 * The URL an llms.txt entry links a page at.
 *
 * `pagePath` is the page's path in the site (`/guides/intro.md`). The site is
 * served under `advanced.basename`, so the link carries it, like every other
 * URL of the site. `ai.llmsTxt.baseUrl` is the site's origin
 * (`https://docs.example.com`) and goes in front of both; a baseUrl whose path
 * already ends with the basename is taken as the site's full base, so the
 * basename is not repeated. An absolute `pagePath` is kept as is.
 */
export function llmsTxtLinkUrl(
    pagePath: string,
    basename?: string,
    baseUrl?: string,
): string {
    if (/^https?:\/\//i.test(pagePath)) {
        return pagePath;
    }

    const trimmed = (basename || "").replace(/^\/+|\/+$/g, "");
    const prefix = trimmed ? `/${trimmed}` : "";
    const origin = (baseUrl || "").replace(/\/+$/, "");
    if (!origin) {
        return prefix + pagePath;
    }

    return (prefix && pathOf(origin).endsWith(prefix) ? origin : origin + prefix) + pagePath;
}

/** The path of a baseUrl (`https://example.com/docs` → `/docs`), "" for a bare origin. */
function pathOf(baseUrl: string): string {
    try {
        return new URL(baseUrl).pathname.replace(/\/+$/, "");
    } catch {
        return baseUrl;
    }
}
