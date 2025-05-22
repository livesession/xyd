---
title: Extending the Default Theme
icon: pencil-ruler
---

# Extending the Default Theme
:::subtitle
Learn how to extend the default theme to match your brand.
:::

While [theme settings](/docs/guides/theme-settings) provide a quick way to customize your documentation,
extending the default theme gives you more flexibility and control. 
 
This approach allows you to build upon the existing design while adding your own customizations, all while maintaining the core functionality of the default theme.

:::callout
All built-in themes like [poetry](#) or [gusto](#) are based on the default theme. 
:::

## Getting Started

To extend the default theme, create a `.xyd/theme` directory in your project root and add an `index.ts` file:

```ts
import {BaseTheme, type Theme} from "xyd-js/themes"

export default class MyTheme extends BaseTheme {
    constructor(theme: Theme) {
        super(theme);
        
        // Access theme settings
        const {logo, favicon} = theme;
        
        // Add your customizations here
    }
}
```

Full source code of the default theme you can find 
[here](https://github.com/livesession/xyd/blob/master/packages/xyd-themes/src/BaseTheme.tsx).

## Overriding Theme Settings

You can override default theme settings by extending the theme configuration in your `xyd.json`:

```json
{
    "theme": {
        "name": "poetry",
        "markdown": {
            "syntaxHighlight": "material-ocean",
            // ... other markdown settings
        },
        // ... other theme settings
    }
}
```

Then in your theme class, you can modify these settings:

```ts
export default class MyTheme extends BaseTheme {
    constructor(theme: Theme) {
        super(theme);
        
        theme.markdown.syntaxHighlight = "github-dark";
    }
}
```

### Style Customization

Create an `index.css` file in your `.xyd/theme` directory to add custom styles:

```css
/* Custom styles for your extended theme */
.custom-layout {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
}

.custom-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 0;
}
```

:::callout
For more advanced customization needs, consider [creating a custom theme](/docs/guides/custom-theme) from scratch.
:::

## Adding a Custom Component

Here's an example of how to add a custom component to your extended theme:

```tsx
export default class MyTheme extends BaseTheme {
    constructor(theme: Theme) {
        super(theme);
        
        // Register custom component
        this.registerComponent(CustomBanner, 'custom-banner');
    }
}

function CustomBanner({text, children}: {text: string, children: React.ReactNode}): string {
    return <div class="custom-banner">
        <p>{text}</p>
        {children}
    </div>
}
```

You can then use this component in your markdown:

```md
:::custom-banner{text="Welcome to our documentation!"}
I'm a child
:::
```

or you can use a MDX syntax too:

```mdx
<CustomBanner text="Welcome to our documentation!">
    <>I'm a child</>
</CustomBanner>
```

:::callout
If you not set `name` in [`registerComponent`](#) function, it will 
convert PascalCase to kebab-case for markdown syntax.
:::