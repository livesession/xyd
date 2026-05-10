---
title: Internationalization
description: Ship documentation in multiple languages with locale-prefixed routing and translated navigation
icon: languages
maxTocDepth: 4
tocCard: 
    - link: https://github.com/xyd-js/examples/tree/master/i18n
      title: i18n Example
      description: Multi-language docs with translated sidebars
      icon: docs:github
      
    - link: https://github.com/xyd-js/examples/tree/master/i18n-overrides
      title: Per-Locale Overrides
      description: Different components and theme per language
      icon: docs:github
---

# Internationalization {label="Alpha"}

Serve your documentation in multiple languages with locale-prefixed URLs, translated navigation, and a built-in locale switcher.

## Quick Start

Declare your languages in [`docs.json`](/guides/settings) under [`navigation.languages`](/guides/navigation):

```json docs.json
{
  "theme": { "name": "poetry" },
  "navigation": {
    // !diff +
    "languages": [
      {
        "language": "en",
        "name": "English",
        "default": true,
        "sidebar": [
          {
            "group": "Get Started",
            "pages": ["introduction", "quickstart"]
          }
        ]
      },
      {
        "language": "pl",
        "name": "Polski",
        "sidebar": [
          {
            "group": "Wprowadzenie",
            "pages": ["introduction", "quickstart"]
          }
        ]
      },
      {
        "language": "de",
        "name": "Deutsch",
        "sidebar": [
          {
            "group": "Erste Schritte",
            "pages": ["introduction", "quickstart"]
          }
        ]
      }
    ]
  }
}
```

## File Structure

The default locale lives at the root. Every other locale mirrors the tree under a folder named after its `language` code:

```
your-docs/
├── introduction.md          # default locale (en)
├── quickstart.md
├── pl/
│   ├── introduction.md      # Polish
│   └── quickstart.md
└── de/
    ├── introduction.md      # German
    └── quickstart.md
```

## URLs

| Locale | URL pattern | Example |
|---|---|---|
| Default | `/<slug>` (unprefixed) | `/quickstart` |
| Other | `/<language>/<slug>` | `/pl/quickstart`, `/de/quickstart` |

Root `/` keeps its existing index behavior. The default locale never gets a prefix.

## Translating Navigation

Each language can have its own navigation, sidebar, tabs, anchors, and so on. Build them the same way you build the regular [navigation](/guides/navigation), just nested under the matching language entry.

```json docs.json [descHead="Tip" desc="The full list of fields each <code>languages</code> accepts is in the [Settings reference](/reference/core/settings)."]
{
  "navigation": {
    // !diff +
    "languages": [
      {
        "language": "en",
        "name": "English",
        "default": true,
        // !diff +
        "sidebar": [
          { "group": "Get Started", "pages": ["introduction"] }
        ],
        // !diff +
        "tabs": [
          { "tab": "Guides", "page": "introduction" }
        ]
      },
      {
        "language": "pl",
        "name": "Polski",
        // !diff +
        "sidebar": [
          { "group": "Wprowadzenie", "pages": ["introduction"] }
        ],
        // !diff +
        "tabs": [
          { "tab": "Przewodniki", "page": "introduction" }
        ]
      }
    ]
  }
}
```

### Navigation Catalogs

If your navigation has the same structure in every language, you don't need to repeat the whole tree per locale. Define the structure **once** at `navigation.sidebar`, list the locales under `navigation.languages`, and let the strings come from [translation catalogs](#translation-catalogs):

```json docs.json
{
  "navigation": {
    "languages": [
      { "language": "en", "default": true },
      { "language": "pl" }
    ],
    "sidebar": [
      { "group": "i18n: sidebar.getstarted", "pages": ["intro"] }
    ]
  }
}
```

When a language entry omits `sidebar`/`tabs`/`anchors`/etc., it inherits the field from the top-level `navigation`. Wrap any string in a catalog key (`"i18n: <key>"`) to translate it per locale.

## Translation Catalogs

Catalog is the translation reference system where definitions are not declared explicite at the property level. 
Thanks to that, managing bigger translations is much easier.

### Sources

There are three ways to supply catalogs, in priority order:

:::tabs{kind="secondary"}

1. [Convention](source=convention)
    Drop catalogs at `i18n/<language>.json` in your project root. xyd auto-loads them — no config needed.

    ```
    i18n/
    ├── en.json
    ├── pl.json
    └── de.json
    ```

    ```json en.json
    { "sidebar.getstarted": "Get Started" }
    ```

    ```json pl.json
    { "sidebar.getstarted": "Zaczynamy" }
    ```

2. [Custom file paths](source=files)
    Point to specific files (relative to project root or absolute):

    ```json docs.json
    {
      "i18n": {
        "catalogs": {
          "en": "./locales/english.json",
          "pl": "./tlumaczenia/polski.json"
        }
      }
    }
    ```

3. [Inline](source=inline)
    For small projects, embed catalogs directly in `docs.json`:

    ```json docs.json
    {
      "i18n": {
        "catalogs": {
          "en": { "sidebar.getstarted": "Get Started" },
          "pl": { "sidebar": { "getstarted": "Zaczynamy" } }
        }
      }
    }
    ```
:::

### Format

Both flat dot-keys and nested objects are accepted — and can coexist in the same file. Lookup tries the exact flat key first, then walks dot-segments through nested objects.

```json
{
  "footer.copyright": "All rights reserved",
  "footer": {
    "resources": {
      "header": "Resources"
    }
  }
}
```

## Per-Locale Overrides

If you need to override translations for a built-in structures like [`footer link`](/guides/components#footer) or [`banner`](/guides/components#banner) add `overrides`:

:::tabs{kind="secondary"}

1. [Text overrides](case=text)
    Override just the `children` so the link points to the same URL but renders translated text:

    ```json docs.json [!scroll descHead="Tip" desc="<code>overrides</code> accepts any subset of the <code>Settings</code> interface — <code>theme</code>, <code>components</code>, <code>integrations</code>, <code>seo</code>, etc."]
    {
      "components": {
        "footer": {
          "footnote": {
            "component": "a",
            "props": {
              "href": "https://livesession.io",
              // !diff +
              "children": "Powered by LiveSession"
            }
          }
        }
      },
      "navigation": {
        "languages": [
          { "language": "en", "default": true },
          {
            "language": "pl",
            "overrides": {
              // !diff +
              "components.footer.footnote.props.children": "Wspierane przez LiveSession"
            }
          }
        ]
      }
    }
    ```

2. [Props overrides](case=props)
    Override `href` as well — point Polish users at a localized landing page:

    ```json docs.json [!scroll descHead="Tip" desc="<code>overrides</code> accepts any subset of the <code>Settings</code> interface — <code>theme</code>, <code>components</code>, <code>integrations</code>, <code>seo</code>, etc."]
    {
      "components": {
        "footer": {
          "footnote": {
            "component": "a",
            "props": {
              // !diff +
              "href": "https://livesession.io",
              // !diff +
              "children": "Powered by LiveSession"
            }
          }
        }
      },
      "navigation": {
        "languages": [
          { "language": "en", "default": true },
          {
            "language": "pl",
            "overrides": {
              // !diff +
              "components.footer.footnote.props.children": "Wspierane przez LiveSession",
              // !diff +
              "components.footer.footnote.props.href": "https://pl.livesession.io"
            }
          }
        ]
      }
    }
    ```

3. [Catalog overrides](case=catalog)
    Keep all per-locale customization in the catalog file. Any key prefixed with `$` is treated as a settings override path instead of a translation key:

    ```json pl.json
    {
      "sidebar.getstarted": "Zaczynamy",
      "$components.footer.footnote.props.children": "Wspierane przez LiveSession",
      "$components.footer.footnote.props.href": "https://pl.livesession.io"
    }
    ```
:::

## `i18n` Settings

A top-level [`i18n`](/guides/settings) is a global configuration for how internationalization behaves:

::atlas{apiRefItemKind="secondary" references="@uniform('@core/types/settings.ts', {mini: 'I18nConfig'})"}

