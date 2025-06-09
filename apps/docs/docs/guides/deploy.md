---
title: Deploy
icon: container
---

# Deploy your `xyd` docs
:::subtitle
Learn how to make your docs available to the public
:::

You must follow the following steps to deploy your `xyd` docs:
* [xyd](http://npmjs.com/package/xyd-js) is installed on CI / locally.

* You run `xyd` command inside your docs project.

## Build and test

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

## Deployment
Since `xyd build` produces static files you can deploy it on any infrastrucutre you want very easy.
After a build it produces `.xyd/build/client` folder which you could upload to your provider.

:::callout
Many deployment providers have one-step configuration to just point to generated static folder.
:::

