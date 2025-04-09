---
title: Markdown extensions
---

# Markdown Extensions
:::subtitle
Learn how to use built in Markdown extensions
:::

<code>xyd</code> provides many useful extensions to markdown language,
for example [GFM](https://github.github.com/gfm/) (GitHub Flavored Markdown) or [Markdown Directives](https://github.com/remarkjs/remark-directive).

:::callout
The full list of default used extensions you can find [here](https://github.com/livesession/xyd/blob/master/packages/xyd-content/packages/md/plugins/index.ts)
:::

## GFM
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


## MDX
MDX combines Markdown with JSX, letting you use React components in your docs.

### Reusable components

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

### Reusable variables

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

### Exporting component variables
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

## Headers Anchors
Headers(`#`) get automatically anchor links applied, anchors can also 
be configured using the `anchor` option.

If you'd like to set a custom anchor,  add a suffix to the heading:
```mdx
# My custom anchors {#custom-anchors}
```
This sets the heading anchor to `#custom-anchors` instead of the default `#my-custom-anchors`.

## TOC Anchors
The table of contents (TOC) will be generated based on headings, you can also customise the effects of headings:

```mdx
# Heading {!toc}
This heading will be hidden from TOC.

# TOC Heading Only {toc}
This heading will **only** be visible in TOC, you can use it to add additional TOC items.

# TOC Changed{toc="toc changed"}
It display 'toc changed' in TOC section instead of 'TOC Changed'
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

:::guide-card{icon="<IconCode/>" title="Component Directives" href="https://github.com/xyd-js/xyd-samples/tree/main/component-directives"}
Explore samples with component directives
:::

## Emojis 🎉
For declaring just copy and paste the emoji you want to use in your markdown, for example:

```
🔥