---
title: Github Star
---

# Github Star

The GitHub Star integration adds a "Star" button to your page footer, allowing visitors to easily star your GitHub repository. This is a great way to encourage community support and increase your repository's visibility.

## Configuration

To enable the GitHub Star integration, add the following configuration to your `docs.json`:

```json
{
  "integrations": {
    "apps": {
      "githubStar": {
        "title": "Star",
        "label": "Show your support! Star us on GitHub ⭐️",
        "href": "https://github.com/livesession/xyd",
        "dataIcon": "octicon-star",
        "dataSize": "large",
        "dataShowCount": true,
        "ariaLabel": "Star livesession/xyd on GitHub"
      }
    }
  }
}
```

### Reference
::atlas{apiRefItemKind="secondary" references="@uniform('@core/types/settings.ts', {mini: 'IntegrationAppGithubStar'})"}

## Customization

You can customize the appearance and behavior of the GitHub Star button by modifying the configuration options. The button is rendered using the [`react-github-btn`](https://github.com/buttons/react-github-btn) package, which provides a consistent look and feel with GitHub's official star button.
