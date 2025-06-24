---
title: Quicktart
icon: rocket
tocCard: 
    link: https://github.com/xyd-js/starter
    title: Starter Kit
    description: Learn how to start building docs
    icon: docs:github
---

# Quickstart
:::subtitle
Start building modern documentation in record time
:::

Follow the instructions below to learn how to run, deploy, update and supercharge your documentation with `xyd`.

:::callout
**Prerequisite:** Please install Node.js (version 22 or higher) before proceeding.
:::

<!-- <UnderlineNav value={activeTab}>
    <UnderlineNav.Item value="cli" href="#cli">
        CLI
    </UnderlineNav.Item>
    <UnderlineNav.Item value="code" href="#code">
        Code
    </UnderlineNav.Item>
</UnderlineNav>  -->

**Step 1:** Install the <code>xyd</code> CLI:
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

**Step 2:** Navigate to the docs directory (where the [settings file](/docs/guides/settings) is located) and execute the following command:
```bash
xyd
```

## CLI versioning
Please note that each CLI release is associated with a specific version of <code>xyd</code>.
If your local website doesn't align with the production version, please update the CLI:
:::code-group{title="xyd update"}
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

## Publishing
Publishing changes depends on your preferences, the simplest way is to
use the one of infrastructure providers like Netlify or Vercel.
Learn more about [deploy](/docs/guides/deploy).

## Starter
Use our [starter kit](https://github.com/xyd-js/starter) to get up and running quickly.

## Online Demo
Please checkout [CodeSanbox demo](#).