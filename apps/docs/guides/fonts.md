---
title: Fonts
icon: text-cursor
---

# Fonts
:::subtitle
Learn how to load custom fonts
:::

:::callout
By default font is loaded based on specific [theme](/guides/themes). The system automatically selects appropriate fonts based on your chosen theme to ensure optimal readability and visual consistency.
:::

## Configuration

```json 
{
    "theme": {
        "fonts": {
            "family": "Roboto",
            "src": "https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100..900;1,100..900&display=swap"
        }
    }
}
```

you can also set font settings for specific areas:

:::tabs{kind="secondary"}
1. [Body](type=body)
    ```json
    {
        "theme": {
            "fonts": {
                "body": {
                    "family": "Roboto",
                    "src": "https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100..900;1,100..900&display=swap"
                }
            }
        }
    }
    ```

2. [Codeblocks](type=coder)
    ```json
    {
        "theme": {
            "fonts": {
                "coder": {
                    "family": "\"JetBrains Mono\", monospace",
                    "src": "https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&display=swap"
                }
            }
        }
    }
    ```
:::

or use any `src` you want:
```json
{
    "theme": {
        "fonts": {
            "coder": {
                "family": "JetBrains Mono Variable",
                "src": "https://cdn.jsdelivr.net/fontsource/fonts/jetbrains-mono:vf@latest/latin-wght-normal.woff2"
            }
        }
    }
}
```


## Atomic Loads

You can also load multiple font atomically by using an array configuration. This approach gives you precise control over which font weights are loaded, optimizing performance by only loading the specific weights you need:

```json [descHead="Info" desc="This configuration will automatically generate <code>@font-face</code> declarations for each font weight specified in the array."]
    {
        "theme": {
            "fonts": {
                "coder": [
                    {
                        "family": "Monaspace Xenon",
                        "weight": 200,
                        "src": "https://cdn.jsdelivr.net/fontsource/fonts/monaspace-xenon@latest/latin-200-normal.woff2"
                    },
                    {
                        "family": "Monaspace Xenon",
                        "weight": 400,
                        "src": "https://cdn.jsdelivr.net/fontsource/fonts/monaspace-xenon@latest/latin-400-normal.woff2"
                    }
                ]
            }
        }
    }
```

## Bundle {label="Coming Soon"}

Bundling helps self-hosting fonts that can significantly improve website performance by eliminating the extra latency caused by additional DNS resolution and TCP connection establishment that is required when using a CDN like Google Fonts.

```json [descHead="Info" desc="This will downloads fonts during build and self-host at the end."]
{
    "theme": {
        "fonts": {
            "body": {
                "bundle": true,
                "family": "Roboto",
                "src": "https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100..900;1,100..900&display=swap"
            }
        }
    }
}
```