import "@xyd-js/typespec-opencli";

using XydCli;

namespace Xyd;

@command
@doc("Migrate your docs to the new xyd framework")
op migrateme(
  @argument
  @doc("Path to the docs directory to migrate")
  @XydCli.example("./path-to-docs")
  path: string,
): void;
