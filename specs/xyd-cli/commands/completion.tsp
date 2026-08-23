import "@xyd-js/typespec-opencli";

using XydCli;

namespace Xyd;

@command
@doc("Generate shell completions or the CLI OpenCLI document. Run `xyd completion <zsh|fish>` to print a script, `xyd completion install [shell]` to install it, or `xyd completion opencli` to print the OpenCLI document.")
op completion(
  @argument
  @doc("Shell to generate completions for")
  shell: "zsh" | "fish" | "install" | "opencli",
): void;
