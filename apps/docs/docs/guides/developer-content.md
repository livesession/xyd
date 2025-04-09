---
title: Developer Content
---

# Developer Content
:::subtitle
Learn how to write content for developers
:::

In this guide, you'll learn how to write content for developers, like code snippets, examples, and more.

## Code Blocks
You can use standard markdown code blocks (\`\`\`) to write code blocks.
Syntax highlighting is automatically applied based on the language of the code.

**Input:**
~~~
```tsx
const MyComponent = () => {
  return <div>Hello, world!</div>
}
```
~~~

**Output:**
```tsx
const MyComponent = () => {
  return <div>Hello, world!</div>
}
```

:::callout
You can also customize syntax highlighting. Please see [here](/docs/developer-content#syntax-highlighting) for more details.
:::

## Line Highlighting

**Input:**
~~~
```tsx{2}
const MyComponent = () => {
  return <div>Hello, world!</div>
}
```
~~~

**Output:**
```tsx
const MyComponent = () => {
  return <div>Hello, world!</div>
}
```

You can also specify multiple single lines, ranges, or both:

* Multiple single lines: `{1,3,5}`
* Line ranges: `{2-4}, {6-8}, {11-13}`
* Line ranges + single lines: `{1,6-8,11}`

**Input:**
~~~
```tsx{1, 3-5}
const MyComponent = () => {
  return <div>
    <>
        Hello, world!
    </>
  </div>
}
```
~~~

**Output:**
```tsx
const MyComponent = () => {
  return <div>
    <>
        Hello, world!
    </>
  </div>
}
```

## Code Groups
You can use the `code-group` component to group multiple code blocks together.

**Input:**
~~~
:::code-group{title="xyd installation"}
```bash npm
npm i -g xyd-js
```

```bash yarn
yarn global add xyd-js
```

```bash pnpm
pnpm add -g xyd-js
```
:::
~~~

**Output:**
:::code-group{title="xyd installation"}
```bash npm
npm i -g xyd-js
```

```bash yarn
yarn global add xyd-js
```

```bash pnpm
pnpm add -g xyd-js
```
:::
