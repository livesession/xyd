---
title: LiveSession
---

# LiveSession
:::subtitle
Learn how to send analytics events to LiveSession
:::

Add the following to your docs.json file to send analytics to LiveSession.

:::code-group{title="Analytics options in docs.json"}
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