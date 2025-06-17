---
title: SEO
icon: search
---

# SEO

:::subtitle
Enhance your documentation's search engine visibility with custom meta tags
:::

Our documentation platform provides automatic meta tag generation, but you have a full control to customize them through the [`docs.json`](/docs/guides/settings) configuration or individual [page](/docs/guides/pages) meta.

## Global Meta Tags

Set default meta tags for your entire documentation by adding the `seo.metatags` section to your `docs.json`:

```json
{
  "seo": {
      "metatags": {
          "og:image": "https://your-domain.com/default-social-image.jpg",
          "description": "Your default site description"
      }
  }
}
```

## Page-specific Meta Tags

Customize meta tags for individual pages using [page](/docs/guides/pages) meta:

```md
---
title: 'Custom Page Title'
'og:image': 'https://your-domain.com/page-specific-image.jpg'
'description': 'Page-specific description'
---
```

:::callout
  When using meta tags containing colons (like `og:image`), remember to wrap them in quotes in your frontmatter.
:::

## Sitemaps

Your documentation automatically includes:
- A `sitemap.xml` file (accessible at `/sitemap.xml`)
- A `robots.txt` file

:::callout
For good `sitemap.xml` generation make sure you filled [`seo.domain`](/docs/guides/settings).
:::

By default, only pages listed in `docs.json` are included. To include all pages, configure your `docs.json`:

```json
"seo": {
    "indexing": "all"
}
```

### Controlling Indexing

To prevent search engines from indexing specific pages, add to the page's frontmatter:

```md
---
noindex: true
---
```

For site-wide indexing control, set in `docs.json`:

```json
"seo": {
    "metatags": {
      "robots": "noindex"
    }
}
```

## Meta Tags Reference

Here's a curated list of the most important meta tags you can use to optimize your documentation:

@uniform('@core/types/seo.ts#MetaTags')

:::callout
  You can preview how your meta tags will appear on different platforms using [metatags.io](https://metatags.io/).
:::
