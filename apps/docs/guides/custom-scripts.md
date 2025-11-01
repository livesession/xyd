---
title: Custom Scripts
icon: braces
---

# Custom Scripts
:::subtitle
Fully customize your documentation with custom Tags & JS
:::

Add custom Tags & JS to your documentation to fully customize its behavior and appearance.

## Custom Tags
Add custom tags to the `<head>` of your xyd site. Can be useful for adding analytics and other third-party scripts and resources:

```json [descHead="Tip" desc="Check out custom tags example [here](https://github.com/xyd-js/examples/tree/master/custom-tags)."]
{
    "theme": {
        "head": [
            ["script", {"async": true, "href": "https://cdn.livesession.io/track.js"}]
        ]
    }
}
```

## Custom JS {label="Coming Soon"}
Custom JS lets you write JavaScript in separate files that are automatically injected across your documentation site. Use it to implement global features or integrate third-party services:
```json
{
    "theme": {
        "scripts": [
            "./scripts/livesession.ts"
        ]
    }
}
```

with a sample implementation:

```ts scripts/livesession.ts
import ls from "@livesession/browser";

// init a script, trackID is required
ls.init("YOUR TRACKID", options, sdkOptions);
```