---
"@xyd-js/plugin-docs": patch
"@xyd-js/native": patch
"@xyd-js/framework": patch
"@xyd-js/ui": patch
---

API reference: tag groups and display names. With the bundled converter, the document's `x-tagGroups` (`[{ name, tags }]`) groups the generated top-level groups into sections — a section takes the place of its first group and lists its groups in the order of its `tags`, each one a nested group that starts folded and opens on a click or when it holds the current page — and a tag's `x-displayName` labels every group named after it, the object pages' sub-groups included. A tag in no tag group keeps its place, the `Objects` group stays last, and page paths and links do not change; a document without either extension, or with an `x-docs.sidebar`, keeps the sidebar it had. No option: the document drives it, on both engines and in the self-contained binary.

Sidebar: a nested group's toggle is a plain `type="button"` with `aria-expanded` (its rows open or folded) and `aria-controls` (the id of the subtree it folds), and no longer carries the router link's `prefetch` attribute. The site root no longer opens the first nested group of each top-level group (or a collapsed group's toggle): a group's row never matches the current page.
