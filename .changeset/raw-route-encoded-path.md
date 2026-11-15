---
"@xyd-js/host": patch
---

A page whose file name has a space or a non-ASCII character (`guides/my page.md`) now gets its raw `.md` twin and its `llms.txt` link: the raw-file route decodes the request path before it looks the file up. Before, it answered 404, which aborted a prerendered build.
