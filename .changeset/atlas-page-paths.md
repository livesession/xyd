---
"@xyd-js/plugin-docs": patch
"@xyd-js/content": patch
"@xyd-js/core": patch
"@xyd-js/native": patch
---

API reference: a page's path under the route can be set outright with `x-docs.path` on an operation or a component schema, and `api.openapi[..].options.operationPaths` picks how the pages without one are named — `"operation-id"` (the default: the `operationId`, `objects/<Name>`) or `"title"` (`<group>/[<sub-resource>/]<verb>` from the group and a verb-first summary, `widgets/create`, `widgets/parts/list`; `<group>/<label>` for an object page, the label its constant `object` value). The sidebar labels and groups are unchanged, every link follows the final path, nested paths render on both engines, under a basename and under a route alike, and two pages at one path fail the build naming both.
