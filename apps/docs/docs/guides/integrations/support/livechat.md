---
title: LiveChat
---

# LiveChat
:::subtitle
Learn how to add LiveChat support integration
:::

The [LiveChat](https://livechat.com) integration allows you to embed a live chat widget in your documentation. This enables visitors to get real-time support and assistance directly within your docs, providing instant help and improving user experience.

## Configuration

To enable the LiveChat integration, add the following configuration to your `docs.json`:

```json
{
  "integrations": {
    "support": {
      "livechat": {
        "licenseId": "required"
      }
    }
  }
}
```

## Reference
::atlas{apiRefItemKind="secondary" references="@uniform('@core/types/settings.ts', {mini: 'IntegrationSupportLivechat'})"} 