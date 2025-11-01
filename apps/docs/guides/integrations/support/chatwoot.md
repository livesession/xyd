---
title: Chatwoot
---

# Chatwoot
:::subtitle
Learn how to add Chatwoot support integration
:::

The [Chatwoot](https://chatwoot.com) integration allows you to embed a live chat widget in your documentation. This enables visitors to get real-time support and assistance directly within your docs, providing instant help and improving user experience.

## Configuration

To enable the Supademo integration, add the following configuration to your `docs.json`:

```json
{
  "integrations": {
    "support": {
      "chatwoot": {
        "websiteToken": "required"
      }
    }
  }
}
```

## Reference
::atlas{apiRefItemKind="secondary" references="@uniform('@core/types/settings.ts', {mini: 'IntegrationSupportChatwoot'})"}

