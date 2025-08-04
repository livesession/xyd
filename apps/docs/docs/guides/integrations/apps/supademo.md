---
title: Supademo
---

# Supademo

The GitHub Star integration adds a "Star" button to your page footer, allowing visitors to easily star your GitHub repository. This is a great way to encourage community support and increase your repository's visibility.

## Configuration

To enable the GitHub Star integration, add the following configuration to your `docs.json`:

```json
{
  "integrations": {
    ".apps": {
      "supademo": {
        "apiKey": "YOUR_API_KEY"
      }
    }
  }
}
```

## Example
```ts
```

### Reference
::atlas{apiRefItemKind="secondary" references="@uniform('@core/types/settings.ts', {mini: 'IntegrationAppSupademo'})"}

## Customization
TODO