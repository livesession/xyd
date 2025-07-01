import { test, expect, Locator } from '@playwright/test';

import {createXydServer, createXydServerWithTemplate, XydServer} from '../../utils/xyd-server';

const SEO_DOMAIN = "https://your-domain.com"
const DEFAULT_DESCRIPTION = "Your default site description"
const DEFAULT_OG_IMAGE = "https://your-domain.com/default-social-image.jpg"

const tests = [
  {
    "pageUrl": "overview",
    "metatags": [
      {
        "name": "description",
        "expect": DEFAULT_DESCRIPTION
      },
      {
        "property": "og:image",
        "expect": DEFAULT_OG_IMAGE
      },
    ]
  },
  {
    "pageUrl": "quickstart",
    'metatags': [
      {
        "name": "description",
        "expect": "Quickstart Description"
      },
      {
        "property": "og:image",
        "expect": DEFAULT_OG_IMAGE
      },
      {
        "name": "robots",
        "expect": "noindex"
      }
    ]
  },
  {
    "pageUrl": "guides/introduction",
    "metatags": [
      {
        "name": "description",
        "expect": DEFAULT_DESCRIPTION
      },
      {
        "property": "og:image",
        "expect": DEFAULT_OG_IMAGE
      },
      {
        "name": "author",
        "expect": "Author Name"
      },
      {
        "name": "keywords",
        "expect": "keyword, keyword2"
      }
    ]
  }
]

test.describe('SEO Meta Tags', () => {
  let server: XydServer;

  test.beforeAll(async () => {
    // Start XYD server for this test directory
    server = await createXydServerWithTemplate(__dirname);
  });

  test.afterAll(async () => {
    await server.stop();
  });

  test.describe('Meta Tags', () => {
    for (const testCase of tests) {
      test(`${testCase.pageUrl} page meta tags`, async ({ page }) => {
        // Navigate to the page
        await page.goto(server.getUrl(`/${testCase.pageUrl}`));

        // Wait for the page to load
        await page.waitForLoadState('networkidle');

        // // Check page title
        // await expect(page).toHaveTitle(new RegExp(testCase.pageUrl, 'i'));

        // Test each meta tag
        for (const metatag of testCase.metatags) {
          let element: Locator | null = null;

          if (metatag.name) {
            // Test meta tag with name attribute
            element = page.locator(`meta[name="${metatag.name}"]`);

          } else if (metatag.property) {
            // Test meta tag with property attribute
            element = page.locator(`meta[property="${metatag.property}"]`);
          }

          if (!element) {
            throw new Error(`Meta tag ${metatag.name || metatag.property} not found`);
          }

          await expect(element).toHaveCount(1);

          const content = await element.getAttribute('content');
          expect(content).toBe(metatag.expect);
        }
      });
    }
  });

  test.describe('sitemap.xml', () => {
    test('should contain all test pages', async ({ page }) => {
      // Navigate to the sitemap
      await page.goto(server.getUrl('/sitemap.xml'));

      // Wait for the page to load
      await page.waitForLoadState('networkidle');

      // Take a screenshot for debugging
      await page.screenshot({ path: 'sitemap-debug.png', fullPage: true });

      // Get the sitemap content
      const sitemapContent = await page.content();

      // Check that sitemap is valid XML
      expect(sitemapContent).toContain('<urlset');

      // Extract all URLs from the sitemap
      const urlMatches = sitemapContent.match(/<loc>(.*?)<\/loc>/g);
      expect(urlMatches).toBeTruthy();

      const sitemapUrls = urlMatches!.map(match => {
        const url = match.replace(/<\/?loc>/g, '');
        return url
      });

      // Check that all test page URLs are included in the sitemap
      for (const testCase of tests) {
        expect(sitemapUrls).toContain(`${SEO_DOMAIN}/${testCase.pageUrl}`);
      }
    });
  });

  test.describe('robots.txt', () => {
    test('should have correct content and structure', async ({ page }) => {
      // Navigate to robots.txt
      await page.goto(server.getUrl('/robots.txt'));

      // Wait for the page to load
      await page.waitForLoadState('networkidle');

      // Get the robots.txt content
      const robotsContent = await page.content();

      // Check that robots.txt contains expected content
      expect(robotsContent).toContain('User-agent: *');
      expect(robotsContent).toContain('Allow: /');
      expect(robotsContent).toContain('Sitemap: https://your-domain.com/sitemap.xml');

      // Check for the comment
      expect(robotsContent).toContain('# https://www.robotstxt.org/robotstxt.html');

      // Verify the structure is correct
      const lines = robotsContent.split('\n').map(line => line.trim()).filter(line => line.length > 0);

      // Should have at least the user-agent, allow, and sitemap directives
      expect(lines.length).toBeGreaterThanOrEqual(4);

      // Check that User-agent comes before Allow
      const userAgentIndex = lines.findIndex(line => line.startsWith('User-agent:'));
      const allowIndex = lines.findIndex(line => line.startsWith('Allow:'));
      expect(userAgentIndex).toBeLessThan(allowIndex);
    });
  });
}); 