---
title: Writing Quickstart
icon: letter-text
---

# Writing Quickstart
:::subtitle
Learn how to write content 
:::

Learn how to write documentation content using Markdown, MDX, and xyd's built-in components.

## Headers [maxTocDepth=3]
You can define headers using markdown syntax like:
```md
---
title: My Page Title
---

# My Header
```

with header subtitle:
```md
---
title: My Page Title
---

# My Header {subtitle="Learn how to use headers"}
```

alternatively:
```md
# My Header
:::subtitle
Learn how to use headers
:::
```

with header label:
```md
---
title: My Page Title
---

# My Header {label="Coming Soon"}
```

### Headers Anchors
Headers get automatically anchor links applied.
If you'd like to set a custom anchor,  add an `id` sugar syntax prop to the heading:
```mdx
## My custom anchors {#custom-anchors}
```
This sets the heading anchor to `#custom-anchors` instead of the default `#my-custom-anchors`.

### TOC Anchors
The table of contents (TOC) will be generated based on headings, you can also customize that:

```mdx
## Heading [!toc]
This heading will be **HIDDEN* from TOC.

## TOC Heading Only [toc]
This heading will **ONLY** be visible in TOC.
You can use it to add additional TOC items.

## TOC Changed [toc="toc changed"]
It display 'toc changed' in TOC section instead of 'TOC Changed'.
It's visible on the page too.

## TOC Force [+toc]
It adds heading to the TOC despite of `maxTocDepth`. 
It's visible on the page too.
```

:::callout
Learn more about Page Meta options for TOC [here](/docs/guides/pages#toc). 
:::

## Content
To write a content for your page, you can use the [MDX](https://mdxjs.com/) or [Markdown](https://www.markdownguide.org/) syntax.
You can also leverage built in [components](/docs/components) or [special symbols](/docs/guides/special-symbols) to enhance your content:

::::code-group

~~~md
# Quickstart

This is a quickstart guide for the `xyd` project.

:::callout
Tip: You can use the React `<Callout>` component to render a callout too
:::
~~~

~~~mdx
# Quickstart

This is a quickstart guide for the `xyd` project.

<Callout>
Tip: You can use the React `<Callout>` component to render a callout too
</Callout>
~~~
::::

:::callout
While MDX is powerful, xyd makes writing docs much easier using markdown [special symbols](/docs/guides/special-symbols).

But you can still use pure MDX or both if you want.
:::

## Markdown GFM
You can use GFM (GitHub Flavored Markdown) to write your content like this:
```mdx
# Heading
 
## Heading
 
### Heading
 
#### Heading
 
Hello World, **Bold**, _Italic_, ~~Hidden~~
 
1. First
2. Second
3. Third
 
- Item 1
- Item 2
 
> Quote here
 
![alt](/image.png)
 
| Table | Description |
| ----- | ----------- |
| Hello | World       |
```

## Component Directives
Use markdown directives (`:::`) to render components in markdown syntax (instead of MDX), the full list of components you can find [here](/docs/components).

For example you would render some of <code>xyd</code> components like this:

```mdx
:::callout
You can also use MDX version of the same [component](/docs/components).
:::
```

:::callout
You can also use MDX version of the same [component](/docs/components).
:::

### Tables
You can also use CSV-like version of declaring tables with some sugar-syntax:
~~~
:::table
```
[
    ["Syntax", "Description", "Markdown"],
    ["Header", "Title", "`#`"],
    ["Paragraph", "Text", "`*`"]
]
```
:::
~~~

:::callout
You can still use [GFM](https://github.github.com/gfm/#tables-extension-) version of tables too.
:::

### Steps
For creating steps you can use such us syntax:
~~~
:::steps
1. My First Steps

2. My Second Step

3. My Third Step
    ```ts
    console.log("You can also add code blocks in steps")
    ```
:::
~~~

### Tabs 
For creating tabs, you can use the following syntax:
```md [descHead="Tip" desc="Check out advanced tabs example [here](https://github.com/xyd-js/examples/tree/master/advanced-tabs)."]
:::tabs 
1. [CLI](tab=cli)
    Content for the CLI tab

2. [Code](tab=code)
    Content for the Code tab
:::
```

## MDX {label="Experimental"}
MDX combines Markdown with JSX, letting you use React components in your docs.

### Reusable components {label="Coming Soon"}

1. Creating a reusable component:
    ```mdx my-component.mdx
    Hello, this is my reusable component
    ```
    <br/>
2. Now, you can use it in your MDX files:
    ```tsx my-content.mdx
    import MyComponent from './my-component'

    <MyComponent />
    ```

### Reusable variables {label="Coming Soon"}

1. You can also use MDX for reusable variables, by exporting data from your MDX files:
    ```tsx reusable-variables.mdx
    export const title = 'Getting Starte';

    export const data = { category: "fantasy" };
    ```
    <br/>
    
2. Now, you can use it in your MDX files:
    ```mdx my-content.mdx
    ---
    title: My title
    description: My Description
    ---

    import { title, data } from './reusable-variables';

    Hello, my title is {title} and I like {data.category}.
    ```

### Exporting component variables {label="Coming Soon"}
1. You can also add variables that can be filled in via props when you import the file:
    ```mdx component-variables.mdx
    My favourite favurite book's category is {category}
    ```
    <br/>
2. And then pass variables as props:
    ```tsx
    import MyComponent from './component-variables'

    <MyComponent category="fantasy" />
    ```

This creates a navigation component with two tabs: "CLI" and "Code", each with its own content. The content for each tab follows the tab definition.

## Emojis 🎉
For declaring just copy and paste the emoji you want to use in your markdown, for example:

```
🔥