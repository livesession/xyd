import { test, expect } from '@playwright/test';

import { createXydBuildServer, XydServer } from '../../utils/xyd-server';

// A nav route with no page of its own ("docs" here, with only docs/guides/*)
// is prerendered as a redirect stub pointing at its first child. That stub is
// still a document the browser loads and a crawler indexes, so it has to be
// well-formed: it used to open `<!doctype html><head>` with no <html> element
// at all — while still closing </html> — which left nowhere to carry `lang`.
// Its refresh was also on a 2 second timer, which WCAG 2.2.1 fails (F40);
// only an immediate redirect is exempt.
// SKIPPED, and it will fail if you un-skip it without doing the following first.
//
// buildStatic.ts takes the `embRoot.server` branch whenever an embedded server
// bundle exists, and only falls back to compiling `./renderPage` from source
// when one does not. `pnpm build` does not regenerate that embedded bundle, so
// an e2e run here exercises whatever renderPage was compiled into the bundle at
// release time — not the working tree. Editing renderRedirectStatic and running
// this test therefore measures nothing, which is exactly why it is skipped
// rather than left green.
//
// Un-skip once the embedded server bundle is rebuilt from source in CI.
test.describe.skip('Redirect stub for a content-less nav route', () => {
    let server: XydServer;

    test.beforeAll(async () => {
        server = await createXydBuildServer(__dirname);
    });

    test.afterAll(async () => {
        await server.stop();
    });

    test('is a well-formed document that redirects immediately', async ({ request }) => {
        const res = await request.get(server.getUrl('/docs'), { maxRedirects: 0 });
        const html = await res.text();

        // A real root element, not a bare <head>.
        expect(html).toMatch(/<html[\s>]/);
        expect(html).toContain('</html>');
        expect(html).toContain('<meta charset="utf-8">');

        // Immediate, not timed — a delay here is the WCAG failure.
        const refresh = html.match(/content="(\d+);url=([^"]+)"/);
        expect(refresh, 'expected a refresh meta tag').not.toBeNull();
        expect(refresh![1]).toBe('0');

        // Points at the route's first child, and says so in a link that works
        // without the refresh.
        expect(refresh![2]).toContain('/docs/guides/introduction');
        expect(html).toContain(`href="${refresh![2]}"`);
        expect(html).toContain('<meta name="robots" content="noindex">');
    });
});
