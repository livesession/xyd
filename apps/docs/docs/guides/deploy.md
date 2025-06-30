---
title: Deploy
icon: container
tocCard: 
    link: https://github.com/xyd-js/deploymen-samples
    title: Deployment Samples
    description: Learn how to deploy xyd docs
    icon: docs:github
---

# Deploy your `xyd` docs
:::subtitle
Learn how to make your docs available to the public
:::

You must follow the following steps to deploy your `xyd` docs:
:::steps
1. [npx](https://docs.npmjs.com/cli/v8/commands/npx) / [xyd CLI](http://npmjs.com/package/xyd-js) installed on CI.

2. You run build command inside your docs project.
:::


## Build

Run this command to build the docs:

:::tabs{kind="secondary"}
1. [npx](type=npx)
    ```bash [descHead="Info" desc="This produces a static files availalbe at <code>.xyd/build/client</code> folder within your docs project. You can serve that locally using popular static web servers or just deploy it on production."]
    $ npx xyd-js build
    ```

2. [CLI](type=xyd)
    ```bash [descHead="Info" desc="This produces a static files availalbe at <code>.xyd/build/client</code> folder within your docs project. You can serve that locally using popular static web servers or just deploy it on production."]
    $ xyd build
    ```
:::


## Deployment
Since `xyd build` produces static files you can deploy it on any infrastructure you want very easy.
Just point to generated folder which you could upload to your provider.

:::tabs{kind="secondary"}
1. [Netlify](platform=netlify)
    ```toml netlify.toml [descHead="Tip" desc="Check out [Netlify Deployment Sample](#)."]
    [build]
    command = "npx xyd-js build"
    publish = ".xyd/build/client"
    ```

2. [Vercel](platform=vercel)
    ```bash [descHead="Tip" desc="Check out [Vercel Deployment Sample](#)."]
    $ xyd build
    ```

3. [Cloudflare](platform=cloudflare)
    ```bash [descHead="Tip" desc="Check out [Cloudflare Deployment Sample](#)."]
    $ xyd build
    ```

4. [Render](platform=render)
    ```bash [descHead="Tip" desc="Check out [Render Deployment Sample](#)."]
    $ xyd build
    ```
:::