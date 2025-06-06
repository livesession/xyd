---
title: Migration tool
icon: download
---

# Migrations
:::subtitle
How to migrate documentation from your existing docs framework
:::

You can use our [public packages](#) to convert your existing documentation to xyd.

We currently support automated migration for:
* [Docusaurus](https://docusaurus.io/) (soon)

* [VitePress](https://github.com/vuejs/vitepress) (soon)

* [Starlight](https://starlight.astro.build) (soon)

* [Nextra](https://nextra.site/) (soon)

* [Fumadocs](https://fumadocs.dev/) (soon)

* [Mintlify](https://mintlify.com/) (soon)

* [Fern](https://buildwithfern.com/) (soon)


Alternatively you can use [web scraper tool](#) to convert your documentation by providing an URL to your docs.

:::callout
Don't see your docs framework or have a home grown system? We can still help! Please [contact us](https://github.com/livesession/xyd).
:::

## Commands

* `xyd migrateme [path | url]` - converts by provided path to your docs source code. Alternatively an url to your deployed docs.
This command will automatically detect used framework.
