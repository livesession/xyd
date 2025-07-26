---
title: Navigation
icon: waypoints
tocCard: 
    link: https://github.com/xyd-js/navigation-samples
    title: Navigation Samples
    description: Learn how to setup Navigation
    icon: docs:github
maxTocDepth: 4
---

# Navigation
:::subtitle
Learn how to navigate your docs
:::

Navigation is one of the core concepts in xyd to understand as it determines how your documentation pages are organized, navigated, and accessed by users. It provides flexible ways to structure your content.


## Overview

You can customize the navigation by adding a routes in [`docs.json`](/docs/guides/settings) file to your project.

The `navigation` property controls the hierarchy of your documentation. It's grouped into multiple properties:

* [`sidebar`](/docs/guides/navigation#sidebar) - Main navigation, usually displayed on the left side where all pages are rendered.
* [`tabs`](/docs/guides/navigation#tabs) - Navigate through tabs, the most in header area.
* [`sidebarDropdown`](/docs/guides/navigation#tabs) - Navigate through sidebar dropdown.
* [`anchors`](/docs/guides/navigation#anchors) - Fixed navigation, helpful for displaying a static navigation/links.
* [`segments`](/docs/guides/navigation#segments) - Smaller navigational structures based on specific `route`.

:::callout
Dividing a `navigation` into multiple properties helps you to organize your documentation better.
:::

## Sidebar

![asset](/public/assets/Sidebar.png)

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

### Groups
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

### Nested Groups
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

### Group Page {label="Coming Soon"}
If you want to have a clickable group as a page, define `page` instead of `group`:
```json [!scroll descHead="Tip" desc="The sidebar title comes from a [Page Meta](/docs/guides/pages)"]
{
  "sidebar": [
    {
      "group": "Integrations",
      "pages": [
          {
              // !diff -
              "group": "Integrations",
              // !diff +
              "page": "docs/guides/integrations",
              "icon": "chart-line",
              "pages": [
                  "docs/guides/integrations/analytics/analytics-integrations",
                  "docs/guides/integrations/analytics/livesession"
              ]
          }
      ]
    }
    // ... other groups
  ]
}
```

### Routing
You can also do more advanced routing in the sidebar, like matching based on the specific route:

```json [!scroll descHead="Tip" desc="This approach gives you more control over the routing and allows you to create more complex navigation structures."]
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

## Tabs

![Tabs](/public/assets/Tabs.png)

[Navigation Item](/docs/reference/core/navigationitem) structure displayed in tabs-like style:

```json [!scroll]
{
  "navigation": {
    "tabs": [
      {
          "title": "Guides",
          "page": "docs",
          "icon": "book"
      },
      {
          "title": "Components",
          "page": "docs/components",
          "icon": "component"
      },
      {
          "title": "Reference",
          "page": "docs/reference",
          "icon": "brackets"
      }
    ]
  }
}
```

::::details{kind="secondary" title="Tabs API Reference" label="Check the full Tabs API Reference"}
  ::atlas{apiRefItemKind="secondary" references="@uniform('@core/types/settings.ts', {mini: 'Tabs'})"}
::::

## Sidebar Dropdown

![Sidebar Dropdown](/public/assets/SidebarDropdown.png)

[Navigation Item](/docs/reference/core/navigationitem) structure displayed in dropdown-like style inside sidebar:

```json [!scroll]
{
  "navigation": {
    "sidebarDropdown": [
      {
          "title": "Guides",
          "page": "docs",
          "icon": "book"
      },
      {
          "title": "Components",
          "page": "docs/components",
          "icon": "component"
      },
      {
          "title": "Reference",
          "page": "docs/reference",
          "icon": "brackets"
      }
    ]
  }
}
```

::::details{kind="secondary" title="Sidebar Dropdown API Reference" label="Check the full Sidebar Dropdown API Reference"}
  ::atlas{apiRefItemKind="secondary" references="@uniform('@core/types/settings.ts', {mini: 'SidebarDropdown'})"}
::::

## Anchors

![asset](/public/assets/Anchors.png)

Anchors provide a way to add fixed navigation elements. They're useful for displaying important external links or resources.


:::tabs
1. [Header](anchors=header)
    ```json [!scroll]
    {
      "navigation": {
        "anchors": {
            // !diff +
          "header": [
              {
                  "title": "Public Roadmap",
                  "href": "https://github.com/orgs/livesession/projects/4"
              },
              {
                  "title": "Feedback",
                  "href": "https://github.com/livesession/xyd/discussions",
                  "button": "primary"
              },
              {
                  "title": "Github",
                  "href": "https://github.com/livesession/xyd/discussions",
                  "icon": "lucide:github" // use your custom icons
              },
               {
                  "title": "Slack",
                  "href": "http://xyd-docs.slack.com",
                  "social": "slack" // use pre-defined social icons
              }
          ]
        }
      }
    }
    ```
  
2. [Sidebar Bottom](anchors=sidebar.bottom)
    ```json [!scroll]
    {
      "navigation": {
        "anchors": {
          // !diff +
          "sidebar": {
              // !diff +
            "bottom": [
              {
                "href": "https://docs.example.com",
                "icon": "icon-book",
                "title": "Documentation"
              },
              {
                "href": "https://community.example.com",
                "icon": "icon-users",
                "title": "Community"
              },
              {
                "href": "https://github.com/example",
                "icon": "icon-code",
                "title": "GitHub"
              },
              {
                "href": "https://support.example.com",
                "icon": "icon-chat",
                "title": "Support"
              }
            ]
          }
        }
      }
    }
    ```
:::


::::details{kind="secondary" title="Anchors API Reference" label="Check the full Anchors API Reference"}
  ::atlas{apiRefItemKind="secondary" references="@uniform('@core/types/settings.ts', {mini: 'Anchors'})"}
::::

## Segments {label="Experimental"}

![asset](/public/assets/Segments.png)

Segments allows you to create smaller navigational structures based on specific [`route`](/docs/guides/routing#routing-1).
Thanks to that you can create for example a subheader that will shown only on specific [`route`](/docs/guides/routing#routing-1): 

```json [!scroll descHead="Tip" desc="Check out how to create a subheader using segments [here](https://github.com/xyd-js/navigation-samples/tree/master/subheader)."]
{
  "navigation": {
    // !diff +
    "segments": [
      {
        // !diff +
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
        // !diff +
        "route": "docs/guides",
        "title": "Guides",
        "pages": [
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
::::details{kind="secondary" title="Segments API Reference" label="Check the full Segment API Reference"}
  ::atlas{apiRefItemKind="secondary" references="@uniform('@core/types/settings.ts', {mini: 'Segment'})"}
::::

##  File-Convention Routing {label="Coming Soon"}
:::callout
File-convention routing is powerful because you don't need any configuration but also has some limitations. 
<br/>
If you need more control over the routing, you need to use the settings based routing instead.
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