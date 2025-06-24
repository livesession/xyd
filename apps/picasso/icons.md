---
title: Icons
icon: image
---

# Icons {subtitle="Start using icons"}

One more reason is a rich icons library possibilities.

## Iconify Icons [toc]
```json [!scroll descHead="Iconify Icons" desc="Use rich icons hub, learn more [here](https://xyd.dev/docs/guides/icons)."]
{
  "theme": {
    "icons": {
      "library": [
        "lucide", 
        {
          "name": "./icons/custom-icons.json", 
        },
        {
          "name": "https://example.com/icons.json" 
        }
      ]
    }
  }
}
```

## Render Icon [toc]
&nbsp;
```md [descHad="Render Icon" desc="You can then render that icons easily."]
You can use :icon{name="lucide:image" size=16} on markdown page.
```
