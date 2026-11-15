---
"@xyd-js/native": patch
"@xyd-js/atlas": patch
"@xyd-js/content": patch
"@xyd-js/documan": patch
---

CLI reference: the bundled OpenCLI converter renders more of a command on its page. A command's exit codes (its own, else its nearest ancestor's), its examples (a sample group of their own), the commands and key bindings of the session it opens (`x-interactive`, as "Interactive commands" and "Keys"), the environment variables it reads (`x-environment`) and the options it inherits from its ancestor commands each get a section. A command group with arguments or options of its own also runs on its own, so its title and usage read `[command]`, not `<command>`. A CLI whose root documents arguments, examples, a session or environment variables gets a page of its own, first in its sidebar. Session commands are rows of their command's page, with their arguments, options and subcommands nested under a toggle that names them ("Show arguments and options"); they never get a page or a sidebar entry. On both engines and in the self-contained binary.

A generated CLI page's `.md` twin, the file `llms.txt` links to, now carries the command as Markdown after its frontmatter: the usage, every section and the examples. Before, it held only the frontmatter.
