# @xyd-js/opencli-completion

Generate shell completion scripts from an [OpenCLI](https://opencli.org) document. The "tree"
the generators walk **is an OpenCLI doc** — so any CLI that can describe itself as OpenCLI gets
real shell completions for free.

```ts
import { zsh, fish, completion } from '@xyd-js/opencli-completion';

zsh(opencliSpec);            // → a `#compdef` zsh script
fish(opencliSpec);           // → a fish completion script
completion(opencliSpec, sh); // → dispatch by shell ('zsh' | 'fish')
```

## Mapping

| OpenCLI | Completion |
|---|---|
| `info.title` | the command name (`#compdef <name>`, `complete -c <name>`) |
| `commands[]` (recursive) | completable subcommands |
| a command's `options[]` | completable flags (`--name` + `aliases` → `-x` / `--xy`) |
| an option with `arguments[]` | a value-taking flag (`-r` in fish, `:value:` in zsh) |
| root `options` with `recursive: true` | global flags, offered on every command |

Adapted from the static fish/zsh generation approach (no runtime completion daemon); the OpenCLI
document is the single source of truth.

## Limitations

- The zsh generator completes the root and one level of subcommands (fish recurses deeper); deeply
  nested command trees aren't fully expanded yet.
- Positional `arguments` and `acceptedValues` (enum) aren't turned into value completions yet — only
  subcommands and flags complete. Flags that take a value are marked (`-r` / `:value:`) but their
  values aren't enumerated.
