---
title: Search Integrations
---

# Analytics Integrations
:::subtitle
Integrate with an analytics platform to track events
:::

Automatically send data about your documentation engagement to your third party analytics provider.

## All integrations
:::grid
- 
  - 
    :::guide-card{kind="secondary" title="Algolia" icon="<IconCode/>" href="/docs/guides/integrations/search/algolia"}
    Learn how to add send analytics events to Algolia
    :::
  - 
    :::guide-card{kind="secondary" title="Orama" icon="<IconCode/>" href="/docs/guides/integrations/search/orama"}
    Learn how to add send analytics events to Orama
    :::

:::


## Enable analytics
Set your analytics keys in `xyd.json` under the `integrations.analytics` section. 
The syntax for `xyd.json` is below.

You only need to include entries for the platforms you want to connect:

```json xyd.json
{
    "integrations": {
        "analytics": {
            "livesession": {
                "trackId": "required"
            }
        }
    }
}
```

## Supported events
* `CodeExampleChange`

*  `CodeTabChange`

*  `CodeCopy`

*  `CopyPage`