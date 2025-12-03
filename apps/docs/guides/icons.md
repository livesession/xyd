---
title: Icons
icon: image
tocCard: 
    link: https://github.com/xyd-js/examples/tree/master/custom-icons
    title: Icon Samples
    description: Learn how to setup Icons
    icon: docs:github
---

# Icons
:::subtitle
Learn how to load icons
:::

The icon system supports multiple ways to load and use icons:

1. From [Iconify](http://iconify.design) CDN (default)
2. From local JSON files (must be a valid Iconify JSON)
3. From custom URLs (also valid iconify JSON)

:::callout
You can also use multiple icon libraries at once.
:::

## Configuration

Icons(:icon{name="image" size=16}) can be configured in your settings file: 

```json [!scroll]
{
  "theme": {
    "icons": {
      "library": [
        "lucide", // loads from iconify CDN with a default prefix e.g 'lucide'
        {
          "name": "mdi", 
          "version": "7.2.96" // also from iconify but with specified version
        },
        {
          "name": "./icons/custom-icons.json", // loads iconify JSON from a local file
          "default": true // and makes them as default (no prefix needed)
        },
        {
          "name": "https://example.com/icons.json" // load iconify JSON from an URL
        }
      ]
    }
  }
}
```


## Usage
Icons can be loaded in three places:
::::steps 

1. [Page meta](/guides/pages):
```md my-page.md [descHead="Info" desc="This allows to add icon into sidebar page item."]
---
icon: <icon_prefix>:<icon_name>

<!-- you can omit prefix if icon library is set as `default: true` -->
icon: <icon_name>
---
```

2. [Sidebar group](/guides/navigation#groups):
```json [descHead="Info" desc="This allows to add icon into specified sidebar group. "]
{
  "group": "Integrations",
  "pages": [
      {
          "group": "Analytics",
          // !diff +
          "icon": "chart-line",
          "pages": [
              ...
          ]
      }
  ]
}
```

3. [Page content](/guides/writing-quickstart):

:::code-group
```md
You can use :icon{name="image" size=16} inside your markdown page content too.
```

alternatively inside mdx:
```mdx
You can use <Icon name="image" size={16}/> inside your mdx page content too.
```
:::

::::
