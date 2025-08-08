---
title: LaunchDarkly
---

# LaunchDarkly

The [LaunchDarkly](https://launchdarkly.com) integration allows you to run A/B tests and feature flags in your documentation. This enables you to experiment with different content, layouts, and features to optimize user experience and engagement.

## Configuration

To enable the LaunchDarkly integration, add the following configuration to your `docs.json`:

```json
{
  "integrations": {
    "abtesting": {
      "providers": {
        "launchdarkly": {
            "env": "required"
        }
      }
    }
  }
}
```

This approach allows you to conditionally render different content sections based on the feature flag value, with the `featureDefault` attribute specifying which version to show when the flag is not set.

## Reference
::atlas{apiRefItemKind="secondary" references="@uniform('@core/types/settings.ts', {mini: 'IntegrationABTestingLaunchDarkly'})"} 