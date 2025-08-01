---
title: Pages
icon: columns-2
---

# Pages Quickstart
:::subtitle
Learn how to create and structure pages in your documentation
:::

:::callout
Full API Reference you can find [here](/docs/reference/core/pagemeta).
:::

Each page is a `md`/`mdx` file that should follow [frontmatter](https://jekyllrb.com/docs/front-matter/) specification:

```md
---
title: My title
---
```

inside you docs project like follow:
```
.
├ folder-name
│  └─ your-page-within-folder.md
|
├─ your-page.md
|
└─ docs.json
```

:::callout
Writing page meta is required for [navigation](/docs/guides/navigation) and optionaly for other page meta features like [SEO](/docs/guides/seo).
:::

## Title
The title field is used for the page title (SEO) and for the sidebar navigation item:

```md
---
title: Writing quickstart
---
```

you can also set different title for sidebar:
```md
---
title: Writing quickstart # for SEO
sidebarTitlte:  Quickstart # visible in sidebar
---
```

## Description
The description field is used for SEO purposes and will be displayed in search engine results. It should be a concise summary of the page content.

```md [descHead="Tip" desc="More SEO page meta you can find [here](/docs/guides/seo)."]
---
title: My title
description: A brief summary of what this page is about
---
```

## Sidebar Title
You can set also different sidebar title.

```md [desc="Info" desc="By default <code>sidebarTitle = title</code>"]
---
title: My SEO title
sidebarTitle: My sidebar title
---
```

## Sidebar icons
You can customize the sidebar [icons](/docs/guides/icons) for each page by specifying an icon name. The icon will be displayed next to the page title in the navigation.

```md
---
title: My title
icon: book
---
```

## Page layout [maxTocDepth=3]

The Page Layout setting allows you to customize the appearance of your page through different layout modes. 
This setting is optional - if not specified, the page will use the default layout settings.

### Default
If no specific mode is given, the `page` will default to standard settings. 
This means the page will display with the default table of contents (if headings are present) and other standard elements, providing a typical layout without any special adjustments.
```md
---
title: My title
---
```

### Wide
In Wide Mode, you can hide the table of contents (ToC) on the right side of the page. 
This is particularly useful if your page doesn't have any headings or if you prefer to utilize the extra horizontal space for other content.
```md
---
title: My title
layout: wide
---
```

### Page
In Page mode only the header is showing up, the entire content area is removed from all styles it means you need to set all margins and paddings from scratch. It was designed to have a custom page possibilities leaving that is shared across all pages (header).
```md
---
title: My title
layout: page
---
```

### Reader
In Reader mode sidebar and ToC are hidden. All page margins and paddings are applied in the opposite of [Page mode](/docs/guides/pages#page). 
Use reader mode in blogs or other content focused pages.
```md
---
title: My title
layout: reader
---
```

### Custom {label="Coming Soon"}
Custom layout mode allows you to define your own page layout by specifying a custom component from scratch.
This gives you full control over the page structure and styling, enabling you to create unique layouts for specific pages.

```md
---
title: My title
layout: custom
---
```

## TOC [maxTocDepth=3]
The Table of Contents (TOC) is automatically generated based on the headings in your page. It provides easy navigation through your content and can be customized in several ways.

### Depth
You can customize the depth level of TOCs per page:
```md [descHead="Tip" desc="If you want to change the depth level globally, please check out [settings](/docs/guides/settings#reference)."]
---
maxTocDepth: 2
---
```

### Card
`tocCard` meta is useful for showing additional card below table of contents with addional info to your content.

```md
---
tocCard: 
    link: https://github.com/xyd-js/customization-samples
    title: Customization Samples
    description: Learn how to setup customize your docs
    icon: github
---
```

:::callout
If you want to learn more about toc anchors, check out [here](/docs/guides/writing-quickstart#toc-anchors).
:::

## Uniform {label="Experimental"}

`uniform` meta allows to load [`uniform function`](/docs/reference/functions/uniform) for entire page, learn more [here](/docs/guides/compose-content).

```md
---
title: Callouts
icon: info
layout: wide
uniform: "@components/writer/Callout/Callout.tsx"
---
```