---
title: Settings
---

# Settings
:::subtitle
Configure your documentation using the configuration file
:::

The settings file is the central configuration hub for your documentation.
You can use either `xyd.json` for a simple configuration or `xyd.ts|x` if you prefer a more dynamic TypeScript/React based approach.

:::callout
TypeScript/React based configuration is useful if you'd like to use programmatic control over the configuration.
:::

This configuration file controls the look and feel of your documentation, including navigation structure, integrations, analytics tracking, and custom behaviors.

:::callout
Source code of `settings` is available [here](https://github.com/livesession/xyd/blob/master/packages/xyd-core/src/types/settings.ts).
:::

## Properties

:::atlas{kind="secondary" references="@uniform('~/../../packages/xyd-core/src/types/settings.ts')" collapse=1 depth=3}
:::

## xyd.json
This is the simplest way to configure your documentation, you don't need to write any code.

### JSON Schema Validation
The `xyd.json` file is validated against a JSON schema to ensure proper configuration. You can reference the schema by including:

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

&nbsp;

## Code-Based Settings
If you feel that the JSON configuration is not enough, you can use the TypeScript/React based configuration
to have more control and use APIs that are not available in the JSON configuration.

For example, you could define a custom components, adds custom markdown plugins or other customization stuff.