---
title: Customization Quickstart
icon: pencil-ruler
tocCard: 
    link: https://github.com/xyd-js/customization-samples
    title: Customization Samples
    description: Learn how to setup customize your docs
    icon: docs:github
---

# Customization Introduction
:::subtitle
Learn the fundamentals of documentation customization
:::

Customizing your documentation allows you to create a unique and branded experience for your users.
There are three main approaches for customization:

1. Customization via [settings file](/docs/guides/settings) - choose from a variety of [pre-built themes](/docs/guides/themes) 
and tweak using available [theme settings](/docs/reference/core/theme)

2. [Extending the default theme](/docs/guides/theme-api) - build upon the existing design while adding your own enhancements via code

3. [Creating a new theme](/docs/guides/custom-theme) - develop a completely new theme from scratch via code

## Customization via Settings file
This is the simplest way to customize your documentation.
 You can do this by editing the `docs.json` file in the root of your project.

```json
{
    "theme": {
        "name": "poetry",
        "logo": "/path/to/logo.svg",
        "favicon": "/path/to/favicon.svg",
        // ... other theme settings
    }
}
```
For more details on the theme settings, see the [reference](/docs/guides/customization-quickstart#theme-reference) guide.

## Customization via Code [maxTocDepth=3]
To customize your documentation via code, you'll need to work with a `.docs/theme` directory inside your project root:
```md [descHead="CSS Tokens" desc="List of all available css tokens you can find [here](https://github.com/livesession/xyd/blob/master/packages/xyd-themes/src/styles/tokens.css)."]
.
├─ .docs            # .docs root
│  └─ theme
│     ├─ index.ts   # theme entry
│     └─ index.css  # theme styles entry
|
└─ docs.json        # settings file
```

### theme/index.css
You can customize theme styles via index.css:
```css [descHead="Tip" desc="Check out [sample project](https://github.com/xyd-js/examples/blob/master/theme-index.css)."]
/* your custom css styles */
```

### theme/index.ts {label="Experimental"}
<code>xyd</code> will lookup for `index.ts` if you want to modify or create new theme behavior. 
This file is only necessary when you need to extend default theme's functionality or create a new theme:

```ts
import {BaseTheme} from "xyd-js/themes"

export default class MyTheme extends BaseTheme {
    constructor() {
        super();

        // you can access theme settings here
        // this.theme # do stuff what u want with `theme`
    }
}
```

However, if you only want to customize styles, you can simply use `index.css` without creating an `index.ts` file.


:::callout
Learn more about [extending the default theme](/docs/guides/theme-api)
or [creating a custom theme](/docs/guides/custom-theme) via code.
:::

## Theme Reference

Theme settings are defined as an object with the following reference:

::atlas{apiRefItemKind="secondary" references="@uniform('@core/types/settings.ts', {mini: 'Theme'})"}

:::callout
Full settings reference you can read [here](/docs/reference/core/settings).
:::