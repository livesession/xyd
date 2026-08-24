import "@xyd-js/typespec-opencli";

using XydCli;

namespace Xyd.components;

@command
@doc("Install a xyd component into your project")
op install(
  @argument
  @doc("Name of the component to install")
  @XydCli.example("diagrams")
  component: "diagrams" | "opensdk",
): void;
