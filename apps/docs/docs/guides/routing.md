---
title: Routing
icon: waypoints
tocGithub: 
    link: https://github.com/xyd-js/routing-samples
    title: Routing Samples
    description: Learn how to setup Routing
---

# Routing
:::subtitle
Learn how to navigate your docs
:::

Routing is one of the core concepts in xyd to understand as it determines how your documentation pages are organized, navigated, and accessed by users. It provides flexible ways to structure your content.


## Settings-Based Routing

You can customize the routing by adding a routes in [`docs.json`](/docs/guides/settings) file to your project.

The `navigation` property controls the hierarchy of your documentation. It's grouped into multiple properties:

* [`sidebar`](#sidebar) - Main navigation, usually displayed on the left side of the page.
* [`header`](#header) - Sub navigation, usually displayed on the top of the page.
* [`anchors`](#anchors) - Fixed navigation, helpful for displaying a static navigation/links.

:::callout
Dividing a `navigation` into multiple properties helps you to organize your documentation better.
:::

### Sidebar
If you don't want any hierarchy, you can just define pages within your navigation field.
Each entry of the pages array must be a path to a file that exists within your repo:

```json
{
  "navigation": {
    "sidebar": [
      "overview",
      "quickstart",
      "guides/introduction"
    ]
  }
}
```

:::callout
Note you do not need to append `.md` or `.mdx` to the file paths.
:::

#### Groups in Sidebar
Groups allow you to group your pages. Groups can also be nested within each other:

```json
{
  "sidebar": [
    {
        {
            "group": "Get Started",
            "pages": [
                "docs/guides/introduction",
                "docs/guides/getting-started",
                "docs/guides/deploy"
            ]
        },
        // ... other groups
    }
  ]
}
```

:::callout
`group` property shows the name as the separator in the sidebar.
:::

#### Nested Groups in Sidebar
You can also define nested groups with pages:

```json
{
  "sidebar": [
    {
        {
            "group": "Get Started",
            "pages": [
                "docs/guides/introduction",
                "docs/guides/getting-started",
                {
                  "group": "Deployment",
                  "pages": [
                    "docs/guides/deploy/overview",
                    "docs/guides/deploy/netlify"
                  ]
                }
            ]
        },
        // ... other groups
    }
  ]
}
```

:::callout
Please not that order of your sidebar items depends on place in the config file. 
:::

#### Routing in Sidebar
You can also do more advanced routing in the sidebar, like matching based on the current route:

```json
{
    "sidebar": [
        {
            "route": "docs",
            "items": [
                {
                    "group": "Getting Started",
                    "pages": [
                        "docs/introduction",
                       "docs/components"
                    ]
                },
                {
                    "group": "Guides",
                    "pages": [
                        "docs/guides/introduction",
                        "docs/guides/components"
                    ]
                }
            ],
        },
        {
            "route": "docs/api",
            "items": [
                {
                    "group": "API",
                    "pages": [
                        "docs/api/introduction",
                        "docs/api/error-handling",
                    ]
                }
            ]
        }
    ]
}
```
:::callout
This approuch gives you more control over the routing and allows you to create more complex navigation structures.
:::

### Header

The header navigation allows you to create a top-level navigation bar. 
You can also define a sub header for a specific route.

```json
{
  "navigation": {
    "header": [
      {
        "name": "Documentation",
        "url": "/docs"
      },
      {
        "name": "API Reference",
        "url": "/docs/api"
      },
      {
        "sub": {
          "route": "/docs/api",
          "name": "API",
          "items": [
            {
              "name": "Getting Started",
              "url": "/docs/api"
            },
            {
              "name": "Authentication",
              "url": "/docs/api/auth"
            },
          ]
        }
      },
      {
        "sub": {
          "route": "/docs/guides",
          "name": "Guides",
          "items": [
            {
              "name": "Quick Start",
              "url": "/docs/guides/quickstart"
            },
            {
              "name": "Tutorials",
              "url": "/docs/guides/tutorials"
            }
          ]
        }
      }
    ]
  }
}
```

:::callout
The `route` property in sub header determines when the sub menu should be visible based on the current route.
:::

### Anchors

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

:::callout
Anchors support icons and can be positioned at different parts of the page using the `bottom` property.
:::

##  File-Convention Routing {label="Coming soon"}
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