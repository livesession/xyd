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
1. [xyd](http://npmjs.com/package/xyd-js) is installed on CI / locally.

2. You run `xyd` command inside your docs project.
:::


## Build

Run this command to build the docs:
```bash [descHead="Info" desc="it produces a static files availalbe at <code>.xyd/build/client</code> folder within your docs project. You can serve that locally using popular static web servers or just deploy it on production."]
$ xyd build
```

## Deployment
Since `xyd build` produces static files you can deploy it on any infrastructure you want very easy.
Just point to generated folder which you could upload to your provider.

:::callout
Please make sure you installed [xyd](/docs/guides/quickstart) CLI on you CI/CD before.
:::

