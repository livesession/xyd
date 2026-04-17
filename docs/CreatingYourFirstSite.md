# Creating Your First Site

This guide walks through creating a minimal documentation site with xyd, from initial project setup to running the development server and building static files for deployment. It assumes you have already installed the `xyd-js` CLI globally.

## Prerequisites and Initial Setup

Before creating your first site, ensure you have:

- Node.js >= 22.12.0 installed
- The `xyd-js` CLI installed globally
- A text editor or IDE

Create a new directory for your documentation site and navigate to it.

## Project File Structure

A minimal xyd documentation site consists of a configuration file and content directories.

| Path | Purpose | Required |
|------|---------|----------|
| `docs.json` or `docs.ts` | Main configuration file defining site settings | Yes |
| `content/` or `docs/` | Directory containing Markdown/MDX content files | Yes |
| `public/` | Static assets served directly (images, fonts, etc.) | No |
| `.xyd/build/` | Build output directory (generated) | No |

## Creating the Configuration File

Create a `docs.json` file in your project root. This file uses the `Settings` interface to configure your documentation site:

| Property | Type | Description |
|----------|------|-------------|
| `title` | string | Site title displayed in browser and navigation |
| `description` | string | Site description for metadata |
| `navigation` | array | Navigation structure defining sidebar items |
| `theme.name` | string | Theme name (solar, gusto, poetry, picasso, opener, cosmo) |

## Adding Your First Content

Create a `content` directory and add your first Markdown file:

Create `content/introduction.md` with frontmatter defining page metadata. The `title` and `description` fields are used for SEO and page display.

## Directory-to-Route Mapping

The xyd framework maps file paths to routes using a convention-based system:

1. Strips the `content/` prefix
2. Removes the file extension (`.md` or `.mdx`)
3. Converts the path to a URL route
4. Handles both `.md` (Markdown) and `.mdx` (MDX with React components) files

## Running the Development Server

Start the development server using the `xyd` or `xyd dev` command.

The dev server provides:

- Hot module replacement for instant updates
- File watching for settings, content, and API specs
- Live preview at `http://localhost:3000`

When you modify files, the watcher detects changes and triggers appropriate reload strategies:

- Settings changes: Full page reload
- Content changes: Hot module replacement
- Asset changes: Asset refresh

## Development Server Environment Variables

| Variable | Purpose | Values |
|----------|---------|--------|
| `XYD_DEV_MODE` | Enable development mode | `0` or `1` |
| `XYD_VERBOSE` | Enable verbose logging | `0` or `1` |
| `XYD_NODE_PM` | Specify package manager | `npm`, `pnpm`, `bun` |

## Building for Production

Build your site for production deployment:

```bash
xyd build
```

The build output directory structure:

```
.xyd/build/
├── client/           # Static files for hosting
│   ├── index.html
│   ├── assets/       # JS, CSS bundles
│   └── ...
└── server/           # SSR bundle (optional)
```

The `client/` directory contains all files needed to deploy your documentation site to static hosting services like Netlify, Vercel, or GitHub Pages.

## Deployment Configuration Example

**File:** `netlify.toml`

```toml
[build]
command = "xyd build"
publish = ".xyd/build/client"

[build.environment]
NODE_VERSION = "22"
```

## Verification Checklist

After creating your first site, verify:

- `docs.json` exists and contains valid JSON
- `content/` directory exists with at least one `.md` file
- Frontmatter in content files includes `title` and `description`
- Navigation in `docs.json` references existing content paths
- Development server starts without errors (`xyd`)
- Site is accessible at `http://localhost:3000`
- Build completes successfully (`xyd build`)
- `.xyd/build/client/` directory contains `index.html` and assets

## Common First-Time Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| "Cannot find docs.json" | Configuration file missing | Create `docs.json` in project root |
| "No content files found" | Missing content directory | Create `content/` directory with `.md` files |
| Navigation link 404 | Mismatch between navigation href and file path | Ensure navigation `href` matches content file path without extension |
| Port already in use | Another service on port 3000 | Stop other services or specify different port |

## Next Steps

After creating your first site:

1. **Add more content:** Create additional Markdown files in `content/`
2. **Configure navigation:** Update the `navigation` array in `docs.json`
3. **Customize theme:** Explore theme options and design tokens
4. **Add API documentation:** Integrate OpenAPI or GraphQL specs
5. **Install plugins:** Extend functionality with plugins
6. **Deploy your site:** Push to hosting service
