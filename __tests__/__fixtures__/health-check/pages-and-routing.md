---
title: Pages & Routing
icon: app-window
---

# Pages & Routing {subtitle="Start structuring docs"}
One of the core concepts are [pages](https://xyd.dev/docs/guides/pages) and [routing](https://xyd.dev/docs/guides/routing).

## Page [toc]
```md [descHead="Page" desc="Pages are content files that can be organized. File structure maps to URL structure."]
├ folder-name
│  └─ your-page-within-folder.md
|
├─ your-page.md
|
└─ docs.json
```

## Routing [toc]
&nbsp;
```json [descHead="Routing" desc="Configure navigation in [docs.json](https://xyd.dev/docs/guides/settings). Groups organize pages and page paths."]
{
  "sidebar": [
    {
      "group": "Get Started",
      "icon": "code",
      "pages": [
          "your-page",
          "folder-name/your-page-within-folder",
      ]
    }
    // ... other groups
  ]
}
```