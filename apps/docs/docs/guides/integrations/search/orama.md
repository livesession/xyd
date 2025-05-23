---
title: Orama
---

# Orama
:::subtitle
Learn how to add Orama search integration
:::

Add the following to your docs.json file to send analytics to LiveSession.

:::tabs
1. [Default](tab=default)
    :::code-group{title="Search options in xyd.json"}
    ```json Schema
    {
        "integrations": {
            "search": {
                "orama": "required" // boolean
            }
        }
    }
    ```

    ```json Example
    {
        "integrations": {
            "search": {
                "orama": true
            }
        }
    }
    ```
    :::

2. [Full options](tab=full)
    :::code-group{title="Search options in xyd.json"}
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
:::

