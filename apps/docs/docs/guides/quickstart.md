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
**Prerequisite:**  Node 22.12+
:::

## Installation

::::steps
1. Install the <code>xyd</code> CLI:
:::code-group{title="xyd installation"}
```bash bun
bun add -g xyd-js
```

```bash pnpm
pnpm add -g xyd-js
```

```bash npm
npm i -g xyd-js
```
:::

2. Clone [starter](https://github.com/xyd-js/starter) by following command:
```
git clone https://github.com/xyd-js/starter
cd starter
```

3. Execute [CLI](https://www.npmjs.com/package/xyd-js) with the following command:
```bash [descHead="Info" desc="Above command runs a dev server"]
xyd
```
::::

## CLI versioning
Please note that each CLI release is associated with a specific version of <code>xyd</code>.
If you have troubles, please update the CLI:
:::code-group{title="xyd update"}
```bash bun
bun add -g xyd-js
```

```bash pnpm
pnpm add -g xyd-js
```

```bash npm
npm i -g xyd-js
```
:::

## Troubleshooting
If you have troubles with CLI the common task is deleting `xyd` cache:
```bash
rm -rf .xyd
```


## Publishing
Publishing changes depends on your preferences, the simplest way is to
use the one of infrastructure providers like Netlify or Vercel.
Learn more about [deploy](/docs/guides/deploy).

## Starter
Use our [starter kit](https://github.com/xyd-js/starter) to get up and running quickly.

## Examples
Please checkout [examples](https://github.com/xyd-js/examples) to learn how to setup docs as you want.

## CodeSandbox Demo
Please checkout [CodeSanbox demo](https://codesandbox.io/p/github/xyd-js/deploy-samples-codesandbox).

<!-- ## API Docs Playground
Please checkout [API docs demo](http://apidocs-demo.xyd.dev). -->
