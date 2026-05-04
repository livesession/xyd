# Theme System

The theme system provides a comprehensive styling and theming architecture for xyd documentation sites. It includes six built-in themes, a design token system, color scheme management (light/dark/auto), and extensive customization options through appearance configuration.

## Theme Architecture Overview

The system uses a hierarchical component structure: `xyd-ui` (Radix UI primitives) → `xyd-components` (specialized components) → `xyd-atlas` (design tokens and API components).

### CSS Cascade Layers

| Layer | Priority | Purpose |
|-------|----------|---------|
| `reset` | 1 (Lowest) | CSS resets and normalizations |
| `defaults` | 2 | Default component styles |
| `components` | 3 | Component-specific styles |
| `themes` | 4 | Theme-specific overrides |
| `user` | 5 | User customizations via `appearance` config |
| `overrides` | 6 (Highest) | Final overrides |

## Color Scheme System

Supports three color scheme modes: `light`, `dark`, and `auto` (follows system preference).

### Color Scheme Implementation

1. Reads `localStorage.getItem('xyd-color-scheme')` or falls back to configured default
2. Resolves `'auto'` by checking `window.matchMedia('(prefers-color-scheme: dark)')`
3. Sets `data-color-scheme` attribute on `<html>` element
4. CSS tokens respond to the attribute via selectors

## Design Tokens System

Uses CSS custom properties (variables) for all design tokens, defined in `tokens.css`.

### Core Global Tokens

| Token | Light Value | Dark Value | Usage |
|-------|-------------|-----------|-------|
| `--white` | `#fff` | `#0e0e10` | Background base |
| `--black` | `#000` | `#fff` | Text base |
| `--dark8` | `#f7f7f8` | `#1a1a1a` | Subtle backgrounds |
| `--dark16` | `#f9f9f9` | `#2d2d2d` | Surface backgrounds |
| `--dark32` | `#ececf1` | `#404040` | Borders, dividers |
| `--dark48` | `#6e6e80` | `#9E9E9E` | Muted text |
| `--dark60` | `#443a3a` | `#a3a3a3` | Secondary text |
| `--dark80` | `#111827` | `#d4d4d4` | Primary text |
| `--dark100` | `var(--black)` | `var(--black)` | Maximum contrast |

## Appearance Configuration

Users customize themes through `theme.appearance` in settings.

### Primary Color Customization

The `generateColorTokens()` function creates CSS variables:

- `--color-primary`: Base primary color
- `--xyd-sidebar-item-bgcolor--active`: Active sidebar background
- `--xyd-sidebar-item-color--active`: Active sidebar text
- `--xyd-toc-item-color--active`: Active TOC color
- `--color-primary--active`: Hover/active state (75% opacity)

## Built-in Theme Packages

| Package | Description |
|---------|-------------|
| `@xyd-js/theme-solar` | Clean, minimal theme |
| `@xyd-js/theme-poetry` | Typography-focused theme |
| `@xyd-js/theme-gusto` | Bold, expressive theme |
| `@xyd-js/theme-picasso` | Artistic, colorful theme |
| `@xyd-js/theme-opener` | Open, spacious theme |
| `@xyd-js/theme-cosmo` | Modern, cosmic theme |

All themes depend on: `@xyd-js/atlas`, `@xyd-js/ui`, `@xyd-js/components`, `@xyd-js/framework`, `@xyd-js/themes`, `@linaria/core`.
