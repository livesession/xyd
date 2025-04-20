---
title: Guide Card
layout: wide
component: atlas
componentProps:
    references: "@uniform('@components/writer/GuideCard/GuideCard.tsx')"
---

<<<examples
- 
  :::code-group{title="Guide Cards"}
  ```jsx Guide Card Example
  function GuideCardV3() {
    return <div> Guide Card </div>
  }
  ```

  ```tsx Card Group V2 Sample
  function GuideCardV2() {
    return <div> Guide Card V2 </div>
  }
  ``` 
  :::

- 
  ```jsx 
  function GuideCard() {
    return <div> Guide Card </div>
  }
  ``` 
<<<

# My custom Name

A card component that displays content with a title and optional icon. The entire card is clickable and links to the specified URL.

:::grid
- 
  - 
    :::guide-card{title="Getting Started" icon="<IconCode/>" href="/guides/quickstart"}
    Start your journey with our comprehensive quickstart guide.
    :::
    
  - 
    :::guide-card{title="Routing Guide" icon="<IconCode/>" href="/guides/routing"}
    Learn about file-convention and settings-based routing in XYD.
    :::

- 
  - 
    :::guide-card{kind="secondary" title="Customization" icon="<IconCode/>" href="/guides/customization-introduction"}
    Explore how to customize and extend XYD to match your needs.
    :::
    
  - 
    :::guide-card{title="API Documentation" icon="<IconCode/>" href="/guides/openapi"}
    Discover how to document your APIs with OpenAPI specifications.
    :::
:::

