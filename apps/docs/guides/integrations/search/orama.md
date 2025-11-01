---
title: Orama 
---

# Orama 
:::subtitle
Learn how to add Orama search integration
:::

To enable [Orama Search](http://orama.com) set it in docs.json:
```json Search options in docs.json
{
    "integrations": {
        "search": {
            "orama": true
        }
    }
}
```

for more advanced configuration you can like:
:::code-group
```json Schema
{
    "integrations": {
        "search": {
            "orama": {
                "endpoint": "optional",   // string
                "apiKey":   "optional",   // string
                "suggestions": "optional" // string[]
            }
        }
    }
}
```

```json Example
{
    "integrations": {
        "search": {
            "orama": {
                "endpoint":   "https://api.orama.example",
                "apiKey":     "YOUR_API_KEY_HERE",
                "suggestions": ["term1", "term2"] 
            }
        }
    }
}
```
:::
