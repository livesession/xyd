---
title: User Management
description: Manage users and permissions - requires admin group
public: false
accessGroups: ["admin"]
---

# User Management

This page requires the **admin** group.

## User Roles

| Role | Permissions |
|------|------------|
| Viewer | Read public docs |
| Member | Read all docs |
| Admin | Read all docs + manage users |

## Adding Users

To add a new user, use the admin API:

```bash
curl -X POST https://api.example.com/admin/users \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{"email": "new@example.com", "role": "member"}'
```
