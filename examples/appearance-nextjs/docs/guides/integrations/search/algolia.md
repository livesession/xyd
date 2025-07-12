---
title: Algolia
---

# Algolia {label="Experimental"}
:::subtitle
Learn how to use Algolia
:::

Add the following to your docs.json:

:::code-group
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