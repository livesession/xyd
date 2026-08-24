import "@xyd-js/typespec-opencli";

using XydCli;

@cli(#{ title: "xyd", description: "Docs platform for future dev" })
namespace Xyd;

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

@command
@doc("Run your docs locally in development mode")
op dev(): void;

@command
@doc("Build your docs")
op build(): void;

@command
@doc("Serve your built docs in production mode")
op serve(): void;

@command
@doc("Install the xyd framework manually")
op install(): void;

@command
@doc("Migrate your docs to the new xyd framework")
op migrateme(
  @argument
  @doc("Path to the docs directory to migrate")
  @XydCli.example("./path-to-docs")
  path: string,
): void;

@doc("Manage xyd components")
namespace components {
  @command
  @doc("Install a xyd component into your project")
  op install(
    @argument
    @doc("Name of the component to install")
    @XydCli.example("diagrams")
    component: "diagrams" | "opensdk",
  ): void;

  @command
  @doc("Remove an installed xyd component")
  op uninstall(
    @argument
    @doc("Name of the component to remove")
    @XydCli.example("opensdk")
    component: "opensdk",
  ): void;
}

@command
@doc("Run the OpenSDK toolchain (requires `xyd components install opensdk`)")
op opensdk(): void;

@command
@doc("Generate shell completions or the CLI OpenCLI document. Run `xyd completion <zsh|fish>` to print a script, `xyd completion install [shell]` to install it, or `xyd completion opencli` to print the OpenCLI document.")
op completion(
  @argument
  @doc("Shell to generate completions for")
  shell: "zsh" | "fish" | "install" | "opencli",
): void;
