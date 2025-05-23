---
title: LiveSession
---

# LiveSession
:::subtitle
Learn how to send analytics events to LiveSEssion
:::

Add the following to your docs.json file to send analytics to LiveSession.

:::code-group{title="Analytics options in xyd.json"}
```json Schema
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

```json Example
{
    "integrations": {
        "analytics": {
            "livesession": {
                "trackId": "aeb.beaea"
            }
        }
    }
}
```

:::