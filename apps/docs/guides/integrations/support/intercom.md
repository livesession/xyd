---
title: Intercom
---

# Intercom
:::subtitle
Learn how to add Intercom support integration
:::

The [Intercom](https://intercom.com) integration allows you to embed a live chat widget in your documentation. This enables visitors to get real-time support and assistance directly within your docs, providing instant help and improving user experience.

## Configuration

To enable the Intercom integration, add the following configuration to your `docs.json`:

```json
{
  "integrations": {
    "support": {
      "intercom": {
        "appId": "required"
      }
    }
  }
}
```

## Reference
::atlas{apiRefItemKind="secondary" references="@uniform('@core/types/settings.ts', {mini: 'IntegrationSupportIntercom'})"} 