---
title: Migration tool
icon: download
---

# Migrations {label="Experimental"}
:::subtitle
Learn how to migrate from your existing docs framework
:::

![migrateme](/public/assets/migrateme.gif)

:::grid
- 
  - 
    :::guide-card{title="Mintlify (experimental)" icon="docs:mintlify" kind="secondary" href="/docs/resources/migration-tool#mintlify"}
    Migrate from Mintlify documentation framework.
    :::
    
  - 
    :::guide-card{title="Docusaurus (soon)" icon="docs:docusaurus" kind="secondary" href="https://docusaurus.io/"}
    Migrate from Docusaurus documentation framework.
    :::

- 
  - 
    :::guide-card{title="VitePress (soon)" icon="docs:vitepress" kind="secondary" href="https://github.com/vuejs/vitepress"}
    Migrate from VitePress documentation framework.
    :::
    
  - 
    :::guide-card{title="Starlight (soon)" icon="docs:starlight" kind="secondary" href="https://starlight.astro.build"}
    Migrate from Starlight documentation framework.
    :::

- 
  - 
    :::guide-card{title="Nextra (soon)" icon="docs:nextra" kind="secondary" href="https://nextra.site/"}
    Migrate from Nextra documentation framework.
    :::
    
  - 
    :::guide-card{title="Fumadocs (soon)" icon="docs:fumadocs" kind="secondary" href="https://fumadocs.dev/"}
    Migrate from Fumadocs documentation framework.
    :::

- 
  - 
    :::guide-card{title="Fern (soon)" icon="docs:fern" kind="secondary" shref="https://buildwithfern.com/"}
    Migrate from Fern documentation framework.
    :::
:::

## Commands

* `xyd migrateme [path]` - converts by provided path to your docs source code. This command will automatically detect used framework.

## Mintlify {label="Experimental"}

Automatically converts your Mintlify documentation to xyd format. Migrates navigation, colors, branding, MDX content, and components.

```bash
xyd migrateme ./path/to/your/mintlify/docs
```

See example migration in our [examples repository](https://github.com/xyd-js/examples/tree/master/migration-mintlify).

## Preview {label="Coming Soon"}

You can also preview your docs online before migration [here](https://preview.xyd.dev). 