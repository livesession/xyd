# API Demo Application

Live demo at apps/apidocs-demo showcasing xyd API documentation capabilities.

## Features

- Dynamic specification loading (OpenAPI 3.x and GraphQL)
- Eight predefined examples (LiveSession, Vercel, Intercom, Box, Monday.com, Braintree, GitHub, Artsy)
- Six-theme runtime switching without page reload
- Real-time rendering via xyd-openapi, xyd-gql, xyd-atlas

## State Management

GlobalStateProvider: processed API references across routes.
DemoContext: current spec URL, settings, theme state.

## Theme CSS Management

1. Create new <link> for selected theme CSS
2. Wait for load
3. Remove previous theme CSS
4. Re-render with updated state

## UI

Fixed top banner with GitHub stars, URL input, "Try!" button, example dropdown, theme selector. HTTP method badges in sidebar. Full-screen loading spinner.

## Build

Vite + React Router 7. Virtual module resolution. Netlify deployment. SSR + hydration.
