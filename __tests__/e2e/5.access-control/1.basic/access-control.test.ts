import { test, expect } from '@playwright/test';
import { createHmac } from 'node:crypto';

import {
  createXydServerWithTemplate,
  createXydBuildServer,
  XydServer,
} from '../../utils/xyd-server';

const JWT_SECRET = 'e2e-test-secret-key-at-least-32-characters-long';
const COOKIE_NAME = 'xyd-auth-token';

function signJWT(payload: Record<string, any>): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify({
    ...payload,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 86400,
  })).toString('base64url');
  const sig = createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${sig}`;
}

const modes = [
  { name: 'dev', createServer: () => createXydServerWithTemplate(__dirname) },
  {
    name: 'build',
    createServer: () => createXydBuildServer(__dirname, {
      env: { AUTH_SECRET: JWT_SECRET },
    }),
  },
] as const;

for (const mode of modes) {
  test.describe(`Access Control [${mode.name}]`, () => {
    // Run tests serially so they share a single server instance.
    // With fullyParallel, each worker would create its own server and
    // trigger Vite's dependency optimization + HMR reloads independently.
    test.describe.configure({ mode: 'serial' });

    let server: XydServer;

    test.beforeAll(async () => {
      server = await mode.createServer();
    });

    test.afterAll(async () => {
      await server.stop();
    });

    test.describe('Public pages', () => {
      test('public page is accessible without auth', async ({ page }) => {
        await page.goto(server.getUrl('/guides/welcome'));
        await page.waitForLoadState('networkidle');

        const content = await page.textContent('body');
        expect(content).toContain('Welcome');
      });

      test('public page content is in HTML source', async ({ page }) => {
        const response = await page.goto(server.getUrl('/guides/welcome'));
        const html = await response?.text() || '';
        expect(html).toContain('Welcome');
      });
    });

    test.describe('Protected pages (unauthenticated)', () => {
      test('protected page content is NOT in HTML source (SSR exclusion)', async ({ page }) => {
        const response = await page.goto(server.getUrl('/protected/api-reference'));
        const html = await response?.text() || '';

        // The secret content marker must never appear in HTML source
        expect(html).not.toContain('SECRET_CONTENT_MARKER_FOR_E2E_TEST');
      });

      test('admin page content is NOT in HTML source', async ({ page }) => {
        const response = await page.goto(server.getUrl('/admin/dashboard'));
        const html = await response?.text() || '';

        expect(html).not.toContain('ADMIN_SECRET_CONTENT_MARKER_FOR_E2E_TEST');
      });

      test('protected page redirects or hides content', async ({ page }) => {
        await page.goto(server.getUrl('/protected/api-reference'));
        await page.waitForLoadState('networkidle');

        const url = page.url();
        const content = await page.textContent('body');

        const redirectedToLogin = url.includes('/login');
        const contentHidden = !content?.includes('SECRET_CONTENT_MARKER_FOR_E2E_TEST');

        expect(redirectedToLogin || contentHidden).toBe(true);
      });
    });

    test.describe('Protected pages (authenticated)', () => {
      test('authenticated user can access protected page', async ({ page, context }) => {
        const token = signJWT({ sub: 'test-user', groups: [] });

        await context.addCookies([{
          name: COOKIE_NAME,
          value: token,
          domain: 'localhost',
          path: '/',
        }]);

        await page.goto(server.getUrl('/protected/api-reference'));
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        const content = await page.textContent('body');
        expect(content).toContain('API Reference');
      });

      test('admin user can access admin page', async ({ page, context }) => {
        const token = signJWT({ sub: 'admin-user', groups: ['admin'] });

        await context.addCookies([{
          name: COOKIE_NAME,
          value: token,
          domain: 'localhost',
          path: '/',
        }]);

        await page.goto(server.getUrl('/admin/dashboard'));
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        const content = await page.textContent('body');
        expect(content).toContain('Admin Dashboard');
      });

      test('non-admin user cannot access admin page', async ({ page, context }) => {
        const token = signJWT({ sub: 'regular-user', groups: [] });

        await context.addCookies([{
          name: COOKIE_NAME,
          value: token,
          domain: 'localhost',
          path: '/',
        }]);

        await page.goto(server.getUrl('/admin/dashboard'));
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        const content = await page.textContent('body');
        expect(content).not.toContain('ADMIN_SECRET_CONTENT_MARKER_FOR_E2E_TEST');
      });
    });

    test.describe('Login page', () => {
      test('login page is accessible', async ({ page }) => {
        await page.goto(server.getUrl('/login'));
        await page.waitForLoadState('networkidle');

        const content = await page.textContent('body');
        expect(content).toContain('Sign in');
      });
    });

    test.describe('Sitemap filtering', () => {
      test('sitemap excludes protected pages', async ({ page }) => {
        await page.goto(server.getUrl('/sitemap.xml'));
        await page.waitForLoadState('networkidle');

        const sitemapContent = await page.content();

        expect(sitemapContent).toContain('/guides/welcome');
        expect(sitemapContent).not.toContain('/protected/api-reference');
        expect(sitemapContent).not.toContain('/admin/dashboard');
      });
    });

    test.describe('JWT callback', () => {
      test('callback page handles token in query param', async ({ page }) => {
        const token = signJWT({ sub: 'callback-user', groups: [] });

        await page.goto(server.getUrl(`/auth/jwt-callback?token=${token}&redirect=/guides/welcome`));
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);

        const url = page.url();
        expect(url).toContain('/guides/welcome');
      });
    });
  });
}
