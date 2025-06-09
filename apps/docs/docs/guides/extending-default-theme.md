---
title: Extending the Default Theme
icon: pencil-ruler
---

# Extending the Default Theme
:::subtitle
Learn how to extend the default theme 
:::

While [theme settings](/docs/guides/theme-settings) provide a quick way to customize your documentation,
extending the default theme gives you more flexibility and programmable control. 
 
This approach allows you to build upon the existing design while adding your own customizations, all while maintaining the core functionality of the default theme.

:::callout
All built-in themes like [poetry](https://github.com/livesession/xyd/tree/master/packages/xyd-theme-poetry) or [opener](https://github.com/livesession/xyd/tree/master/packages/xyd-theme-opener) are based on the default theme. 
:::

## Getting Started

:::steps
1. To extend the default theme, create a `.docs/theme` directory in your project root and add an `index.ts` file:
```ts
export {default} from "./theme"
```

2. Next define your own theme based on [`BaseTheme`](/docs/reference/source/BaseTheme):
```tsx
import {BaseTheme} from "xyd-js/themes"

export default class MyTheme extends BaseTheme {
    constructor() {
        super();
        
        // Access theme settings
        const {logo, favicon} = this.theme;
        
        // Add your customizations here
    }
}
```
:::

Full source code of the default theme you can find 
[here](https://github.com/livesession/xyd/blob/master/packages/xyd-themes/src/BaseTheme.tsx).

:::callout
Theme must be exported as a default.
:::

## Overriding Theme Settings

You can override default theme settings by extending the theme configuration in your `xyd.json`:

```json
{
    "theme": {
        "name": "poetry",
        "markdown": {
            // !diff 
            "syntaxHighlight": "material-ocean",
            // ... other markdown settings
        },
        // ... other theme settings
    }
}
```

Then in your theme class, you can modify these settings:

:::code-group{}
```ts Settings API
import {BaseTheme} from "xyd-js/themes"

export default class MyTheme extends BaseTheme {
    constructor() {
        super();
        
        // !diff +
        this.theme.markdown.syntaxHighlight = "github-dark";
    }
}
```

```ts Theme API
import {BaseTheme} from "xyd-js/themes"

export default class MyTheme extends BaseTheme {
    constructor() {
        super();
        
        // !diff +
        this.theme.markdown.syntaxHighlight = "github-dark";
    }
}
```
:::

## Style Customization

Create an `index.css` file in your `.xyd/theme` directory and import that to add custom styles:

```tsx
import {BaseTheme} from "xyd-js/themes"

import './index.css';

export default class MyTheme extends BaseTheme {
...
}
```

:::callout
You can add as many style file as you want. Also names of your imported styles are your own.
:::
 
## Adding a Custom Component {label="Coming soon"}

Here's an example of how to add a custom component to your extended theme:

 :::code-group{}
  ```tsx Settings API
    export default {
        components: {
            CustomBanner
        }
    }
  
    function CustomBanner({kind, children}) {
        return <div class={`banner banner-${kind}`}>
            {children}
        </div>
    }
  ```

  ```tsx Theme API
    import {BaseTheme} from "xyd-js/themes"

    export default class MyTheme extends BaseTheme {
        constructor() {
            super());
            
            // Register custom component
            this.registerComponent(CustomBanner, 'custom-banner');
        }
    }

    function CustomBanner({kind, children}) {
        return <div class={`banner banner-${kind}`}>
            {children}
        </div>
    }
  ``` 
  :::


You can then use this component in your markdown:

```md
:::custom-banner{kind="info"}
    Welcome to our documentation!
:::
```

or you can use a MDX syntax too:

```mdx
<CustomBanner kind="info">
    Welcome to our documentation!
</CustomBanner>
```

:::callout
If you not set name in [`registerComponent`](/docs/reference/source/BaseTheme#registerComponent) function, it will 
convert PascalCase to kebab-case for markdown syntax.
:::