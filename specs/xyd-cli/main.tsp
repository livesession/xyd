import "@xyd-js/typespec-opencli";

// The command surface is split one-file-per-command under `commands/`. The
// emitter orders commands by the order their declaring file is first imported
// (then by source position), so these imports are listed in the exact order the
// commands should appear in `opencli.json` — reorder here to reorder commands.
//
// Two conventions keep the split byte-stable:
//   1. Each command file is imported exactly once, only from here (or, for a
//      group, from that group's own main.tsp). Don't cross-import command files
//      — that would reorder by the earlier import with no error.
//   2. Describe commands/groups with `@doc(...)`, never a `/** */` doc-comment:
//      on a namespace reopened across files a doc-comment can win over `@doc`
//      (see commands/components/main.tsp). Leaf ops in a single file are safe.
import "./globals.tsp";
import "./commands/dev.tsp";
import "./commands/build.tsp";
import "./commands/serve.tsp";
import "./commands/install.tsp";
import "./commands/migrateme.tsp";
import "./commands/components/main.tsp";
import "./commands/opensdk.tsp";
import "./commands/completion.tsp";

using XydCli;

/**
 * The xyd CLI surface, authored in TypeSpec and compiled into the OpenCLI
 * document (`opencli.json`) that drives the Rust CLI via `opencli2rust`.
 *
 * `info.version` is injected at compile time via the emitter `version` option
 * (fed the `@xyd-js/cli` package version) — do not bake it in here.
 */
@cli(#{ title: "xyd", description: "Docs platform for future dev" })
namespace Xyd;
