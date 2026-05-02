# Design Tokens and Styling

This document describes the design token system and styling architecture used throughout xyd-js. Design tokens are CSS custom properties that define the visual design language.

## Token Categories

| Category | Token Prefix | Purpose |
|----------|--------------|---------|
| **Global** | `--white`, `--black`, `--dark*` | Primitive color values |
| **Semantic** | `--color-*`, `--text-*` | Intent-based aliases |
| **Layout** | `--xyd-*` | Spacing and structure |
| **Typography** | `--xyd-font-*` | Font properties |
| **Component** | `--xyd-{component}-*` | Component-specific styles |

## Color System and Dark Mode

Dark mode is handled through:

1. **Explicit `data-color-scheme="dark"` attribute**
2. **System preference with media query**
3. **Client-side initialization** pre-render script

## CSS Layer System

```
@layer reset, defaults, defaultfix, components, fabric, templates, decorators, themes, themedecorator, presets, user, overrides;
```

## Dynamic Token Generation

| Function | Purpose | Output |
|----------|---------|--------|
| `generateUserCss()` | Main orchestrator | `:root { ... }` and dark mode selectors |
| `generateColorTokens()` | Primary color variants | CSS custom properties |
| `tokensToCss()` | Token object to CSS | CSS declaration block |
| `generateDarkCss()` | Dark mode wrapper | `[data-color-scheme="dark"] { ... }` |
| `generateFontCss()` | Font-face rules | `@font-face` and `:root` variables |

## Layout Tokens

| Token | Default Value | Purpose |
|-------|---------------|---------|
| `--xyd-sidebar-width` | `250px` | Desktop sidebar width |
| `--xyd-nav-height` | `50px` | Navigation bar height |
| `--xyd-subnav-height` | `44px` | Sub-navigation height |
| `--xyd-page-gutter` | `8px` | Page edge spacing |
| `--xyd-border-radius-small` | `4px` | Small border radius |
| `--xyd-border-radius-medium` | `8px` | Medium border radius |
| `--xyd-border-radius-large` | `16px` | Large border radius |

## Typography Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--xyd-font-size-xsmall` | `12px` | Tiny text |
| `--xyd-font-size-small` | `14px` | Secondary text |
| `--xyd-font-size-medium` | `16px` | Body text |
| `--xyd-font-size-large` | `18px` | Emphasized text |
| `--xyd-font-size-xlarge` | `22px` | Subheadings |
| `--xyd-font-size-2xl` | `32px` | Page headings |
| `--xyd-font-size-3xl` | `48px` | Hero text |

## Button Tokens

| Token | Purpose |
|-------|---------|
| `--xyd-button-primary-bg` | Primary button background |
| `--xyd-button-primary-color` | Primary button text |
| `--xyd-button-secondary-bg` | Secondary button background |
| `--xyd-button-border-radius` | Button corner rounding |

## Sidebar Tokens

| Token | Purpose |
|-------|---------|
| `--xyd-sidebar-bgcolor` | Sidebar background |
| `--xyd-sidebar-item-color` | Inactive item text |
| `--xyd-sidebar-item-color--active` | Active item text |
| `--xyd-sidebar-item-bgcolor--active` | Active item background |
| `--xyd-sidebar-divider-color` | Section divider |

## Atlas Design System Tokens

| Token | Purpose |
|-------|---------|
| `--XydAtlas-Ref-Palette-White` | Atlas white reference |
| `--XydAtlas-Ref-Palette-Primary-60` | Primary shade 60 |
| `--XydAtlas-Ref-Palette-Neutral-10` | Lightest neutral |
| `--XydAtlas-Ref-Palette-Neutral-100` | Darkest neutral |
