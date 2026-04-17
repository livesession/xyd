# Documentation Site Example

The `apps/docs` application serves as the official xyd documentation site, demonstrating production-ready setup.

## Project Structure

| Directory | Purpose |
|-----------|---------|
| `docs.json` or `docs.ts` | Main configuration file |
| `content/` | Markdown/MDX files by topic |
| `public/` | Static assets |
| `.xyd/` | Generated build artifacts |
| `netlify.toml` | Deployment configuration |

## Build Configuration

- **Build Command**: `bunx xyd-js build`
- **Publish Directory**: `.xyd/build/client`
- **Package Manager**: Bun

## Redirect Configuration

| Source | Destination | Status |
|--------|-------------|--------|
| `/` | `/docs/guides/introduction/` | 301 |
| `/docs` | `/docs/guides/introduction` | 301 |
| `/docs/reference/core` | `/docs/reference/core/overview` | 301 |

## Environment Variables

| Variable | Value | Purpose |
|----------|-------|---------|
| `XYD_DEV_MODE` | `1` | Development features |
| `XYD_VERBOSE` | `1` | Verbose logging |
| `XYD_NODE_PM` | `pnpm\|bun\|npm` | Package manager |

## Deployment Targets

| Platform | Configuration | Live Example |
|----------|---------------|--------------|
| Netlify | `netlify.toml` | xyd.dev |
| Vercel | `vercel.json` | Alternative |
| Generic | Manual upload | Any static host |

## Features Demonstrated

### Core
- Markdown/MDX processing
- Multi-level navigation
- Theme system
- Syntax highlighting
- Full-text search
- Plugin system
- Responsive design
- SEO optimization

### Advanced
- API documentation embedding
- Interactive components (callouts, tabs, cards)
- Diagram support (Mermaid, Graphviz)
- Math equations (KaTeX)
- GitHub Flavored Markdown
- Analytics integration
- Custom MDX components
- Hot module replacement

## Getting Started

1. Clone and setup
2. Run `xyd` for development
3. Edit `docs.json` for configuration
4. Add content in `content/`
5. Deploy to hosting platform
