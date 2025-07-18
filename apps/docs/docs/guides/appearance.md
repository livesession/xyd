---
title: Appearance
icon: docs:appearance
maxTocDepth: 3
---

# Appearance {subtitle="Customize the visual aspects of your documentation"}

The appearance configuration allows you to customize the visual aspects of your documentation site, including colors, layout, and component behavior.

## Properties

### Color Scheme
Control the default color scheme for your documentation site.

![asset](/public/assets/ColorScheme.png)

Configure the default color scheme that will be applied when users first visit your site:
```json
{
    "theme": {
        "appearance": {
            "defaultColorScheme": "'light' | 'dark' | 'os'"
        }
    }
}
```
&nbsp;

### Colors
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
&nbsp;

### CSS Tokens
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

### Logo
Configure where and how your logo appears in the interface.

![asset](/public/assets/Logo.png)

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
&nbsp;

### Search
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
&nbsp;

### Header
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
&nbsp;

### Tabs
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
&nbsp;

### Sidebar
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
&nbsp;

### Buttons
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
&nbsp;

### Banner
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
&nbsp;

### Content
Configure content writing and display options.

![asset](/public/assets/Content.png)

Customize content appearance and navigation elements:
```json
{
    "theme": {
        "appearance": {
            "content": {
                "kind": "'secondary'",
                "breadcrumbs": "true | false"
            }
        }
    }
}
```
&nbsp;

## Reference

::atlas{apiRefItemKind="secondary" references="@uniform('@core/types/settings.ts', {mini: 'Appearance'})"}