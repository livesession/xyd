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

You can customize the navigation by adding a routes in [`docs.json`](/guides/settings) file to your project.

The `navigation` property controls the hierarchy of your documentation. It's grouped into multiple properties:

* [`sidebar`](/guides/navigation#sidebar) - Main navigation, usually displayed on the left side where all pages are rendered.
* [`tabs`](/guides/navigation#tabs) - Navigate through tabs, the most in header area.
* [`sidebarDropdown`](/guides/navigation#tabs) - Navigate through sidebar dropdown.
* [`anchors`](/guides/navigation#anchors) - Fixed navigation, helpful for displaying a static navigation/links.
* [`segments`](/guides/navigation#segments) - Smaller navigational structures based on specific `route`.

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

```json [!scroll descHead="Reference" desc="Check the reference of [Sidebar](/reference/core/sidebar)."]
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
```json [!scroll descHead="Tip" desc="The sidebar title comes from a [Page Meta](/guides/pages)."]
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

Even while the clickable group **header** in the sidebar is still Coming Soon, a
group that declares a `page` (either a Group Page, or a named group with a `page`)
already becomes a **clickable breadcrumb** automatically — breadcrumbs link any
crumb that resolves to a real route. See [breadcrumb `links`](/guides/appearance#content).

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

### Order
Thanks to `order` you are able to set a custom order of docs groups. It's the most useful with auto-generatated docs - for [OpenAPI](/guides/openapi)/[GraphQL](/guides/graphql) integration for example. There are a few options how to change an order:

:::tabs{kind="secondary"}
1. [Top](order=top)
    ```json [!scroll descHead="Info" desc="Check out how it can be used for API Docs [here](https://github.com/xyd-js/examples/blob/master/graphql/docs.json#L58)."]
    {
      "navigation": {
          "sidebar": [
                {
                    "route": "api/rest",
                    "pages": [
                        {
                            "group": "API & Reference",
                            // !diff
                            "order": 0,
                            "pages": [
                                "api/rest/introduction"
                            ]
                        },
                        ...
                    ]
                }
          ]
      }
    }
    ```

2. [Bottom](order=bottom)
    ```json [!scroll descHead="Info" desc="Check out how it can be used for API Docs [here](https://github.com/xyd-js/examples/blob/master/graphql/docs.json#L58)."]
    {
      "navigation": {
          "sidebar": [
                {
                    "route": "api/rest",
                    "pages": [
                        {
                            "group": "Changelog",
                            // !diff
                            "order": -1,
                            "pages": [
                                "api/rest/changelog/updates"
                            ]
                        },
                        ...
                    ]
                }
          ]
      }
    }
    ```

3. [After](order=after)
    ```json [!scroll descHead="Info" desc="Check out how it can be used for API Docs [here](https://github.com/xyd-js/examples/blob/master/graphql/docs.json#L58)."]
    {
      "navigation": {
          "sidebar": [
                {
                    "route": "docs/api",
                    "pages": [
                        {
                            "group": "React Components",
                            // !diff
                            "order": {
                              // !diff
                              "after": "Responses"
                            },
                            "pages": [
                                "docs/api/react/introduction"
                            ]
                        },
                        ...
                    ]
                }
          ]
      }
    }
    ```

4. [Before](order=before)
    ```json [!scroll descHead="Info" desc="Check out how it can be used for API Docs [here](https://github.com/xyd-js/examples/blob/master/graphql/docs.json#L58)."]
    {
      "navigation": {
          "sidebar": [
                {
                    "route": "docs/api",
                    "pages": [
                        {
                            "group": "Security",
                            // !diff
                            "order": {
                              // !diff
                              "before": "Responses"
                            },
                            "pages": [
                                "docs/api/security/introduction"
                            ]
                        },
                        ...
                    ]
                }
          ]
      }
    }
    ```
:::


## Tabs

![Tabs](/public/assets/Tabs.png)

[Navigation Item](/reference/core/navigationitem) structure displayed in tabs-like style:

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

::::details{kind="tertiary" title="Tabs API Reference" label="Check the full Tabs API Reference"}
  ::atlas{apiRefItemKind="secondary" references="@uniform('@core/types/settings.ts', {mini: 'Tabs'})"}
::::

## Sidebar Dropdown

![Sidebar Dropdown](/public/assets/SidebarDropdown.png)

[Navigation Item](/reference/core/navigationitem) structure displayed in dropdown-like style inside sidebar:

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

::::details{kind="tertiary" title="Sidebar Dropdown API Reference" label="Check the full Sidebar Dropdown API Reference"}
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


::::details{kind="tertiary" title="Anchors API Reference" label="Check the full Anchors API Reference"}
  ::atlas{apiRefItemKind="secondary" references="@uniform('@core/types/settings.ts', {mini: 'Anchors'})"}
::::

## Dropdown Menu {label="Coming Soon"}

Turn a **header anchor** or a **tab** into a nested menu with `dropdownMenu`. Each entry is a [Navigation Item](/reference/core/navigationitem); an entry that itself declares `dropdownMenu` becomes a **submenu**, so menus can nest to multiple levels.

Use `trigger` to control how the menu opens — `"hover"` (default) or `"click"`.

:::tabs
1. [Anchor](dropdownmenu=anchor)
    ```json [!scroll]
    {
      "navigation": {
        "anchors": {
          "header": [
            {
              // !diff +
              "title": "Products",
              // !diff +
              "trigger": "hover",
              // !diff +
              "dropdownMenu": [
                {
                  "title": "Browser SDK",
                  "dropdownMenu": [
                    { "title": "Install", "page": "docs/browser/install" },
                    { "title": "Methods", "page": "docs/browser/methods" }
                  ]
                },
                { "title": "REST API", "page": "docs/rest" },
                { "title": "GraphQL", "page": "docs/graphql" }
              ]
            }
          ]
        }
      }
    }
    ```

2. [Tab](dropdownmenu=tab)
    ```json [!scroll]
    {
      "navigation": {
        "tabs": [
          { "title": "Overview", "page": "overview" },
          {
            // !diff +
            "title": "API Reference",
            // !diff +
            "trigger": "hover",
            // !diff +
            "dropdownMenu": [
              { "title": "Browser SDK", "page": "docs/browser" },
              { "title": "REST API", "page": "docs/rest" },
              { "title": "GraphQL", "page": "docs/graphql" }
            ]
          }
        ]
      }
    }
    ```
:::

:::callout{kind="tip"}
Style the dropdown — chevron rotation, edge-to-edge items, colors — via [`appearance.navigationDropdown`](/guides/appearance#navigation-dropdown).
:::

## Segments {label="Experimental"}

![asset](/public/assets/Segments.png)

Segments allows you to create smaller navigational structures based on specific [`route`](/guides/navigation#routing).
Thanks to that you can create for example a subheader that will shown only on specific [`route`](/guides/navigation#routing): 

```json [!scroll descHead="Tip" desc="Check out how to create a subheader using segments [here](https://github.com/xyd-js/navigation-samples/tree/master/subheader)."]
{
  "navigation": {
    // !diff +
    "segments": [
      {
        // !diff +
        "route": "docs/api",
        "title": "API",
        "appearance": "sidebarDropdown",
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
::::details{kind="tertiary" title="Segments API Reference" label="Check the full Segment API Reference"}
  ::atlas{apiRefItemKind="secondary" references="@uniform('@core/types/settings.ts', {mini: 'Segment'})"}
::::

### Logo Trailing {label="Coming Soon"}

Set a segment's `appearance` to `"logoTrailing"` to render it as a product-switcher
right after the logo — wherever your theme places the logo (header, or the sidebar
like `picasso`). The trigger shows the active product (whichever `page` prefixes the
current route), falling back to the segment `title` when none is active; the menu
switches between the segment `pages` (the active one is checked).

A product switcher should be **global** (visible on every page). Globalness comes
from **omitting `route`** (or setting `route: false`) — it is not tied to the
`logoTrailing` appearance. A routeless segment appears everywhere, so you can switch
products from anywhere, including the landing page. (Give a segment a `route` string
to scope it to that route prefix instead — see [Tabs](/guides/navigation#tabs).)

This suits docs that span multiple products — e.g. a **Products** switcher over
_Session Replay_ and _Web Analytics_ (note: no `route`, so it is global):

```json
{
  "navigation": {
    "segments": [
      {
        "title": "Products",
        // !diff +
        "appearance": "logoTrailing",
        // !diff +
        "trigger": "hover",
        "pages": [
          { "title": "Session Replay", "page": "products/session-replay" },
          { "title": "Web Analytics", "page": "products/web-analytics" }
        ]
      }
    ]
  }
}
```

The dropdown opens on `trigger: "hover"` (default) or `"click"`. A page may itself
declare a nested [`dropdownMenu`](/guides/navigation#dropdown-menu) to add submenus.

#### Per-product accent {label="Experimental"}

A `logoTrailing` page can declare a `color` (any CSS color). Accent-aware themes —
notably [`terrarium`](/guides/themes) — apply the **active** product's `color` as
`--theme-color-primary`, so links, the active sidebar item, and the active table-of-contents
entry all recolor per product (e.g. Nomad → green, Consul → pink, Vault → yellow).
Pair each `page` (the route prefix that drives which product is *active*) with an `href`
(the landing page the switcher navigates to):

```json
{
  "navigation": {
    "segments": [
      {
        "title": "HashiCorp",
        "appearance": "logoTrailing",
        "pages": [
          // !diff +
          { "title": "Nomad",  "page": "nomad",  "href": "nomad/docs/what-is-nomad",  "icon": "server",         "color": "#00ca8e" },
          // !diff +
          { "title": "Consul", "page": "consul", "href": "consul/docs/what-is-consul", "icon": "network-wired", "color": "#dc477d" },
          // !diff +
          { "title": "Vault",  "page": "vault",  "href": "vault/docs/what-is-vault",   "icon": "lock",          "color": "#ffcf25" }
        ]
      }
    ]
  }
}
```

Combine this with one route-scoped [`SidebarRoute`](/guides/navigation#routing) per product
so the sidebar swaps as you switch. The `terrarium` theme additionally renders a
`‹ {Product} Home` back-link, a colored product-icon header, and a **Filter sidebar** input.

### Tabs {label="Experimental"}

Set a segment's `appearance` to `"tabs"` to render its `pages` as a horizontal tab bar
in the sub-navigation, **scoped to the segment's `route`**. Because a `tabs` segment is
route-scoped, you can declare **one per product** to get a per-product tab bar that swaps
as you switch products — like HashiCorp's _Documentation / API / CLI / Tools / Plugins_.

Each tab is a section: its **`page`** is a route prefix (it decides which tab is *active*
— the tab stays highlighted across every page of that section) and its **`href`** is the
landing page the tab links to.

```json
{
  "navigation": {
    "segments": [
      {
        // !diff +
        "route": "nomad",
        // !diff +
        "appearance": "tabs",
        "pages": [
          { "title": "Documentation", "page": "nomad/docs", "href": "nomad/docs/what-is-nomad" },
          { "title": "API",           "page": "nomad/api",  "href": "nomad/api/index" },
          { "title": "CLI",           "page": "nomad/cli",  "href": "nomad/cli/index" }
        ]
      },
      {
        // a DIFFERENT product → different tabs
        "route": "vault",
        "appearance": "tabs",
        "pages": [
          { "title": "Documentation", "page": "vault/docs", "href": "vault/docs/what-is-vault" },
          { "title": "API",           "page": "vault/api",  "href": "vault/api/index" }
        ]
      }
    ]
  }
}
```

Give each section its own route-scoped [`SidebarRoute`](/guides/navigation#routing)
(`{ "route": "nomad/docs", … }`, `{ "route": "nomad/api", … }`, …) so the left sidebar
switches with the active tab.

**Where the tabs render** is controlled by `theme.appearance.tabs.surface`:

- default — a **sub-navigation** bar below the primary nav (the same `xyd-subnav` the
  global [`tabs`](#tabs) use, so every theme styles it consistently);
- `"center"` — the **center of the primary nav** (like HashiCorp Developer). The
  `terrarium` theme sets this by default.

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

## index.md

If you crate an `index.md` file at root of your documentation project, `xyd` will serve that content as index page.