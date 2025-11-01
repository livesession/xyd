---
title: Deploy
icon: container
tocCard: 
    link: https://github.com/xyd-js/deploy-samples
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
1. [bunx](https://bun.sh/docs/cli/bunx) / [npx](https://docs.npmjs.com/cli/v8/commands/npx) / [xyd CLI](http://npmjs.com/package/xyd-js) installed on CI.

2. You run build command inside your docs project.
:::


## Build

Run this command to build the docs:

:::tabs{kind="secondary"}
1. [bunx](type=bunx)
    ```bash [descHead="Info" desc="This produces a static files availalbe at <code>.xyd/build/client</code> folder within your docs project. You can serve that locally using popular static web servers or just deploy it on production."]
    $ bunx xyd-js build
    ```

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
    ```toml netlify.toml [descHead="Tip" desc="Check out [Netlify Deployment Sample](https://github.com/xyd-js/deploy-samples/tree/master/netlify)."]
    [build]
    command = "bunx xyd-js build"
    publish = ".xyd/build/client"
    ```

2. [Vercel](platform=vercel)
    ```json vercel.json [descHead="Tip" desc="Check out [Vercel Deployment Sample](https://github.com/xyd-js/deploy-samples/tree/master/vercel)."]
    {
      "buildCommand": "bunx xyd-js build",
      "outputDirectory": ".xyd/build/client"
    } 
    ```

3. [Cloudflare](platform=cloudflare)
    ```toml wrangler.toml [descHead="Tip" desc="Check out [Cloudflare Deployment Sample](https://github.com/xyd-js/deploy-samples-cloudflare)."]
    name = "your-xyd-docs-name"
    main = "./index.ts"             
    compatibility_date = "2025-07-01"

    [build]
    command = "bunx xyd-js build"

    [assets]
    directory = ".xyd/build/client"     
    binding = "ASSETS"                  
    not_found_handling = "single-page-application"
    ```

    ```ts index.ts
    export default {
        async fetch(request: Request, env: any, ctx: ExecutionContext): Promise<Response> {
            return env.ASSETS.fetch(request);
        }
    }
    ```

4. [Render](platform=render)
    ```yaml render.yaml [descHead="Tip" desc="Check out [Render Deployment Sample](https://github.com/xyd-js/deploy-samples-render)."]
    services:
    - type: web
        name: your-xyd-docs-name
        env: static
        buildCommand: bun x xyd-js build
        staticPublishPath: .xyd/build/client 
        envVars:
        - key: BUN_VERSION
            value: 1.1.0
    ```

5. [DigitalOcean](platform=digitalocean)
    ```yaml .do/deploy.template.yaml [descHead="Tip" desc="Check out [DigitalOcean Deployment Sample](https://github.com/xyd-js/deploy-samples-digitalocean)."]
    spec:
     name: your-xyd-docs-name
     static_sites:
     - name: your-xyd-docs-name
       git:
         repo_clone_url: https://github.com/xyd-js/deploy-samples-digitalocean.git
         branch: master
       environment_slug: node-js
       build_command: npm install -g bun && bunx xyd-js build
       output_dir: .xyd/build/client
   ```
:::

:::callout
Check out more [Deploy Samples](https://github.com/xyd-js/deploy-samples).
:::