---
title: Settings
icon: settings
---

# Settings
:::subtitle
Configure the settings for your documentation
:::

The settings file is the central configuration hub for your documentation. 
It's available at root of your project inside the `docs.json` file.


This configuration file controls the look and feel of your documentation, including [navigation](/docs/guides/navigation), 
[themes](/docs/guides/themes), [integrations](/docs/guides/integrations/analytics/analytics-integrations) and other.

:::callout
Source code of `settings` is available [here](https://github.com/livesession/xyd/blob/master/packages/xyd-core/src/types/settings.ts).
:::

## Reference
This section contains the full reference for the docs.json file:

::atlas{apiRefItemKind="secondary" references="@uniform('@core/types/settings.ts', {mini: 'Settings'})"}


## Environment Variables
Load environment variables from `.env` files to keep sensitive values out of your code.

**Supported files:** `.env`, `.env.local`, `.env.development`, `.env.production`

**Usage:**
```bash
# .env
LS_TRACK_ID=YOUR_TRACK_ID
```

```json [descHead="Tip" desc="Install analytics integrations to measure important [insights](/docs/guides/integrations/analytics/analytics-integrations)."]
// docs.json
{
    ...
    "integrations": {
        "analytics": {
            "livesession": {
                "trackId": "$LS_TRACK_ID"
            }
        }
    }
}
```


## JSON Schema Validation
The `docs.json` file is validated against a JSON schema to ensure proper configuration. You can reference the schema by including:

```json
{
    "$schema": "https://docs.xyd.dev/public/docs.json"
}
```

## Code-Based Settings {label="Coming Soon"}
If you feel that the JSON configuration is not enough, you can use the TypeScript/React based configuration
to have more control and use APIs that are not available in the JSON configuration.

For example, you could define a custom components, adds custom markdown plugins or other customization stuff:

```ts
import { Settings } from 'xyd-js';

export default {
    // ... your settings configuration here
} satisfies Settings
```

