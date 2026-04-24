---
title: Getting Started
description: How to set up access control in your xyd project
---

# Getting Started with Access Control

This page is **public** - no authentication required.

## Configuration

Add `accessControl` to your `docs.json`:

```json
{
  "accessControl": {
    "provider": {
      "type": "jwt",
      "loginUrl": "https://your-app.com/login",
      "algorithm": "HS256",
      "secret": "$AUTH_SECRET",
      "groupsClaim": "groups"
    },
    "defaultAccess": "public",
    "rules": [
      { "match": "/api/**", "access": "protected" },
      { "match": "/admin/**", "access": "protected", "groups": ["admin"] }
    ]
  }
}
```

## Page-Level Control

Use frontmatter to override access on individual pages:

```yaml
---
title: Secret Page
public: false
accessGroups: ["premium"]
---
```

## Security Layers

| Layer | Protection | Platform |
|-------|-----------|----------|
| Layer 1 (default) | SSR exclusion + client-side auth | Any static host |
| Layer 2 (opt-in) | + Edge middleware | Netlify/Vercel/Cloudflare |
