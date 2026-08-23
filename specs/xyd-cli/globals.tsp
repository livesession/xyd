import "@xyd-js/typespec-opencli";

using XydCli;

namespace Xyd;

/** Root-level, recursive flags available on every command. */
@globalOptions
model Globals {
  @aka("h")
  @doc("Print this help message and exit")
  help?: boolean;

  @aka("v")
  @doc("Print the CLI version and exit")
  version?: boolean;

  @doc("Enable verbose output")
  verbose?: boolean;

  @aka("p")
  @doc("Port to run the dev server on")
  port?: int32;

  @aka("l")
  @doc("Set logging level (e.g. info, debug)")
  logLevel?: string;

  @doc("Enable debug output")
  debug?: boolean;
}
