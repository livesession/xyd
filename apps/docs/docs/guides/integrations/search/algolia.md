---
title: Algolia
---

# LiveSession
:::subtitle
Learn how to send analytics events to LiveSEssion
:::

Add the following to your docs.json file to send analytics to LiveSession.

:::code-group{title="Analytics options in docs.json"}
```json Schema
{
    "integrations": {
        "search": {
            "algolia": {
                "appId": "required",
                "apiKey": "required"
            }
        }
    }
}
```

```json Example
{
    "integrations": {
        "search": {
            "algolia": {
                "appId": "123",
                "apiKey": "321"
            }
        }
    }
}
```

:::