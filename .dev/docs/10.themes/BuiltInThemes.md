# Built-in Themes

This document describes the six built-in themes available in xyd-js and their technical implementation.

## Available Themes

| Theme | Package | Description | Demo URL |
|-------|---------|-------------|----------|
| **Poetry** | `@xyd-js/theme-poetry` | Default theme with clean, minimal design | https://poetry.xyd.dev |
| **Opener** | `@xyd-js/theme-opener` | Open, spacious layout with emphasis on readability | https://opener.xyd.dev |
| **Cosmo** | `@xyd-js/theme-cosmo` | Modern, cosmic-inspired design | https://cosmo.xyd.dev |
| **Picasso** | `@xyd-js/theme-picasso` | Artistic, expressive styling | https://picasso.xyd.dev |
| **Gusto** | `@xyd-js/theme-gusto` | Bold, energetic design | https://gusto.xyd.dev |
| **Solar** | `@xyd-js/theme-solar` | Bright, solar-inspired theme | https://solar.xyd.dev |

## Theme Architecture

Themes are npm packages that export React components and CSS stylesheets. Each theme provides `Page` and `Layout` components.

**Theme Loading Flow:**

1. Settings specify theme name in `docs.json` (`theme.name`)
2. Framework imports corresponding theme package
3. Theme CSS is injected into document `<head>`
4. Theme class instance provides `Page` and `Layout` components
5. Framework renders content using theme components

## Theme Configuration

The `name` field accepts: `"poetry"`, `"opener"`, `"cosmo"`, `"picasso"`, `"gusto"`, or `"solar"`.

Additional configuration: `icons.library`, `appearance.colorScheme` (`"light"`, `"dark"`, `"os"`), `appearance.colorSchemeButton`.

## Theme CSS Variables and Tokens

All themes extend the base token system defined in `@xyd-js/themes/tokens.css`.

### Base Token Categories

| Category | Variables | Purpose |
|----------|-----------|---------|
| **Global Colors** | `--white`, `--black`, `--dark8` through `--dark100` | Foundation colors |
| **Color Semantic** | `--color-bg`, `--color-text`, `--color-primary` | Semantic color mappings |
| **Layout** | `--xyd-sidebar-width`, `--xyd-header-total-height` | Layout dimensions |
| **Typography** | `--xyd-font-size-*`, `--xyd-line-height-*` | Font sizing scale |
| **Components** | `--xyd-button-*`, `--xyd-card-*`, `--xyd-tabs-*` | Component-specific tokens |

## Dynamic Theme Switching

Runtime theme switching handles:

1. **CSS Loading**: Asynchronously loads new theme stylesheet
2. **CSS Cleanup**: Removes old theme stylesheets
3. **State Update**: Updates global settings to trigger re-render
4. **Component Re-instantiation**: New theme class provides updated components

## Theme Build Process

The `@xyd-js/themes` package provides a build script for processing theme CSS:

1. Resolves `@xyd-js/*` imports from monorepo packages
2. Processes CSS with PostCSS plugins
3. Outputs bundled CSS to `dist/` directory
