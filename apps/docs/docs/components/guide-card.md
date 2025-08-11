---
title: Guide Card
icon: square-mouse-pointer
layout: wide
uniform: "@components/writer/GuideCard/GuideCard.tsx"
---

### Examples

:::grid
- 
  - 
    :::guide-card{title="Getting Started" icon="<Icon name='code'/>" href="/guides/quickstart"}
    Start your journey with our comprehensive quickstart guide.
    :::
    
  - 
    :::guide-card{title="Routing Guide" icon="<Icon name='code'/>" href="/guides/routing"}
    Learn about file-convention and settings-based routing in xyd.
    :::

- 
  - 
    :::guide-card{kind="secondary" title="Customization" icon="<Icon name='code'/>" href="/guides/customization-introduction"}
    Explore how to customize and extend xyd to match your needs.
    :::
    
  - 
    :::guide-card{title="API Documentation" icon="<Icon name='code'/>" href="/guides/openapi"}
    Discover how to document your APIs with OpenAPI specifications.
    :::
:::

<<<examples
```tsx
:::guide-card{title="Getting Started" icon="code" href="/guides/quickstart"}
Start your journey with our comprehensive quickstart guide.
::: 
```

```tsx
<GuideCard
  title="Routing Guide"
  icon="code"
  href="/guides/routing"
>
  Learn about file-convention and settings-based routing in xyd.
</GuideCard>
```
<<<