---
"@xyd-js/content": patch
---

A page whose `cli`, `openapi`, `graphql`, `mcp` or `uniform` frontmatter names several regions (`cli: ~/acme.opencli.json#login,remote`) now renders every one of them, in its string and its object form. Before, the value was cut at its first comma, so the page rendered only the first region while its `.md` twin listed them all.
