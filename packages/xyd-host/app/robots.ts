export async function loader({ request }: { request: Request }) {
    const baseUrl = __xydSettings?.seo?.domain || new URL(request.url).origin;
    
    // Generate robots.txt content
    const content = `# https://www.robotstxt.org/robotstxt.html
User-agent: *
Allow: /

# Sitemap
Sitemap: ${baseUrl}/sitemap.xml`;

    return new Response(content, {
        headers: {
            'Content-Type': 'text/plain',
            'Cache-Control': 'public, max-age=3600'
        }
    });
}
