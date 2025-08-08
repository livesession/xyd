---
title: Algolia
---

# Algolia {label="Experimental"}
:::subtitle
Learn how to use Algolia
:::

To enable [Algolia](http://algolia.com) set it in docs.json:

:::code-group{title="Search options in docs.json"}

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