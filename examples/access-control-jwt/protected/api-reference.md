---
title: API Reference
description: Internal API reference - requires authentication
public: false
---

# API Reference

This page is **protected** - only authenticated users can see this content.

If you're seeing this, you've successfully authenticated!

## Endpoints

### GET /api/users

Returns a list of all users.

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" https://api.example.com/users
```

### POST /api/users

Creates a new user.

```json
{
  "name": "John Doe",
  "email": "john@example.com"
}
```

## Authentication

All API endpoints require a valid JWT token in the `Authorization` header.
