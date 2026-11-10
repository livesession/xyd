---
"@xyd-js/plugin-docs": patch
"@xyd-js/content": patch
"@xyd-js/core": patch
"@xyd-js/native": patch
---

API reference: with the bundled converter, the object pages (the component schemas) sit under one `Objects` group, the last group of the generated sidebar — the schemas without a resource group first, then a collapsed sub-group per resource group (`x-docs.group`) in the order the groups appear above it, opened by a click or by landing on one of its pages. `api.openapi[..].options.objectsLayout` picks the layout: `"grouped"` (the default) or `"per-area"`, the previous shape — an object page nested under its own resource group's `Objects` sub-group, after the endpoints. `objectsGroup` renames the groups in both layouts.
