import {docPaths} from "./docPaths";

const navigation = __xydSettings?.navigation || {sidebar: []};


// TODO: support lastmod and other advanced features

export async function loader({request}: { request: Request }) {
    if (!navigation?.sidebar) {
        return new Response('', {
            status: 404,
            headers: {
                'Content-Type': 'text/plain'
            }
        });
    }

    const routes: string[] = docPaths(navigation);
    const baseUrl = __xydSettings?.seo?.domain || new URL(request.url).origin;

    // Generate XML sitemap
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes.map(route => {
        const fullUrl = `${baseUrl}${route}`.replace(/([^:]\/)\/+/g, "$1"); // Remove duplicate slashes
        return `  <url>
    <loc>${fullUrl}</loc>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>`;
    }).join('\n')}
</urlset>`;

    return new Response(xml, {
        headers: {
            'Content-Type': 'application/xml',
            'Cache-Control': 'public, max-age=3600'
        }
    });
}
