---
"@xyd-js/content": patch
"@xyd-js/plugin-docs": patch
"@xyd-js/documan": patch
---

CLI reference: `api.cli[..].options.globalOptionsPerCommand: true` now puts the CLI's global options on every command page. The sidebar build and the per-page conversion read the option through one resolver (`resolveCliFileOptions`), so a page is converted with the options its navigation was built with; before, the pages were converted without it, and with no "Global options" page in the navigation the global options appeared nowhere. A generated command page names its document relative to the docs root (`cli: ~/acme.opencli.json#deploy`) instead of the build machine's absolute path, in the page payload and in its `.md` twin alike, so the output no longer depends on the directory it was built in.

Sites under `advanced.basename`: the client asks for page data at `<basename>/_xyd/data` (the dev server answers there and, for an older page, at the root), and only a JSON answer counts — a static host's page or 404 sends the client to the target page as before, never to the host root. The `llms.txt` links carry the basename too: `/docs/guides/intro.md` under `"basename": "/docs"`, with `ai.llmsTxt.baseUrl` (the site's origin) in front, and a baseUrl that already ends with the basename is not prefixed twice.
