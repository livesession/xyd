---
title: Edit Link
---

# Edit Link

The Edit Link integration adds an "Edit page" button to your documentation pages, allowing visitors to easily contribute to your documentation by editing pages directly on your repository platform (like GitHub, GitLab, etc.). This is a great way to encourage community contributions and make your documentation more collaborative.

## Configuration

To enable the Edit Link integration, add the following configuration to your `docs.json`:

```json
{
  "integrations": {
    "editLink": {
      "baseUrl": "(required) e.g link to your repo",
      "title": "(optional) e.g 'Edit page'",
      "icon": "(optional) your icon name"
    }
  }
}
```

### Reference
::atlas{apiRefItemKind="secondary" references="@uniform('@core/types/settings.ts', {mini: 'EditLink'})"}
