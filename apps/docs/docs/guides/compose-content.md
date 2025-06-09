---
title: Compose Content
icon: docs:atom-2-line
---

# Compose Content
:::subtitle
Learn how to streamline content experience
:::

`xyd` combines generated and manual content into composition to create powerful documentation. Use composition along with [uniform](/docs/guides/apitoolchain), [components](/docs/components) or [functions](/docs/reference/functions/overview) to build rich, interactive documentation.

## Supported uniform extensions
Uniform translates code automatically based on supported extensions:

* `.tsx` for React components
* `.ts` for TypeScript code (soon)
* `.py` for Python code (soon)
* `.go` for Go code (soon)

## Compose Uniform Pages

The `uniform` field in page meta generates API documentation automatically:

~~~md
---
title: Callouts
icon: info
layout: wide
uniform: "@components/writer/Callout/Callout.tsx"
---
~~~

now with our custom composed content:
~~~md
---
<!-- ... -->
---

<!-- BELOW CONTENT IS COMPOSED - EXTENDS API PAGE BY CUSTOM CONTENT -->
### Examples
:::callout
Note that you must have an Admin or Owner role to manage webhook settings.
:::

<!-- YOU CAN USE OUTPUT VARIABLES TOO -->
<<<examples
```tsx
<Callout>
Note that you must have an Admin or Owner role to manage webhook settings.
</Callout>
```

```md
:::callout
Note that you must have an Admin or Owner role to manage webhook settings.
:::
```
<<<
~~~

:::callout
All available output variables within uniform compose you can find [here](/docs/reference/composer/uniform/output-variables). 
:::

