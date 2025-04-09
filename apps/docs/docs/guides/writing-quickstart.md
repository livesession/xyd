---
title: Writing quickstart
---

# Writing Quickstart
:::subtitle
Learn how to write content and navigation metadata 
:::

## Introduction

Each page is an `mdx`/`md` file that should follow [frontmatter](https://jekyllrb.com/docs/front-matter/) specification.

```mdx
---
title: My title
---
```

:::callout
 Technically, <code>xyd</code> uses [gray-matter](https://github.com/jonschlinkert/gray-matter) to parse the metadata.
:::

> Writing metadata in frontmatter is required for navigation and optionaly for other features like SEO.

## Metadata Specification

### Title
The title field is used for the page title and for the sidebar navigation item.

```mdx
---
title: Writing quickstart
---
```

### Description
The description field is used for SEO purposes and will be displayed in search engine results. It should be a concise summary of the page content.

```mdx
---
title: My title
description: A brief summary of what this page is about
---
```

### Sidebar icons
You can customize the sidebar icon for each page by specifying an icon name. The icon will be displayed next to the page title in the navigation.

```mdx
---
title: My title
icon: book
---
```

Available icons are based on [Lucide icons](https://lucide.dev/icons/). You can use any icon name from their collection.

### Page layout

The Page Layout setting allows you to customize the appearance of your page through different layout modes. 
This setting is optional - if not specified, the page will use the `default` layout settings.

#### Default layout
If no specific mode is given, the page will default to standard settings. 
This means the page will display with the default table of contents (if headings are present) and other standard elements, providing a typical layout without any special adjustments.
```mdx
---
title: My title
---
```

#### Wide layout
In Wide Mode, you can hide the table of contents (ToC) on the right side of the page. 
This is particularly useful if your page doesn't have any headings or if you prefer to utilize the extra horizontal space for other content.s
```mdx
---
title: My title
layout: wide
---
```

#### Center layout
Center Mode removes the sidebar and the table of contents, and centers the page content. 
This mode is great for changelogs or any page where you want to focus on the content.

```mdx
---
title: My title
layout: center
---
```

## Content 
To write a content for your page, you can use the [MDX](https://mdxjs.com/) or [Markdown](https://www.markdownguide.org/) syntax.
You can also leverage built in [components](/docs/api/components), [extensions](/docs/markdown-extensions) and [special symbols](#) to enhance your content.

```mdx
# Quickstart

This is a quickstart guide for the `xyd` project.

:::callout
    Tip: You can use the React `<Callout>` component to render a callout too
:::
```


