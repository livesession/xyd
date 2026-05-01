# Access Control

This document describes the access control system in xyd, which protects documentation pages with JWT or OAuth authentication. It covers configuration, the plugin architecture, SSR page exclusion, deploy adapters, search filtering, and the unified client API.

## Overview

Access control is configured via the top-level `accessControl` property in `docs.json`. When present, the framework automatically loads `@xyd-js/plugin-access-control` and wires it into the build pipeline. No manual plugin installation is needed.

The system uses a two-layer security model:

| Layer | Security Level | Platform | How It Works |
|-------|---------------|----------|--------------|
| **Layer 1: SSR Exclusion + Client-Side** | Strong | Any static host | Protected content excluded from HTML; loaded as JS chunks after auth |
| **Layer 2: + Deploy Adapter** | Maximum | Node.js / Netlify / Vercel / Cloudflare | Server-side JWT verification blocks all unauthorized requests |

## Configuration

### docs.json

```json
{
  "accessControl": {
    "provider": {
      "type": "jwt",
      "loginUrl": "https://myapp.com/login",
      "callbackPath": "/auth/jwt-callback",
      "algorithm": "HS256",
      "secret": "$AUTH_SECRET",
      "groupsClaim": "groups"
    },
    "defaultAccess": "public",
    "rules": [
      { "match": "/protected/**", "access": "protected" },
      { "match": "/admin/**", "access": "protected", "groups": ["admin"] }
    ],
    "login": {
      "title": "Sign in to access documentation",
      "logo": "/logo.svg"
    },
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

### Type Definitions

All types are defined in `packages/xyd-core/src/types/settings.ts`:

| Interface | Purpose |
|-----------|---------|
| `AccessControl` | Root config: provider, rules, login, deploy, session |
| `AccessControlProviderJWT` | JWT auth: loginUrl, callbackPath, algorithm, secret, groupsClaim |
| `AccessControlProviderOAuth` | OAuth: authorizationUrl, tokenUrl, clientId, scopes, userInfoUrl |
| `AccessControlProviderCustom` | Custom: handler module path |
| `AccessControlRule` | Pattern rule: match (glob), access, groups |
| `AccessControlLoginConfig` | Login page: logo, title, description, backgroundImage |
| `AccessControlDeployConfig` | Deploy platform: `"node-edge"`, `"netlify-edge"`, `"vercel-edge"`, `"cloudflare-edge"` |
| `AccessControlSessionConfig` | Session: maxAge, cookieName |

The `login` field accepts two forms:
- **Object** (`AccessControlLoginConfig`): configures the built-in login page
- **String**: path to a custom React component (e.g., `"./custom-login.tsx"`)

### Frontmatter

Pages can override access rules via frontmatter:

```yaml
---
title: Admin API Reference
public: false
accessGroups: ["admin", "staff"]
---
```

The `Metadata` interface in `packages/xyd-core/src/types/metadata.ts` includes `public?: boolean` and `accessGroups?: string[]`.

## Plugin Architecture

### Package: `@xyd-js/plugin-access-control`

```
packages/xyd-plugin-access-control/
  src/
    index.ts                  # Plugin factory (server-side, exported as ./plugin)
    client.ts                 # Browser-safe entry (main "." export)
    access.ts                 # resolvePageAccess(), buildAccessMap(), evaluateAccess()
    virtual.ts                # Virtual module generators
    content.ts                # Vite dev middleware + build-time content protection
    navigation.ts             # Sidebar/nav filtering helpers
    devOnly.ts                # isDevEnvironment(), isAuthBypassed()
    middleware/
      node.ts                 # Generates standalone server.mjs
      netlify.ts              # Generates Netlify Edge Function
      vercel.ts               # Generates Vercel Middleware
      cloudflare.ts           # Generates Cloudflare Pages Function
      shared.ts               # Shared middleware logic
    components/
      AccessControlContext.tsx  # AccessControlProvider + useAccessControl()
      AuthGuard.tsx            # Auth check (loaded via virtual module)
      LoginPage.tsx            # Built-in login UI (self-contained CSS)
      AuthCallbackPage.tsx     # JWT/OAuth callback handler
    scripts/
      authPrehydration.ts      # Synchronous <head> auth check
    styles/
      login.css                # Login page styles
      callback.css             # Callback page styles
```

### Client/Server Split

The package has separate entry points to prevent Node.js code from entering browser builds:

| Export Path | Entry File | Contents | Safe For |
|-------------|-----------|----------|----------|
| `"."` (main) | `dist/client.js` | `AccessControlProvider`, `useAccessControl()`, types | Browser |
| `"./plugin"` | `dist/index.js` | Plugin factory, Vite plugins, middleware generators | Server only |
| `"./AccessControlContext"` | `dist/AccessControlContext.js` | Direct context import | Browser |

### Plugin Wiring

In `packages/xyd-documan/src/utils.ts`, the `accessControlToPlugins()` function converts the `accessControl` config into a plugin:

```typescript
if (settings?.accessControl) {
  const plugin = await import("@xyd-js/plugin-access-control/plugin");
  plugins.push(plugin.default(settings.accessControl));
}
```

The access map is built eagerly in `appInit()` after `pluginDocs()` sets `__xydPagePathMapping`:

```typescript
globalThis.__xydAccessMap = buildAccessMap(
  globalThis.__xydPagePathMapping,
  settings.accessControl
);
```

### Plugin Contributions

The plugin factory returns a `PluginConfig` with:

| Contribution | Contents |
|-------------|----------|
| `vite` | Virtual module plugin, content protection plugin, deploy adapter plugin |
| `pages` | `/login` (LoginPage), `/auth/jwt-callback` (AuthCallbackPage), `/auth/callback` (AuthCallbackPage) |
| `head` | Pre-hydration auth check script |
| `hooks.applyComponents` | Returns `true` (auth components on all pages) |

## Virtual Modules

### `virtual:xyd-access-control-settings`

Exports the access control config and pre-computed access map:

```typescript
export const accessControlConfig = { provider: {...}, defaultAccess: "public", rules: [...], session: {...} };
export const accessMap = { "/guides/welcome": "public", "/admin/dashboard": "admin" };
```

### `virtual:xyd-access-control-guard`

Exports the AuthGuard component and AccessControlProvider:

```typescript
export { default as AuthGuard } from '...';
export { AccessControlProvider, useAccessControl } from '...';
```

### `virtual:xyd-plugin-pages`

Exports plugin-registered page components with optional `seoTags`:

```typescript
export const pluginPages = {
  "/login": { component: LoginPage, seoTags: () => ({ title: "Sign In" }) },
  "/auth/jwt-callback": { component: AuthCallbackPage },
};
export { AccessControlProvider } from '...';
```

## Access Evaluation

### Access Map

The access map is a flat `Record<string, string>` built at build time from rules + page paths:

```typescript
{
  "/guides/welcome": "public",
  "/protected/api-reference": "authenticated",
  "/admin/dashboard": "admin",
  "/admin/user-management": "admin"
}
```

Values: `"public"`, `"authenticated"`, or comma-separated group names.

### Evaluation Order

1. **Pattern rules** (`accessControl.rules`): first matching glob wins
2. **Default access** (`accessControl.defaultAccess`): fallback

Path normalization ensures leading slashes for consistent matching.

### Key Functions in `access.ts`

| Function | Purpose |
|----------|---------|
| `resolvePageAccess(pagePath, config)` | Evaluates a single page path against rules → returns access string |
| `buildAccessMap(pagePathMapping, config)` | Builds full map for all pages |
| `evaluateAccess(pagePath, config, userGroups)` | Runtime check: returns `{ allowed, reason }` |
| `matchPattern(pattern, path)` | Glob matching with `**` and `*` support |

## SSR Page Exclusion

Protected pages are pre-rendered as **empty shells** — content never appears in HTML source.

### How It Works

1. **Page loader** (`packages/xyd-plugin-docs/src/pages/page.tsx`): checks `__xydAccessMap`. If page is protected and no deploy adapter (`!hasDeploy`), sets `shellOnly: true` and skips MDX compilation
2. **ProtectedPageShell**: renders instead of content during SSR
3. **After hydration**: `useState` + `useEffect` checks auth state. If authenticated, content loads from JS chunk
4. **With deploy adapter**: `shellOnly` is skipped because the server handles protection — content is pre-rendered normally since unauthorized users never reach the page

### Hydration Mismatch Prevention

Auth checks use deferred state to avoid server/client rendering differences:

```typescript
const [shellReady, setShellReady] = useState(false);
useEffect(() => { setShellReady(true); }, []);
// Only show shell content after hydration
```

## Pre-Hydration Script

Runs synchronously in `<head>` before React hydration (same pattern as color scheme script):

1. Reads token from `localStorage` or cookie
2. Decodes JWT payload (no signature verification — just for display gating)
3. Sets `window.__xydAuthState = { authenticated, groups, token }`
4. Sets `data-auth="authenticated"` or `data-auth="anonymous"` on `<html>`

This prevents flash of protected content (FOPC).

## JWT Claims

The auth server signs a JWT with specific claims. xyd reads the `groupsClaim` field (default: `"groups"`) to determine group-based access.

### Required Claims

| Claim | Type | Read By | Purpose |
|-------|------|---------|---------|
| `sub` | `string` | Edge server logs | User identifier |
| `exp` | `number` | Pre-hydration script, edge server, AuthCallbackPage | Token expiration (Unix seconds) |
| `iat` | `number` | — | Issued-at time |
| `groups` | `string[]` | Pre-hydration script (`groupsClaim`), edge server (`GROUPS_CLAIM`), AuthCallbackPage | Group membership for access rules |

The claim key for groups is configurable via `provider.groupsClaim`. If set to `"roles"`, xyd reads `payload.roles` instead of `payload.groups`.

### Where Claims Are Read

1. **Pre-hydration script** (`authPrehydration.ts`): Decodes JWT from localStorage/cookie, reads `payload[groupsClaim]` → sets `window.__xydAuthState.groups`
2. **AuthCallbackPage** (`AuthCallbackPage.tsx`): On callback, decodes `payload[groupsClaim]` → passes to `storeTokenAndRedirect()`
3. **Edge server** (`server.mjs`): `verifyJWT()` validates signature + `exp`, `checkAccess()` reads `payload[GROUPS_CLAIM]` and compares against `ACCESS_MAP`
4. **Layout loader** (`layout.tsx`): Decodes JWT from cookie, reads groups for sidebar filtering

### Auth Server JWT Signing Example

```javascript
import { createHmac } from "node:crypto";

function signJWT(payload) {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify({
    ...payload,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 86400,
  })).toString("base64url");
  const sig = createHmac("sha256", JWT_SECRET).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${sig}`;
}

// After authenticating user:
const token = signJWT({ sub: "user-123", groups: ["admin"] });
const callbackUrl = `${DOCS_URL}/auth/jwt-callback?token=${token}&redirect=${redirect}`;
res.redirect(302, callbackUrl);
```

## OAuth User Info

For OAuth, groups come from the **userinfo endpoint**, not the JWT. After code exchange, xyd fetches `userInfoUrl` and reads `groupsClaim` from the JSON response.

### UserInfo Response Format

```json
{
  "sub": "user-123",
  "email": "user@example.com",
  "roles": ["admin", "staff"]
}
```

If `groupsClaim` is `"roles"`, xyd reads `response.roles`. Fallback order: `response[groupsClaim]` → `response.roles` → `response.groups`.

### OAuth Groups Flow (in AuthCallbackPage)

1. Exchange `code` for `access_token` (POST to `tokenUrl`)
2. Fetch `userInfoUrl` with `Authorization: Bearer {access_token}`
3. Read `response[groupsClaim]` (or fallback to `response.roles` / `response.groups`)
4. Create a session JWT with groups baked in: `{ sub: "oauth-user", [groupsClaim]: groups, exp, iat }`
5. Store session JWT in localStorage + cookie

## Auth Flows

### JWT Flow

1. User visits protected page → pre-hydration detects no auth → layout redirects to `loginUrl`
2. External auth server authenticates user, signs JWT with HS256
3. Redirects to `/auth/jwt-callback?token=SIGNED_JWT&redirect=/protected/page`
4. `AuthCallbackPage` extracts token from `?token=` query param (or `#` hash fragment)
5. Stores token in localStorage + cookie, redirects to original page
6. With deploy adapter: edge server validates JWT signature on `/auth/jwt-callback`, sets cookie server-side

### OAuth Flow

1. User visits protected page → redirects to `authorizationUrl` with `client_id`, `redirect_uri`, `scope`, `state`
2. User authorizes → provider redirects to `/auth/callback?code=XXX&state=/page`
3. `AuthCallbackPage` exchanges code for access token (POST to `tokenUrl`)
4. Fetches user info from `userInfoUrl`, extracts groups
5. Creates session JWT, stores in localStorage + cookie

## AccessControlContext

Provides auth actions to any React component:

```typescript
export interface AccessControlActions {
  signInWithOAuth: () => void;
  signInWithRedirect: () => void;
  signInAsUser: () => void;       // Dev only
  signInAsAdmin: () => void;      // Dev only
  signInWithGroups: (groups: string[]) => void;  // Dev only
}
```

Dev-only actions (`signInAsUser`, `signInAsAdmin`, `signInWithGroups`) generate client-side JWTs and are disabled in production via `isDevEnvironment()` check in `devOnly.ts`.

## Plugin Pages System

Plugins register custom pages via the `pages` property in `PluginConfig`:

```typescript
export interface PluginPage {
  route: string;
  component: React.ComponentType;
  dist?: string;
  metadata?: Record<string, any>;
  public?: boolean;
  layoutCss?: boolean;  // Whether to load theme CSS (default: true)
}
```

### PageApi Interface

Custom pages can export `seoTags()` for pre-rendered meta tags:

```typescript
export interface PageApi<P = any> {
  default: React.ComponentType<P>;
  seoTags?: () => Partial<MetaTags> | Promise<Partial<MetaTags>>;
  shadowCss?: boolean;  // Future: CSS shadow DOM isolation
}
```

The `seoTags()` function runs at **pre-render time** in the React Router `loader` (in `packages/xyd-host/app/pluginPage.tsx`), ensuring meta tags appear in HTML source for SEO.

### Plugin Page Routing

Plugin pages are registered in `packages/xyd-host/app/routes.ts` from `__xydPluginPages`. Each page gets:
- **Layout**: `pluginPageLayout.tsx` (with theme CSS) or `pluginPageLayoutBare.tsx` (without theme CSS, for `layoutCss: false`)
- **Wrapper**: `pluginPage.tsx` wraps with `AccessControlProvider` from `virtual:xyd-plugin-pages`

## Layout Integration

### Sidebar Filtering

In `packages/xyd-plugin-docs/src/pages/layout.tsx`:
- Server-side: layout loader decodes JWT from cookie, filters sidebar items by group access
- Protected items never appear in pre-rendered HTML

### NavLinks Filtering

In `packages/xyd-plugin-docs/src/pages/page.tsx`:
- Page loader filters prev/next navigation links by access
- Protected pages skipped when calculating adjacent pages

## Deploy Adapters

### Node.js Edge Server (`node-edge`)

Generated during `xyd build` as `.xyd/build/client/server.mjs`:

| Feature | Implementation |
|---------|---------------|
| JWT verification | HS256 via `node:crypto` (`createHmac`) |
| Access checking | Pre-computed `ACCESS_MAP` baked in |
| Auth callback | `/auth/jwt-callback?token=JWT&redirect=/path` |
| Test login | `/auth/test-login?groups=admin` (disabled in production) |
| Logout | `/auth/logout` (clears cookie) |
| Static serving | Direct file serving from build output |

**Usage:**
```bash
AUTH_SECRET=my-secret node .xyd/build/client/server.mjs
# or: xyd serve (auto-detects server.mjs)
```

### Other Platforms

| Platform | Generated File | Notes |
|----------|---------------|-------|
| `netlify-edge` | `netlify/edge-functions/auth.ts` | Deno runtime |
| `vercel-edge` | `middleware.ts` | Edge runtime |
| `cloudflare-edge` | `functions/_middleware.js` | Workers runtime |

## Search Filtering

Search filtering is **transparent to plugin developers**. No access control code in search plugins.

### How It Works

1. `createSearchDataModule()` in `packages/xyd-content/packages/md/search/filter.ts` tags each search document with its access level from `__xydAccessMap`
2. The Orama plugin imports `createSearchDataModule()` — the framework handles filtering
3. Client-side `filterSearchDocs()` filters results based on current auth state
4. Hash fragments in `pageUrl` are stripped before access map lookup

## Sitemap and llms.txt Filtering

- **Sitemap**: `packages/xyd-host/app/sitemap.ts` filters protected pages using `__xydAccessMap`
- **llms.txt**: `packages/xyd-documan/src/utils.ts` filters protected pages before `pluginLLMMarkdown()` runs

## Unified Client API: `@xyd-js/client-api`

A single import package for all xyd hooks and utilities (inspired by VS Code's `vscode` module):

```typescript
import {
  useAccessControl,   // from plugin-access-control
  useSettings,        // from framework
  useAnalytics,       // from analytics
  filterSearchDocs,   // from content/search
} from "@xyd-js/client-api";

import type { PageApi, MetaTags, AccessControlActions } from "@xyd-js/client-api";
```

The package is a thin re-export layer with peer dependencies on the source packages.

## Global State

| Variable | Type | Set By | Used By |
|----------|------|--------|---------|
| `__xydAccessMap` | `Record<string, string>` | `appInit()` after `pluginDocs()` | Page loader, layout loader, sitemap, search, virtual modules |
| `__xydPluginPages` | `PluginPage[]` | `appInit()` | Routes, pluginPage.tsx |
| `__xydAuthState` | `{ authenticated, groups, token }` | Pre-hydration script | Layout, page components |

## Examples

Located in the `examples` submodule:

| Example | Provider | Deploy | Key Feature |
|---------|----------|--------|-------------|
| `access-control-edge-jwt` | JWT | node-edge | External auth server, HS256 verification |
| `access-control-edge-oauth` | OAuth | node-edge | Mock OAuth server, code exchange |
| `access-control-edge-password` | JWT | node-edge | `defaultAccess: "protected"`, all pages locked by default |
| `access-control-edge-custom-page-ui` | JWT | node-edge | Custom login component via `@xyd-js/client-api` |
