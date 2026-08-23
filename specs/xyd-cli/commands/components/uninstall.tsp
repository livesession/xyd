import "@xyd-js/typespec-opencli";

using XydCli;

namespace Xyd.components;

@command
@doc("Remove an installed xyd component")
op uninstall(
  @argument
  @doc("Name of the component to remove")
  @XydCli.example("opensdk")
  component: "opensdk",
): void;
