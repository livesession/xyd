---
title: Developer Content
icon: folder-code
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
You can also customize syntax highlighting. Please see [theme settings](/docs/guides/customization-quickstart#theme-reference) for more details.
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
```tsx{2}
const MyComponent = () => {
  return <div>Hello, world!</div>
}
```

You can also specify multiple single lines or ranges:

* Multiple single lines: `{1,3,5}`
* Line ranges: `{2-4}, {6-8}, {11-13}`
* Line ranges + single lines: `{1,6-8,11}`
* All together: `{1,3-5}`

**Input:**
~~~
```tsx{1,3-5}
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
```tsx{1,3-5}
const MyComponent = () => {
  return <div>
    <>
        Hello, world!
    </>
  </div>
}
```

## Code diff
**Input:**
~~~
```tsx
const MyComponent = () => {
  // !diff -
  return <div>Hello, world!</div>
  // !diff +
  return <div>Hello, new world!</div>
}
```
~~~

**Output:**
```tsx
const MyComponent = () => {
  // !diff -
  return <div>Hello, world!</div>
  // !diff +
  return <div>Hello, new world!</div>
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

## Import Code

You can import code from a file using the [`@importCode`](/docs/reference/functions/importCode) function:
```md
@importCode "./relative-to-current-file.tsx"
```

## Changelog

You can also render changelog page using the [`@changelog`](/docs/reference/functions/changelog) function:
```md
@changelog "~/CHANGELOG.md"
```