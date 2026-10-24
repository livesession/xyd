---
"@xyd-js/atlas": patch
"@xyd-js/plugin-docs": patch
"@xyd-js/documan": patch
"@xyd-js/core": patch
---

API reference property rows: a constant — a single-value `enum` or an OpenAPI 3.1 `const` — prints its literal in the type column (`"widget"`) with no toggle for the one value; an enum prints its values inline (`"active" | "archived"`, the first six then `…`) and keeps them behind the row's *Show possible types* toggle; a nullable row reads `… | null` whatever its type; a property typed by a component schema links to that schema's page, nested rows included, and keeps its attributes behind *Show properties*. The links resolve on every engine and under an `api.openapi.route` prefix: the uniform preset stamps the reference's prefix into each generated page (`baseMatch`) and both layouts read it back. With the bundled converter, object pages follow the schema's `x-docs`: `name` titles the page, `group` places it after its resource's endpoints, `hidden` leaves it out — and a property typed by a hidden schema renders as plain type text on every page, never as a link to a page that does not exist.
