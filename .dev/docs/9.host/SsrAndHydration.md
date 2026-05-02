# SSR and Hydration

xyd implements Static Site Generation (SSG) through build-time SSR.

## Architecture

Two parallel builds: Client (browser JS) and SSR (static HTML generation). Both use Vite.

## Build Process

Routes collected from navigation, public files, plugins, system routes. React Router SSR renders Layout for each route.

## Client-Side Hydration

Browser loads pre-rendered HTML, React hydrates to attach event handlers. HydrateFallback → App Component → client-side routing.

## Pre-Hydration Scripts

Synchronous scripts in <head> before React:
- Color scheme (localStorage + media query)
- Feature flags
- Banner height calculation

## Build Output

```
.xyd/build/
├── client/ (deployment files)
│   ├── index.html, assets/, [routes]/
└── server/ (SSR artifacts, not deployed)
```

## Deployment

No server runtime needed. Works with any static hosting. basename support for subdirectories.

## Performance

Synchronous: color scheme, A/B setup. Deferred: React hydration. Async: analytics, third-party.
