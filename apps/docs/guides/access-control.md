---
title: Access Control
description: Protect documentation pages with authentication and role-based access
icon: shield
---

# Access Control {label="Alpha"}

Protect your documentation with JWT or OAuth to control who can access pages and API references.

## Quick Start

Add `accessControl` to your `docs.json`:

:::tabs{kind="secondary"}
1. [JWT](provider=jwt)
    ```json docs.json
    {
      "accessControl": {
        "provider": {
          "type": "jwt",
          "loginUrl": "https://your-auth-server.com/login",
          "callbackPath": "/auth/jwt-callback",
          "algorithm": "HS256",
          "secret": "$AUTH_SECRET",
          "groupsClaim": "groups"
        },
        "defaultAccess": "public",
        "rules": [
          { "match": "/api/**", "access": "protected" },
          { "match": "/admin/**", "access": "protected", "groups": ["admin"] }
        ],
        "deploy": {
          "platform": "node-edge"
        },
        "session": {
          "maxAge": 86400,
          "cookieName": "xyd-auth-token"
        }
      }
    }
    ```

2. [OAuth](provider=oauth)
    ```json docs.json
    {
      "accessControl": {
        "provider": {
          "type": "oauth",
          "authorizationUrl": "https://accounts.google.com/o/oauth2/auth",
          "tokenUrl": "https://oauth2.googleapis.com/token",
          "clientId": "$OAUTH_CLIENT_ID",
          "scopes": ["openid", "email", "profile"],
          "callbackPath": "/auth/callback",
          "userInfoUrl": "https://api.example.com/userinfo",
          "groupsClaim": "roles"
        },
        "defaultAccess": "public",
        "rules": [
          { "match": "/api/**", "access": "protected" },
          { "match": "/admin/**", "access": "protected", "groups": ["admin"] }
        ],
        "deploy": {
          "platform": "node-edge"
        },
        "session": {
          "maxAge": 86400,
          "cookieName": "xyd-auth-token"
        }
      }
    }
    ```
:::

## Provider Configuration

:::tabs{kind="secondary"}
1. [JWT](provider=jwt)
    | Field | Type | Required | Description |
    |-------|------|----------|-------------|
    | `type` | `"jwt"` | Yes | Provider type |
    | `loginUrl` | `string` | Yes | URL to redirect unauthenticated users |
    | `callbackPath` | `string` | No | Callback path (default: `/auth/jwt-callback`) |
    | `algorithm` | `string` | No | JWT signing algorithm (default: `HS256`) |
    | `secret` | `string` | Yes | Shared secret for HS256. Use `$ENV_VAR` syntax |
    | `groupsClaim` | `string` | No | JWT claim name containing groups (default: `groups`) |

2. [OAuth](provider=oauth)
    | Field | Type | Required | Description |
    |-------|------|----------|-------------|
    | `type` | `"oauth"` | Yes | Provider type |
    | `authorizationUrl` | `string` | Yes | OAuth authorization endpoint |
    | `tokenUrl` | `string` | Yes | OAuth token exchange endpoint |
    | `clientId` | `string` | Yes | OAuth client ID. Use `$ENV_VAR` syntax |
    | `scopes` | `string[]` | No | OAuth scopes to request |
    | `callbackPath` | `string` | No | Callback path (default: `/auth/callback`) |
    | `userInfoUrl` | `string` | No | URL to fetch user info (provides groups) |
    | `groupsClaim` | `string` | No | Field in userinfo response containing groups (default: `groups`) |
:::

## Claims and Groups

xyd uses the `groupsClaim` field to read user groups for access control. How groups are provided depends on the provider type.

:::tabs{kind="secondary"}
1. [JWT Claims](provider=jwt)
    Your auth server must include these claims in the signed JWT:

    | Claim | Type | Required | Description |
    |-------|------|----------|-------------|
    | `sub` | `string` | Yes | User identifier |
    | `exp` | `number` | Yes | Expiration (Unix timestamp in seconds) |
    | `iat` | `number` | Yes | Issued-at time |
    | `groups` | `string[]` | For group access | Groups/roles (key name must match `groupsClaim`) |

    **Example JWT payload:**
    ```json
    {
      "sub": "user-123",
      "groups": ["admin", "staff"],
      "exp": 1735689600,
      "iat": 1735603200
    }
    ```

    **Auth server example (Node.js):**
    ```javascript
    import { createHmac } from "node:crypto";

    const JWT_SECRET = process.env.AUTH_SECRET;

    function signJWT(payload) {
      const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" }))
        .toString("base64url");
      const body = Buffer.from(JSON.stringify({
        ...payload,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 86400,
      })).toString("base64url");
      const sig = createHmac("sha256", JWT_SECRET)
        .update(`${header}.${body}`)
        .digest("base64url");
      return `${header}.${body}.${sig}`;
    }

    // After user authenticates:
    const token = signJWT({ sub: user.id, groups: user.groups });
    const callbackUrl = `${DOCS_URL}/auth/jwt-callback?token=${token}&redirect=${redirect}`;
    res.redirect(302, callbackUrl);
    ```

    If your JWT uses `"roles"` instead of `"groups"`, set `"groupsClaim": "roles"` in `docs.json`.

2. [OAuth UserInfo](provider=oauth)
    For OAuth, xyd reads groups from your **userinfo endpoint**. After code exchange, xyd calls `userInfoUrl` with the access token.

    **Your `/userinfo` endpoint must return JSON with groups:**
    ```json
    {
      "sub": "user-123",
      "email": "user@example.com",
      "roles": ["admin", "staff"]
    }
    ```

    If `groupsClaim` is `"roles"`, xyd reads `response.roles`. Fallback order: `response[groupsClaim]` → `response.roles` → `response.groups`.

    **OAuth flow:**

    1. xyd redirects to `authorizationUrl` with `client_id`, `redirect_uri`, `scope`, `state`
    2. User authorizes → provider redirects to `/auth/callback?code=XXX&state=/page`
    3. xyd exchanges `code` for `access_token` (POST to `tokenUrl`)
    4. xyd fetches `userInfoUrl` with `Authorization: Bearer {access_token}`
    5. Reads groups from response → stores in session JWT
:::

## Security Model

| Layer | Protection | Platform |
|-------|-----------|----------|
| **Layer 1** (default) | SSR exclusion + client-side auth. Content not in HTML source. | Any static host |
| **Layer 2** (deploy) | Server-side JWT verification. Content never served to unauthorized. | Node.js, Netlify, Vercel, Cloudflare |

## Page-Level Access

### Frontmatter

Override access on individual pages:

```yaml
---
title: Admin Guide
public: false
accessGroups: ["admin"]
---
```

| Field | Effect |
|-------|--------|
| `public: true` | Always public, even if `defaultAccess` is `"protected"` |
| `public: false` | Always protected, even if `defaultAccess` is `"public"` |
| `accessGroups: ["admin"]` | Requires membership in at least one listed group |

### Pattern Rules

Match pages by glob pattern in `docs.json`:

```json
{
  "rules": [
    { "match": "/guides/**", "access": "public" },
    { "match": "/api/**", "access": "protected" },
    { "match": "/admin/**", "access": "protected", "groups": ["admin"] }
  ]
}
```

Rules are evaluated in order — first match wins.

### Evaluation Priority

1. **Frontmatter** (highest) — `public` / `accessGroups` in page metadata
2. **Pattern rules** — `rules` array in `docs.json`
3. **Default access** (lowest) — `defaultAccess: "public" | "protected"`

## Deploy Adapters

For production deployments, enable server-side protection:

:::tabs{kind="secondary"}
1. [Node.js](platform=node)
    ```json docs.json
    {
      "accessControl": {
        "deploy": {
          "platform": "node-edge"
        }
      }
    }
    ```

    With `node-edge`, `xyd build` generates a `server.mjs` in your build output:

    ```bash
    xyd build   # generates .xyd/build/client/server.mjs
    AUTH_SECRET=your-secret node .xyd/build/client/server.mjs
    # or: xyd serve
    ```

    The server verifies JWT signatures (HS256), checks access rules on every request, and returns 302 for unauthorized users.

2. [Netlify](platform=netlify)
    ```json docs.json
    {
      "accessControl": {
        "deploy": {
          "platform": "netlify-edge"
        }
      }
    }
    ```

    Generates a Netlify Edge Function at `netlify/edge-functions/auth.ts`.

3. [Vercel](platform=vercel)
    ```json docs.json
    {
      "accessControl": {
        "deploy": {
          "platform": "vercel-edge"
        }
      }
    }
    ```

    Generates `middleware.ts` at your project root.

4. [Cloudflare](platform=cloudflare)
    ```json docs.json
    {
      "accessControl": {
        "deploy": {
          "platform": "cloudflare-edge"
        }
      }
    }
    ```

    Generates `functions/_middleware.js` for Cloudflare Pages.
:::

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `AUTH_SECRET` | Yes (for JWT) | JWT signing secret (≥32 characters) |
| `PORT` | No | Server port (default: 3000) |

## Session Configuration

```json
{
  "session": {
    "maxAge": 86400,
    "cookieName": "xyd-auth-token"
  }
}
```

## Login Page

xyd provides a built-in login page at `/login`. Customize it:

:::tabs{kind="secondary"}
1. [Built-in](login=builtin)
    ```json docs.json
    {
      "accessControl": {
        "login": {
          "title": "Sign in to access docs",
          "description": "Enterprise documentation requires authentication.",
          "logo": "/images/logo.svg"
        }
      }
    }
    ```

2. [Custom Component](login=custom)
    ```json docs.json
    {
      "accessControl": {
        "login": "./custom-login.tsx"
      }
    }
    ```

    Your custom component uses `useAccessControl()` from `@xyd-js/client-api`:

    ```tsx custom-login.tsx
    import { useAccessControl } from "@xyd-js/client-api";

    export default function CustomLogin() {
      const { signInWithRedirect, title } = useAccessControl();

      return (
        <div>
          <h1>{title}</h1>
          <button onClick={signInWithRedirect}>Sign In</button>
        </div>
      );
    }
    ```
:::

## Feature Availability

How xyd features behave depending on your access control setup:

| Feature | Public (no auth) | Fully authenticated | Partially authenticated |
|---------|-----------------|--------------------|-----------------------|
| **Search** | Full support | Filtered by auth state | Filtered by auth state |
| **Sidebar** | Full support | Filtered by groups | Filtered by groups |
| **Sitemap** | Full support | Protected pages excluded | Protected pages excluded |
| **llms.txt** | Full support | Protected pages excluded | Protected pages excluded |
| **Prev/Next links** | Full support | Filtered by access | Filtered by access |
| **HTML source** | Full content | Empty shell (SSR exclusion) | Protected pages: empty shell |
| **JS chunks** | All accessible | Blocked by deploy adapter | Protected chunks blocked |

**Fully authenticated** = `defaultAccess: "protected"` (all pages require auth unless marked public)

**Partially authenticated** = `defaultAccess: "public"` with specific `rules` protecting certain pages

## Examples

- [Edge + JWT](https://github.com/xyd-js/examples/tree/master/access-control-edge-jwt)
- [Edge + OAuth](https://github.com/xyd-js/examples/tree/master/access-control-edge-oauth)
- [Edge + Default Protected](https://github.com/xyd-js/examples/tree/master/access-control-edge-password)
- [Custom Login Page](https://github.com/xyd-js/examples/tree/master/access-control-edge-custom-page-ui)