---
title: Routing
icon: waypoints
tocCard: 
    link: https://github.com/xyd-js/routing-samples
    title: Routing Samples
    description: Learn how to setup Routing
    icon: docs:github

maxTocDepth: 4
---

# Routing
:::subtitle
Learn how to navigate your docs
:::

Routing is one of the core concepts in xyd to understand as it determines how your documentation pages are organized, navigated, and accessed by users. It provides flexible ways to structure your content.


## Settings-Based Routing

You can customize the routing by adding a routes in [`docs.json`](/docs/guides/settings) file to your project.

The `navigation` property controls the hierarchy of your documentation. It's grouped into multiple properties:

* [`sidebar`](/docs/guides/routing#sidebar) - Main navigation, usually displayed on the left side of the page.
* [`header`](/docs/guides/routing#header) - Sub navigation, usually displayed on the top of the page.
* [`anchors`](/docs/guides/routing#anchors) - Fixed navigation, helpful for displaying a static navigation/links.

:::callout
Dividing a `navigation` into multiple properties helps you to organize your documentation better.
:::

### Sidebar
The simples way to define `sidebar` is declaring a pages within it:
```json [descHead="Important" desc="Each entry of the pages **MUST** be a path to a file that exists within your docs."]
{
  "navigation": {
    "sidebar": [
      "overview", // overview.md
      "quickstart", // quickstart.md
      "guides/introduction" // guides/introduction.md
    ]
  }
}
```

:::callout
Note you do not need to append `.md`/`.mdx` or `/` at beginning to the file paths.
:::

#### Groups
If you need more advanced structures, define sidebar as object:
```json [descHead="Tip" desc="Group shows on the sidebar above the sidebar items."]
{
  "sidebar": [
    {
      // !diff +
      "group": "Get Started",
      "icon": "code",
      "pages": [
          "docs/guides/introduction",
          "docs/guides/getting-started",
          "docs/guides/deploy"
      ]
    }
    // ... other groups
  ]
}
```

:::callout
`group` property shows the name as the separator in the sidebar.
:::

#### Nested Groups
You can also define nested groups:

```json [!scroll descHead="Reference" desc="Check the reference of [Sidebar](/docs/reference/core/sidebar)".]
{
  "sidebar": [
    {
      "group": "Get Started",
      "pages": [
          "docs/guides/introduction",
          "docs/guides/getting-started",
          // !diff +
          {
            "group": "Deployment",
            "pages": [
              "docs/guides/deploy/overview",
              "docs/guides/deploy/netlify"
            ]
          }
      ]
    }
    // ... other groups
  ]
}
```

:::callout
Please not that order of your sidebar items depends on place in the config file. 
:::

#### Routing
You can also do more advanced routing in the sidebar, like matching based on the specific route:

```json [!scroll]
{
    "sidebar": [
        {
            // !diff +
            "route": "docs",
            "pages": [
                {
                    "group": "Getting Started",
                    "pages": [
                       "docs/introduction",
                       "docs/components"
                    ]
                },
                {
                    // ...
                }
            ]
        },
        {
            // !diff +
            "route": "docs/api",
            "pages": [
                {
                    "group": "API",
                    "pages": [
                        "docs/api/introduction",
                        "docs/api/error-handling"
                    ]
                }
            ]
        }
    ]
}
```
:::callout
This approach gives you more control over the routing and allows you to create more complex navigation structures.
:::

### Header

The header navigation allows you to create a top-level navigation bar. 

```json
{
  "navigation": {
    "header": [
      {
        "title": "Documentation",
        "page": "docs"
      },
      {
        "title": "API Reference",
        "page": "docs/api"
      }
    ]
  }
}
```

### Segments

Segments allows you to create smaller navigational structures based on specific `route`.
Thanks to that you can create for example a subheader that will shown only on specific `route`: 

```json [!scroll descHead="Tip" desc="Check out how to create a subheader using segments [here](https://github.com/xyd-js/navigation-samples/tree/master/subheader)."]
{
  "navigation": {
    // !diff +
    "segments": [
      {
        "route": "docs/api",
        "title": "API",
        "pages": [
          {
            "title": "Getting Started",
            "page": "docs/api"
          },
          {
            "title": "Authentication",
            "page": "docs/api/auth"
          },
        ]
      },
      {
        "route": "docs/guides",
        "title": "Guides",
        "items": [
          {
            "title": "Quick Start",
            "page": "docs/guides/quickstart"
          },
          {
            "title": "Tutorials",
            "page": "docs/guides/tutorials"
          }
        ]
      }
    ]
  }
}
```

### Anchors {label="Coming Soon"}

Anchors provide a way to add fixed navigation elements, typically at the bottom of the page. They're useful for displaying important external links or resources.

```json
{
  "navigation": {
    "anchors": {
      "bottom": [
        {
          "icon": "icon-book",
          "name": "Documentation",
          "url": "https://docs.example.com"
        },
        {
          "icon": "icon-users",
          "name": "Community",
          "url": "https://community.example.com"
        },
        {
          "icon": "icon-code",
          "name": "GitHub",
          "url": "https://github.com/example"
        },
        {
          "icon": "icon-chat",
          "name": "Support",
          "url": "https://support.example.com"
        }
      ]
    }
  }
}
```

##  File-Convention Routing {label="Coming Soon"}
:::callout
File-convention routing is powerful because you don't need any configuration but also has some limitations. 
<br/>
If you need more control over the routing, you need to use the [`settings based routing`](/docs/guides/routing#settings-based-routing) instead.
:::

Using file-convention routing means the generated HTML pages
are mapped from the directory structure of the source Markdown files. 
 
For example, given the following directory structure:

```
.
├ docs
│  └─ index.md
│  └─ quickstart.md
|
├─ index.md
├─ faq.md
|
└─ settings.json
```

The generated HTML pages will be:
```
index.md                  --> /index.html (accessible as /)
faq.md                    --> /faq.html
docs/index.md             --> /docs/index.html (accessible as /docs/)
docs/quickstart.md        --> /docs/quickstart.html 
```