# Theme Architecture

This document explains the theme architecture in xyd, covering the BaseTheme class, CSS layer system, design tokens, and how themes integrate with the framework.

## Overview

The theme system is built around extensible React classes that define rendering logic for every part of a documentation site.

## BaseTheme Class Architecture

### Core Theme Methods

| Method | Purpose | Returns |
|--------|---------|---------|
| Layout | Root layout structure | React component wrapping children |
| Page | Page-level container | React component for page structure |
| Navbar | Top navigation bar | React element |
| Sidebar | Left sidebar with navigation | React element |
| Content | Main content area | React element |
| ContentNav | Right sidebar with TOC | React element |
| Footer | Site-wide footer | React element |
| Breadcrumbs | Breadcrumb navigation | React element |
| NavLinks | Previous/next page navigation | React element |

## Framework Context Integration

Themes use framework hooks: useSettings(), useMetadata(), useAppearance(), useToC(), useBreadcrumbs(), useNavLinks(), useEditLink().

## CSS Layer System

Layer hierarchy (increasing specificity):
reset, defaults, defaultfix, components, fabric, templates, decorators, themes, themedecorator, presets, user, overrides

## Design Token System

| Category | CSS Variable Prefix | Purpose |
|----------|-------------------|---------|
| Global Colors | --white, --black, --dark* | Foundation colors |
| Semantic | --color-*, --text-* | Intent-based aliases |
| Layout | --xyd-layout-*, --xyd-page-* | Layout dimensions |
| Typography | --xyd-font-* | Font properties |
| Components | --xyd-component-* | Component-specific tokens |

## Color Scheme System

Supports light, dark, and OS-preference. Applied before page render via preload script to prevent flash.

## Appearance Configuration

Runtime configuration via settings.theme.appearance. The generateUserCss() function processes colors and cssTokens to generate CSS.

## Content Decoration

The ContentDecorator component wraps page content and applies spacing through the decorators CSS layer.

## Font System

Supports custom fonts with automatic @font-face generation. Detects format from extension (.woff2, .woff, .ttf).
