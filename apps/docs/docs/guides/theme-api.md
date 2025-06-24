---
title: Theme API
icon: pen-tool
---

# Theme API {label="Coming Soon"}
:::subtitle
Learn how to use Theme API
:::

While [theme settings](/docs/reference/core/theme) provide a quick way to customize your documentation,
using the Theme API gives you more flexibility and programmable control. 
 
This approach allows you to build upon the existing design while adding your own customizations, all while maintaining the core functionality of the default theme.

:::callout
All built-in themes like [poetry](https://github.com/livesession/xyd/tree/master/packages/xyd-theme-poetry) or [opener](https://github.com/livesession/xyd/tree/master/packages/xyd-theme-opener) are based on the default theme and use Theme API.
:::

## Getting Started

To use Theme API you need to create `.docs/theme/index.ts` file:
```ts
import {BaseTheme} from "xyd-js/themes"

export default class MyTheme extends BaseTheme {
    constructor() {
        super();

        // you can access theme API here
        // this.theme # do stuff what u want with `theme`
    }
}
```

for example:
```ts
// !diff +
this.theme.markdown.syntaxHighlight = "github-dark";
```

## Style Customization

Create an `index.css` file in your `.docs/theme` directory and import that to add custom styles:

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

## Overriding Components {label="Coming Soon"}

 :::code-group{}
  ```tsx Settings
    export default {
        components: {
            Badge: MyCustomBadge
        }
    }
  
    function MyCustomBadge({size, children}) {
        return <div class={`badge size-${size}`}>
            {children}
        </div>
    }
  ```

  ```tsx BaseTheme
    import {BaseTheme} from "xyd-js/themes"

    export default class MyTheme extends BaseTheme {
        constructor() {
            super());
            
            // register custom components
            this.components({
                Badge: MyCustomBadge,
            });
        }
    }

    function MyCustomBadge({size, children}) {
        return <div class={`badge size-${size}`}>
            {children}
        </div>
    }
  ``` 
:::

## Custom Components [maxTocDepth=3] {label="Coming Soon"}

Here's an example of how to add a custom component to your theme:

 :::code-group{}
  ```tsx Settings
    export default {
        customComponents: {
            CustomBanner
        }
    }
  
    function CustomBanner({kind, children}) {
        return <div class={`banner banner-${kind}`}>
            {children}
        </div>
    }
  ```

  ```tsx BaseTheme
    import {BaseTheme} from "xyd-js/themes"

    export default class MyTheme extends BaseTheme {
        constructor() {
            super());
            
            // register custom component
            this.customComponents({ 
                CustomBanner
            });
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
If you not set name in [`customComponents`](/docs/reference/source/BaseTheme#registerComponent) function, it will 
convert PascalCase to kebab-case for markdown syntax.
:::

###  Surfaces {label="Coming Soon"}
If you want to add your custom components into specific place inside docs, you can use `surface`:
 :::code-group{}
  ```tsx Settings
    export default {
        customComponents: {
            CustomBanner: {
                component: CustomBanner,
                // !diff +
                surface: "page.footer"
            }
        }
    }
  
    function CustomBanner({kind, children}) {
        return <div class={`banner banner-${kind}`}>
            {children}
        </div>
    }
  ```

  ```tsx BaseTheme
    import {BaseTheme} from "xyd-js/themes"

    export default class MyTheme extends BaseTheme {
        constructor() {
            super();
            
            // register custom component
            this.customComponents({
                CustomBanner: {
                    component: CustomBanner,
                    // !diff +
                    surface: "page.footer"
                }
            })
        }
    }

    function CustomBanner({kind, children}) {
        return <div class={`banner banner-${kind}`}>
            {children}
        </div>
    }
  ``` 
:::

if you still want to have this component available inside your content:
```ts
{
    surface: "page.footer"
    // !diff +
    content: true
}
```

