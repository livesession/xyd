---
title: Analytics Integrations
---

# Analytics Integrations {label="Coming Soon"}
:::subtitle
Integrate with an analytics platform to track events
:::

Automatically send data about your documentation engagement to your third party analytics provider.

## All integrations
:::grid
- 
  - 
    :::guide-card{kind="secondary" title="LiveSession" icon="<Icon name='code'/>" href="/docs/guides/integrations/analytics/livesession"}
    Learn how to add send analytics events to LiveSession
    :::

:::


## Enable analytics
Set your analytics keys in `docs.json` under the `integrations.analytics` section. 
The syntax for `docs.json` is below.

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