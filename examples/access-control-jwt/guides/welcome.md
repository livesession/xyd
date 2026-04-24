---
title: Welcome
description: Public welcome page - visible to everyone
---

# Welcome to the Access Control Playground

This page is **public** - anyone can see it without logging in.

## What is this?

This playground demonstrates xyd's access control feature. It has three sections:

| Section | Access Level | Who Can See |
|---------|-------------|-------------|
| `/guides/**` | Public | Everyone |
| `/protected/**` | Authenticated | Logged-in users only |
| `/admin/**` | Admin group | Users with "admin" group only |

## Try it out

1. Browse the sidebar - you should see all public pages
2. Try clicking on "Protected Pages" or "Admin Pages" - you'll be redirected to login
3. Use the test tokens below to authenticate

## Test Tokens

Open your browser console (F12) and paste one of these commands:

**Login as authenticated user** (can see `/protected/**` but NOT `/admin/**`):
```js
localStorage.setItem('xyd-auth-token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEiLCJncm91cHMiOltdLCJleHAiOjE4MDg0OTk3NjMsImlhdCI6MTc3Njk2Mzc2M30=.dGVzdC1zaWduYXR1cmU='); location.reload();
```

**Login as admin** (can see everything):
```js
localStorage.setItem('xyd-auth-token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbi0xIiwiZ3JvdXBzIjpbImFkbWluIl0sImV4cCI6MTgwODQ5OTc2MywiaWF0IjoxNzc2OTYzNzYzfQ==.dGVzdC1zaWduYXR1cmU='); location.reload();
```

**Logout** (back to anonymous):
```js
localStorage.removeItem('xyd-auth-token'); location.reload();
```

## What to Verify

After changing auth state, check:

1. **Sidebar** - Protected/admin sections should appear/disappear
2. **View Source** - Protected pages should show NO content in HTML
3. **Direct URL** - Navigate to `/protected/api-reference` while anonymous - should redirect
4. **Sitemap** - `/sitemap.xml` should NOT list protected pages
