---
"@xyd-js/components": patch
"@xyd-js/atlas": patch
"@xyd-js/core": patch
"@xyd-js/opensdk-uniform": patch
"@xyd-js/plugin-docs": patch
---

API reference SDK switcher: `?lang=<id>` in a page URL seeds the page-wide SDK language (stored under `xyd:sdk-language`) and the switcher writes every change back to the URL, so a copied link carries the reader's language; markdown code groups whose tabs are different languages share that one choice with the reference — picking a tab in a guide switches the reference and the other way round — while a group of one language (`npm | pnpm | yarn`) keeps its own tab; the switcher lists the languages in the configured order — `sdk.languages` when set, else a spec's own `x-sdk.languages`, else the default — with `Shell` always first.
