---
title: Appearance
icon: docs:appearance
maxTocDepth: 3
---

# Appearance {subtitle="Customize the visual aspects of your documentation"}

The appearance configuration allows you to customize the visual aspects of your documentation site, including colors, layout, and component behavior.

:::callout
By default each [Theme](/guides/themes) use different appearance settings. 
You can always overwrite that.
:::

## Color Scheme
Control the default color scheme for your documentation site.

![asset](/public/assets/ColorScheme.png)

Configure the default color scheme that will be applied when users first visit your site:
```json
{
    "theme": {
        "appearance": {
            "colorScheme": "'light' | 'dark' | 'os'"
        }
    }
}
```
&nbsp;

## Colors
Define the primary colors used throughout your documentation site.

![asset](/public/assets/Colors.png)

Set the main color palette for your theme:
```json
{
    "theme": {
        "appearance": {
            "colors": {
                "primary": "#3b82f6",
                "dark": "#000",
                "light": "#fff"
            }
        }
    }
}
```
::atlas{apiRefItemKind="secondary" references="@uniform('@core/types/settings.ts', {mini: 'Colors'})"}

## CSS Tokens
Define custom CSS variables for advanced theming.

![asset](/public/assets/CSSTokens.png)

Create custom CSS tokens that can be used throughout your theme:
```json
{
    "theme": {
        "appearance": {
            "cssTokens": {
                "--dark100": "#000"
            }
        }
    }
}
```
:::callout{kind="tip"}
List of available tokens you can find [here](https://github.com/livesession/xyd/blob/master/packages/xyd-themes/src/styles/tokens.css)
:::

## Logo
Configure where and how your logo appears in the interface.

![Logo](/public/assets/Logo.png)

Control logo visibility in different areas of the interface:
```json
{
    "theme": {
        "appearance": {
            "logo": {
                "sidebar": "true | false | 'mobile' | 'desktop'",
                "header": "true | false | 'mobile' | 'desktop'"
            }
        }
    }
}
```
::atlas{apiRefItemKind="secondary" references="@uniform('@core/types/settings.ts', {mini: 'AppearanceLogo'})"}

## Search
Configure the search functionality and its placement.

![asset](/public/assets/Search.png)


Customize search bar behavior and positioning:
```json
{
    "theme": {
        "appearance": {
            "search": {
                "sidebar": "true | false | 'mobile' | 'desktop'",
                "middle": "true | false | 'mobile' | 'desktop'",
                "right": "true | false | 'mobile' | 'desktop'",
                "fullWidth": "true | false"
            }
        }
    }
}
```
::atlas{apiRefItemKind="secondary" references="@uniform('@core/types/settings.ts', {mini: 'AppearanceSearch'})"}

## Header
Configure the header appearance and behavior.

![asset](/public/assets/Header.png)

Customize header styling and functionality:
```json
{
    "theme": {
        "appearance": {
            "header": {
                "externalArrow": "true | false",
                "separator": "'right'",
                "type": "'classic' | 'pad'"
            }
        }
    }
}
```
::atlas{apiRefItemKind="secondary" references="@uniform('@core/types/settings.ts', {mini: 'AppearanceHeader'})"}

## Tabs
Configure tab navigation appearance and placement.

![asset](/public/assets/Tabs.png)

Control how tabs are displayed in the interface:
```json
{
    "theme": {
        "appearance": {
            "tabs": {
                "surface": "'center' | 'sidebar'"
            }
        }
    }
}
```
::atlas{apiRefItemKind="secondary" references="@uniform('@core/types/settings.ts', {mini: 'AppearanceTabs'})"}

## Sidebar
Configure sidebar appearance and scroll behavior.

![asset](/public/assets/Sidebar.png)

Customize sidebar styling and scroll indicators:
```json
{
    "theme": {
        "appearance": {
            "sidebar": {
                "externalArrow": "true | false",
                "scrollShadow": "true | false",
                "scrollbar": "'secondary'",
                "scrollbarColor": "#000"
            }
        }
    }
}
```
::atlas{apiRefItemKind="secondary" references="@uniform('@core/types/settings.ts', {mini: 'AppearanceSidebar'})"}

## Buttons
Configure button styling and appearance.

![asset](/public/assets/Buttons.png)

Customize button corner radius and styling:
```json
{
    "theme": {
        "appearance": {
            "buttons": {
                "rounded": "true | false | 'lg' | 'md' | 'sm'"
            }
        }
    }
}
```
::atlas{apiRefItemKind="secondary" references="@uniform('@core/types/settings.ts', {mini: 'AppearanceButtons'})"}

## Banner
Configure banner positioning and behavior.

![asset](/public/assets/Banner.png)

Control banner positioning and display:
```json
{
    "theme": {
        "appearance": {
            "banner": {
                "fixed": "true | false"
            }
        }
    }
}
```
::atlas{apiRefItemKind="secondary" references="@uniform('@core/types/settings.ts', {mini: 'AppearanceBanner'})"}

## Content
Configure content writing and display options.

![asset](/public/assets/Content.png)

Customize content appearance and navigation elements:
```json
{
    "theme": {
        "appearance": {
            "content": {
                "kind": "'secondary'",
                "breadcrumbs": "true | false",
                "sectionSeparator": "true | false"
            }
        }
    }
}
```
::atlas{apiRefItemKind="secondary" references="@uniform('@core/types/settings.ts', {mini: 'AppearanceContent'})"}

## Navigation Dropdown
Style the [dropdown menus](/guides/navigation) on header anchors and tabs (the
`dropdownMenu` feature).

```json
{
    "theme": {
        "appearance": {
            "navigationDropdown": {
                "chevron": "'rotate' | 'static'",
                "items": "'padded' | 'flush'"
            }
        }
    }
}
```
::atlas{apiRefItemKind="secondary" references="@uniform('@core/types/settings.ts', {mini: 'AppearanceNavigationDropdown'})"}

- **`chevron`** — trigger chevron behavior when open: `"rotate"` (default) flips it, `"static"` leaves it unchanged.
- **`items`** — `"flush"` makes the hovered item background touch all four edges of
  the popover (no surrounding padding); `"padded"` (default) keeps a small inset with
  rounded item corners.

### Advanced: CSS variables
For finer control, set the underlying variables via [`cssTokens`](#css-tokens) — e.g.
rotate the chevron a quarter turn:
```json
{
    "theme": {
        "appearance": {
            "cssTokens": {
                "--xyd-nav-dropdown-chevron-rotate": "90deg"
            }
        }
    }
}
```

| Variable | Default | What it controls |
|---|---|---|
| `--xyd-nav-dropdown-chevron-rotate` | `180deg` | Trigger chevron rotation when open (`0deg` disables) |
| `--xyd-nav-dropdown-padding` | `6px` | Padding around the menu panel |
| `--xyd-nav-dropdown-gap` | `2px` | Gap between items |
| `--xyd-nav-dropdown-item-radius` | small | Item corner radius |
| `--xyd-nav-dropdown-item-padding` | `6px 8px` | Per-item padding (bumped to `10px 16px` when `items: "flush"`) |
| `--xyd-nav-dropdown-bgcolor` | content bg | Menu panel background |
| `--xyd-nav-dropdown-border-color` | header border | Menu panel border |
| `--xyd-nav-dropdown-shadow` | soft shadow | Menu panel shadow |
| `--xyd-nav-dropdown-item-bgcolor--hover` | subtle | Hovered/active item background |

For anything beyond tokens, target the custom elements directly (in a custom
stylesheet or theme):

| Element / part | What it is |
|---|---|
| `xyd-nav-dropdown` | the dropdown host (trigger + menu) |
| `[part="dropdown-trigger"]` | the trigger (anchor/tab label) |
| `xyd-nav-dropdown-menu` | the menu panel (popover content + each submenu) |
| `xyd-nav-dropdown-item` | a menu item / submenu trigger |
| `[part="dropdown-icon"]` · `[part="dropdown-label"]` · `[part="dropdown-description"]` · `[part="dropdown-submenu-indicator"]` | item internals |

```css
xyd-nav-dropdown-menu { border-radius: 12px; }
xyd-nav-dropdown-item { font-size: 14px; }
```
