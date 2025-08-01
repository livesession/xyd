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

## Syntax Highlighting 
Default syntax highlighting depends on used theme but you can override it via [`docs.json`](/docs/guides/settings):
```json [descHead="Tip" desc="Check out syntax highlighting [example](https://github.com/livesession/xyd/blob/master/packages/xyd-components/src/coder/themes/classic.ts)."]
{
  "theme": {
    "coder": {
      "syntaxHighlight": "<name> or <theme_object>"
    }
  }
}
```

:::callout
You can use the [Theme Editor](https://themes.codehike.org/editor) to customize any of the built-in themes or any theme from the [VS Code marketplace](https://marketplace.visualstudio.com/search?target=VSCode&category=Themes).
:::

&nbsp;
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

&nbsp;
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

&nbsp;
## Code Groups
You can use the `code-group` component to group multiple code blocks together.

**Input:**
~~~
:::code-group{title="xyd installation"}
```bash bun
bun add -g xyd-js
```

```bash npm
npm i -g xyd-js
```
:::
~~~

**Output:**
:::code-group{title="xyd installation"}
```bash bun
bun add -g xyd-js
```

```bash npm
npm i -g xyd-js
```
:::

&nbsp;
## Code Attributes [maxTocDepth=3]

Code attributes allow you to customize the behavior and appearance of code blocks. Attributes are specified within square brackets `[]` after the language identifier and before the code content.

**Syntax:**
~~~
```language [attribute1 attribute2]
your code here
```
~~~

### Line Numbers
You can add line numbers to code blocks by adding the `lines` attribute after the language identifier.

**Input:**
~~~
```bash [lines]
npm i -g xyd-js
```
~~~

**Output:**
```bash [lines]
npm i -g xyd-js
```

you can also manage line numbers globally:
```json docs.json
{
  "theme": {
    "coder": {
      "lines": true | false
    }
  }
}
```

### Disable Scroll
To make a code snippet display in full height without scrolling, you can use the `!scroll` attribute:

**Input:**
~~~
```bash [!scroll]
# your long code snippet but want to show in full height
```
~~~

**Output:**
```bash [!scroll]
# your long code snippet but want to show in full height
```

you can also manage scroll globally:
```json docs.json
{
  "theme": {
    "coder": {
      "scroll": false | true
    }
  }
}
```

### Code Description
**Input:**
~~~
```bash [descHead="Tip" desc="Install CLI to **run** and **build** your docs."]
npm i -g xyd-js
```
~~~

**Output:**
```bash [descHead="Tip" desc="Install CLI to **run** and **build** your docs."]
npm i -g xyd-js
```

:::callout
Currently `desc` supports a basic markdown syntax like `**`, `*` or `~~` but **DOES NOT** support more [advanced writing](/docs/guides/special-symbols) features.
:::

you can also use custom [icon](/docs/guides/icons):
~~~
```bash [descIcon="folder-code"]
npm i -g xyd-js
```
~~~

**Output:**
```bash [descIcon="folder-code" descHead="Tip" desc="Install CLI to **run** and **build** your docs."]
npm i -g xyd-js
```

## Import Code

You can import code from a file using the [`@importCode`](/docs/reference/functions/importCode) function:
```md
@importCode "./relative-to-current-file.tsx"
```

## Include

You can use [@include](/docs/reference/functions/include) function to include another content files in current content:
```md [descHead="Tip" desc="You can include <code>.mdx</code> files too, check out [React Components](/docs/guides/react-components) guide."]
@include "./relative-to-current-file.md"
```

## Changelog

You can also render changelog page using the [`@changelog`](/docs/reference/functions/changelog) function:
```md
@changelog "~/CHANGELOG.md"
```

currently supported changelog format:
```md [descHead="Tip" desc="Check out more advanced [example](https://github.com/xyd-js/examples/tree/master/graphql/docs/api/todos-api/changelog/.data/CHANGELOG.md)."]
## [VERSION] - <LABEL>
### <HEADING>
<CONTENT>

### <HEADING>
<CONTENT>

---

## [VERSION] - <LABEL>
### <HEADING>
<CONTENT>

### <HEADING>
<CONTENT>
```