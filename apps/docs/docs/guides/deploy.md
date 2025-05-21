---
title: Deploy
---

# Deploy your `xyd` docs
:::subtitle
Learn how to make your docs available to the public
:::

You must follow the following steps to deploy your `xyd` docs:
* The <code>xyd</code> site is inside the docs directory of your project.

* You are using the default build output directory (.xyd/build).

* [xyd](http://npmjs.com/package/xyd-js) is installed on your computer locally as CLI or package.json dependency.

## Build and test

:::tabs
1. [CLI](tab=cli)
    :::steps
    1. Run this command to build the docs:
        <br/>
        ```bash
        $ xyd build
        ```

    2. Once built, preview it locally by running:
        <br/>
        ```bash
        $ xyd start
        ```

    3. You can also configure the port of the server by passing --port as an argument.
        <br/>
        ```bash
        $ xyd start --port 3000
        ```
        <br/>
        Now you can visit [`http://localhost:3000`](http://localhost:3000)` to see the preview.
    :::

2. [Code](tab=code)
    :::steps
    1. Find you best code
        <br/>
        ```ts
        console.log(5)
        ```

    2. Check if it works
        <br/>
        ```bash
        $ xyd start
        ```
    :::
:::
<br/>
<br/>

## Deployment Providers
#### Netlify / Vercel / Cloudflare Pages
