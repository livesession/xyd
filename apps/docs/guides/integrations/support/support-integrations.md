---
title: Support Integrations
---

# Support Integrations
:::subtitle
Integrate with support platforms to provide customer assistance
:::

Support integrations allow you to embed customer support widgets and chat functionality directly into your documentation. This enables visitors to get real-time help and assistance while browsing your docs, improving user experience and reducing support ticket volume.

## All integrations
:::grid
- 
  - 
    :::guide-card{kind="secondary" title="Chatwoot" icon="docs:chatwoot" href="/docs/guides/integrations/support/chatwoot"}
    Learn how to integrate Chatwoot for customer support and live chat
    :::

  - 
    :::guide-card{kind="secondary" title="Intercom" icon="docs:intercom" href="/docs/guides/integrations/support/intercom"}
    Learn how to integrate Intercom for customer support and messaging
    :::

  - 
    :::guide-card{kind="secondary" title="LiveChat" icon="docs:livechat" href="/docs/guides/integrations/support/livechat"}
    Learn how to integrate LiveChat for real-time customer support
    :::

:::

## Configuration
To enable support integrations, add the appropriate configuration to your `docs.json`:

```json
{
  "integrations": {
    "support": {
      "chatwoot": {
        "websiteToken": "required"
      },
      "intercom": {
        "appId": "required"
      },
      "livechat": {
        "licenseId": "required"
      }
    }
  }
}
```

## Reference
::atlas{apiRefItemKind="secondary" references="@uniform('@core/types/settings.ts', {mini: 'IntegrationSupport'})"} 

## Analytics Integration {label="Coming Soon"}
Track support interactions and user engagement with your support widgets. Send [analytics events](/docs/guides/integrations/analytics/analytics-integrations) to measure support effectiveness and optimize your documentation based on common support requests.
