---
title: Settings
---

# Settings
:::subtitle
Configure your documentation using the configuration file
:::

The settings file is the central configuration hub for your documentation.
You can use either `settings.json` for a simple configuration or `settings.ts|x` if you prefer a more dynamic TypeScript/React based approach.

:::callout
TypeScript/React based configuration is useful if you'd like to use more control over the configuration.
:::

This configuration file controls the look and feel of your documentation, including navigation structure, integrations, analytics tracking, and custom behaviors.

:::callout
Source code of `settings` is available [here](https://github.com/livesession/xyd/blob/master/packages/xyd-core/src/types/settings.ts)
:::

## Properties

### Styling (`styling`)
:::table
```tsx
[
    ["Name","Type", "Description"],
    [
        "name",
        "string",
        "Name of your company or project. Used for the global title."
    ],
    [
        "theme",
        "string",
        "The layout theme of the project. \n\n Examples: `cosmo`, `gusto`, `poetry`, `picasso`"
    ]
]
```
:::

### Structure (`structure`)
:::table
```md
[
    ["Name","Type", "Description"],
    [
        "sidebar",
        "[(SidebarMulti | Sidebar)[]](#type-structure-sidebar)",
        "Definition of sidebar - an array of groups with all the pages within that group"
    ],
    [
        "headers",
        "[Header[]](#type-structure-header)",
        "Array of headers"
    ]
]
```
:::

:::details{kind="tertiary" title="show more" label="Structure subtypes"}

* 
    #### Sidebar (`sidebar`)
    :::table
    ```md
    [
        ["Name","Type", "Description"],
        [
            "group",
            "string",
            "The name of the group."
        ],
        [
        ]
    ]
    ```
    :::

* 
    #### Header (`headers`)
    :::table
    ```md
    [
        ["Name","Type", "Description"],
        [
            "group",
            "string",
            "The name of the group."
        ],
        [
        ]
    ]
    ```
    :::

:::


## Settings.json
This is the simplest way to configure your documentation, you don't need to write any code.

### JSON Schema Validation
The `settings.json` file is validated against a JSON schema to ensure proper configuration. You can reference the schema by including:

```json
{
    "$schema": "https://xyd.dev/schema.json"
}
```

if you use TS/React approuch you can do:
```tsx
import { Settings } from 'xyd-js';

export default {
    // ... your settings configuration here
} satisfies Settings
```

## Code-Based Settings
If you feel that the JSON configuration is not enough, you can use the TypeScript/React based configuration
to have more control and use APIs that are not available in the JSON configuration.

For example, you could define a custom components, adds custom markdown plugins or other customization stuff.