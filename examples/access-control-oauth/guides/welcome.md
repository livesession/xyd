---
title: Welcome
description: OAuth access control example - visible to everyone
---

# OAuth Access Control Example

This example demonstrates xyd access control with an **OAuth 2.0** provider.

## Setup

Start the mock OAuth server and xyd in two terminals:

```bash
# Terminal 1: Mock OAuth server
node mock-oauth-server.mjs

# Terminal 2: xyd dev server
xyd dev
```

## Test Accounts

The mock OAuth server provides two accounts:

| Email | Password | Role | Access |
|-------|----------|------|--------|
| `user@test.com` | `password` | User | `/protected/**` |
| `admin@test.com` | `password` | Admin | Everything |

## Try It

1. Navigate to a protected page like `/protected/api-reference`
2. You'll be redirected to the mock OAuth login
3. Enter credentials and sign in
4. You'll be redirected back with access

## Access Levels

| Section | Access Level |
|---------|-------------|
| `/guides/**` | Public |
| `/protected/**` | Authenticated |
| `/admin/**` | Admin role only |
