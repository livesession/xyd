---
title: "@out"
---

# @out {label="Coming Soon"}
:::subtitle
Learn how to use `@out` function
:::

The `@out` function allows you set output variables

## Basic Usage

:::code-group
```md set
@out(VAR_NAME=<EXPRESSION>)
```

```md callback
@.<VAR_NAME>(<PROPS>)
<CHILDREN>
@end
```
:::

for example:
~~~mdx
@out(examples=(
  ```md
  :::callout
  Note that you must have an Admin or Owner role to manage webhook settings.
  :::
  ```
))
~~~

or if output variable is a callback:

~~~mdx
@.examples(title="Samples")
```md
:::callout
Note that you must have an Admin or Owner role to manage webhook settings.
:::
```
@end
~~~