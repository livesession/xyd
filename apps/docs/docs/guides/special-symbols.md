---
title: Special Symbols
icon: omega
---

# Special Symbols
:::subtitle
Learn how to use special symbols to make your content more powerful
:::

<code>xyd</code> provides several special symbols that enhance your markdown content. 
Learn how to use them below.

## `Component Directive`
Component Directive (`:::<component>`) is used to render UI [components](/docs/components) directly in your markdown:

```mdx
:::callout
This is a callout component
:::
```

to pass props into component use `{<key>=<value>}`:
```mdx
:::callout{kind="warning"}
Take care!
:::

:::callout{kind="warning" icon="⚠️"}
You can pass multiple too!
:::
``` 

if component props accept booleans you can use sugar syntax:
```mdx
:::my-component{mybool}
Bool true sugar syntax
:::

// for negation
:::my-component{!mybool}
Bool false sugar syntax
:::
```

if component does not have a children prop you can use shorter directive syntax(`::`):
```mdx
::my-component{label="Cool"}
```

## `Function Calling`
Function Calling (`@<function>`) is used to execute [functions](/docs/reference/functions) within your markdown content:

```mdx
@import "~/snippets/Hello.ts"
```
:::callout
`~/` points to root of your docs project.
:::

## `Output Variable` {label="Coming Soon"}
Output Variable (`@out(<name>=<expression>)`) is used to pass output variables from content files, useful for [composing](/docs/guides/compose-content) documentation content:

~~~md
@out(examples=(
  ```md
  :::callout
  Note that you must have an Admin or Owner role to manage webhook settings.
  :::
  ```
))
~~~

or if output variable is a callback:
~~~md
@.examples(title="Samples")
```md
:::callout
Note that you must have an Admin or Owner role to manage webhook settings.
:::
```
@end
~~~

###  Output Variable API
Define your own custom output variable using follow API:

:::code-group
```tsx Settings API
export default {
  outputVariables: {
    examples: Examples
  }
}

function Examples({title, children}) {
  // your custom logic here
}
```

```tsx Theme API
import {BaseTheme} from "xyd-js/themes"

export class MyTheme extends BaseTheme {
  contructor() {
    super()

    this.outputVariables({
      examples: Examples,
    })
  }
}

function Examples({title, children}) {
  // your custom logic here
}

```
:::

## `Read Variable` {label="Coming Soon"}
Read Variable (`{<read_variable>}`) is used to access read variables from frontmatter and other pages:

```mdx
{frontmatter.title}
```

## `Attributes`
Some built-in tags has abilities to pass attributes (`<tag|expression>[<attributes>]`):
```mdx
## Hide me from TOC [!toc]

## Add me to TOC while not render on page [toc]

## Component Directive (`:::`) [toc="Component Directive"]
```

:::callout
Learn more about toc attributes [here](/docs/guides/writing-quickstart#toc-anchors).
:::

## Full Example
Here's how you can combine all these symbols in a single markdown file:

```md
---
title: Special symbols usage
---

@.toc(anchor="bottom")
:::toc-card{title="Starter" href="https://github.com/xyd-js/starter"}
  Check out our starter repo
:::
@end

# {frontmatter.title}

## Import Example {toc="Import example"}
You can import code snippets using the `@import` function:

@import "~/snippets/my-snippet.ts"

:::callout
`~` refers to the local path of your docs.
:::
```

## Summary
These special symbols provide powerful ways to enhance your markdown documentation:

- **Components**: Add rich UI elements directly in markdown
- **Functions**: Import and execute code dynamically
- **Variables**: Pass data between content files
- **Frontmatter Access**: Use metadata from your content files

By combining these features, you can create interactive and dynamic documentation with minimal effort.

:::callout
Some possibitlies from special symbols are availalbe in MDX due to it's nature, e.g importing files.

The main difference between symbols and MDX is a simple, more markdown like
grammar and text-based hierarchy instead of component-like.
:::