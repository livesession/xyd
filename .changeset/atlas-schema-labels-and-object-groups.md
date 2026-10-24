---
"@xyd-js/atlas": patch
"@xyd-js/plugin-docs": patch
"@xyd-js/content": patch
"@xyd-js/core": patch
"@xyd-js/native": patch
---

API reference: a property typed by a component schema names that schema in the type column instead of `object` — the schema's constant `object` value when it has one (`widget`), else the schema name — as a link to the schema's page, or as plain text when the schema has none; an array of one reads `array of widget`, a nullable one `widget | null`; a scalar schema keeps its primitive type. With the bundled converter, an object page with an `x-docs.group` is nested under an `Objects` sub-group of that resource's group, after its endpoints, and the sub-group starts collapsed like every nested sidebar group; `api.openapi[..].options.objectsGroup` renames the object groups (default `Objects`).
