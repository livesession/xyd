import { Settings, Sidebar } from "@xyd-js/core";

const navigation = __xydSettings?.navigation || { sidebar: [] };

// TODO: shared !!!
const flattenNavigation = (navigation: Settings['navigation']) => {
    if (!navigation?.sidebar) return [];

    const paths: string[] = [];

    // Process each sidebar group
    navigation.sidebar.forEach(sidebarGroup => {
        // Add the route of the sidebar group
        if ('route' in sidebarGroup) {
            const route = sidebarGroup.route;
            if (route) {
                paths.push(`/${route}`);
            }

            // Process items in the sidebar group
            if (sidebarGroup.items) {
                processSidebarItems(sidebarGroup.items);
            }
        }
    });

    // Helper function to process sidebar items recursively
    function processSidebarItems(items: Sidebar[]) {
        items.forEach(item => {
            // If item has pages, process them
            if (item.pages) {
                item.pages.forEach((page) => {
                    if (typeof page === 'string') {
                        // Add the page path
                        paths.push(`/${page}`);
                    } else {
                        if ("virtual" in page) {
                            paths.push(`/${page.page}`);
                        } else {
                            // Recursively process nested pages
                            processSidebarItems([page]);
                        }
                    }
                });
            }
        });
    }

    return paths;
};

// TODO: support lastmod and other advanced features

export async function loader({ request }: { request: Request }) {
    if (!navigation?.sidebar) {
        return new Response('', {
            status: 404,
            headers: {
                'Content-Type': 'text/plain'
            }
        });
    }

    const routes: string[] = flattenNavigation(navigation);
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
