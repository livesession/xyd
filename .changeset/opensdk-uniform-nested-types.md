---
"@xyd-js/opensdk-uniform": patch
"@xyd-js/native": patch
---

SDK type references: the `Parameters` / `Returns` rows expand a field typed by another type into that type's rows (arrays through their item type, a self-referencing type once per chain; an enum's values and a union's variants as the row's possible types, in the shape the REST rows use), from the `nested` table the SDK docs now carry (`x-sdk.<lang>.types.nested`, opensdk 0.2.2). A type that comes from a component schema links to the schema's page — resolved from the references list's component pages or the operation's own REST rows, so an `x-docs.path` is followed and a hidden schema gets no link; a synthesized inline type renders as plain type text. An older `x-sdk` (no `nested`, no `schemaRef`) renders one level deep and links only to pages the reference's evidence knows, never a guessed `objects/<Type>`.
