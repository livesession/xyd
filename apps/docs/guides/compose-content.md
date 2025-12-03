---
title: Compose Content
icon: docs:atom-2-line
---

# Compose Content {label="Experimental"}
:::subtitle
Learn how to streamline content experience
:::

`xyd` combines generated and manual content into composition to create powerful documentation. Use composition along with [uniform](/guides/apitoolchain), [components](/components) or [functions](/reference/functions/overview) to build rich, interactive documentation.

## Supported uniform extensions
Uniform translates code automatically based on supported extensions:

* `.tsx` for React components
* `.ts` for TypeScript code (soon)
* `.py` for Python code (soon)
* `.go` for Go code (soon)

## Uniform Pages

The `uniform` field in page meta generates API documentation automatically:

~~~md
---
title: Callouts
icon: info
layout: wide
uniform: "@components/writer/Callout/Callout.tsx"
---
~~~

## Compose Uniform Pages
You can also customize uniform pages:
~~~md
---
<!-- ... -->
---

<!-- BELOW CONTENT IS COMPOSED - EXTENDS API PAGE BY CUSTOM CONTENT -->
### Examples
:::callout
Note that you must have an Admin or Owner role to manage webhook settings.
:::
~~~

### Output Variables {label="Coming Soon"}
~~~md
<!--  -->

<!-- YOU CAN USE OUTPUT VARIABLES TOO -->
@let(
.examples = (
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
))
~~~

