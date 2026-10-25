---
"@xyd-js/plugin-docs": patch
"@xyd-js/content": patch
"@xyd-js/core": patch
"@xyd-js/native": patch
"@xyd-js/framework": patch
"@xyd-js/ui": patch
"@xyd-js/theme-gusto": patch
"@xyd-js/theme-solar": patch
"@xyd-js/theme-terrarium": patch
---

Collapsible top-level sidebar groups. A top-level group with `collapsed: true` renders a toggle on its header (a button with the group's name and a chevron, keyboard accessible) and starts collapsed; it opens on a click or when it holds the current page, and the state starts over on the next page like the rest of the sidebar's. Groups without the flag keep their static header. The bundled OpenAPI converter sets the flag on the generated `Objects` group (the `grouped` layout), so the object pages fold behind one header after the endpoints, the area sub-groups inside folding as before; `api.openapi[..].options.objectsCollapsed: false` keeps the group open.
