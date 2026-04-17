# Examples and References

## API Demo Application

apps/apidocs-demo — OpenAPI and GraphQL docs with dynamic theme switching.

Predefined examples: LiveSession, Vercel, Intercom, Box (REST), Monday.com, Braintree, GitHub, Artsy (GraphQL).

## Documentation Site

Netlify deployment with .xyd/build/client output. 301 redirects for URL structure.

## Node Support Testing

Matrix: Node 22/23/24 × npm/pnpm/bun/npx/bunx. Baseline badges generated via basely.dev API.

## Development Workflows

- Standard: full monorepo build via pnpm dev
- Docs-only: faster content iteration
- Verdaccio: local npm registry for testing
- Release: changesets → version → publish → tag

## Styling Patterns

Linaria CSS-in-JS with CSS custom properties. Theme overrides via variables. Part attributes for CSS targeting.
